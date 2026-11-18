// Privacy-friendly analytics beacon. Inert unless VITE_ANALYTICS_URL and
// VITE_ANALYTICS_KEY are set at build time; respects Do Not Track.
// Sends: pageview, click (with element/text/section), ui (button presses),
// section (scroll-through), scroll (depth 25/50/75/100), ping (30s heartbeat),
// exit (active_sec + max_scroll + reason: hidden|pagehide) plus semantic events
// emitted by components (loader, entry_cta, stack_key, project_*, resume,
// contact_*, social_click, assistant, cmdk, theme_switch, lang_switch) and one
// vitals event per page load (TTFB, FCP, LCP, CLS, INP, low_power).
// Each payload carries a 30-minute sliding session id, an anonymous 16-char
// visitor id, device metadata and the "me" flag (opt-in via ?me=1) so the owner
// can be told apart in the dashboard. `lang` is the browser language, while
// `props.site_lang` / `props.theme` describe the version of the site that was
// actually shown.
const ENDPOINT = import.meta.env.VITE_ANALYTICS_URL as string | undefined;
const SITE_KEY = import.meta.env.VITE_ANALYTICS_KEY as string | undefined;

const SESSION_WINDOW = 30 * 60 * 1000;
const SESSION_KEY = "et-sess";
const VISITOR_KEY = "et-vid";
const QUEUE_KEY = "et-queue";
const UTM_KEY = "et-utm";
const ME_KEY = "et-me";

/** Backend accepts a single event or a batch of up to 25. */
const QUEUE_LIMIT = 25;
/** Cold start on Render: retry the batch after 3s, 8s and 20s. */
const RETRY_DELAYS = [3_000, 8_000, 20_000];
const REQUEST_TIMEOUT = 5_000;
/** props values are short: strings are cut, numbers stay numbers. */
const PROP_MAX = 200;
/** Search query is cut to 120 characters (backend contract). */
const QUERY_MAX = 120;
/** A visible tab counts as active while the last input was at most 60s ago. */
const IDLE_LIMIT = 60_000;

const hasWindow = typeof window !== "undefined";

const enabled =
  hasWindow &&
  Boolean(ENDPOINT && SITE_KEY) &&
  (navigator as Navigator & { doNotTrack?: string }).doNotTrack !== "1";

export type EventProps = Record<string, string | number | boolean | undefined>;

type PayloadProps = Record<string, string | number>;

interface Payload {
  key: string;
  name: string;
  path: string;
  title?: string;
  referrer?: string;
  session: string;
  visitor: string;
  me: boolean;
  lang: string;
  screen: string;
  viewport: string;
  tz: string;
  client_ts: number;
  props: PayloadProps;
}

/* ------------------------------------------------------------------ ids --- */

/** 16 hex characters from 8 random bytes; never leaves the browser. */
function randomId(): string {
  try {
    const bytes = new Uint8Array(8);
    window.crypto.getRandomValues(bytes);
    return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
  } catch {
    return Math.random().toString(16).slice(2).padEnd(16, "0").slice(0, 16);
  }
}

function getVisitor(): string {
  if (!hasWindow) return "";
  try {
    const saved = localStorage.getItem(VISITOR_KEY);
    if (saved && saved.length === 16) return saved;
    const id = randomId();
    localStorage.setItem(VISITOR_KEY, id);
    return id;
  } catch {
    // private mode: a per-page id is still better than nothing
    return randomId();
  }
}

/**
 * Session id with a sliding 30-minute inactivity window: every event refreshes
 * the timestamp, so a long reading session stays one session while a >30 min
 * pause starts a new one.
 */
function getSession(): { id: string; utm: Record<string, string> } {
  const empty: { id: string; utm: Record<string, string> } = { id: "", utm: {} };
  if (!hasWindow) return empty;
  try {
    const now = Date.now();
    let id = "";
    try {
      const raw = window.sessionStorage.getItem(SESSION_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as { id?: string; ts?: number };
        if (parsed.id && typeof parsed.ts === "number" && now - parsed.ts < SESSION_WINDOW) id = parsed.id;
      }
    } catch {
      /* corrupted storage - regenerate below */
    }
    if (!id) id = randomId() + now.toString(36).slice(-6);
    try {
      window.sessionStorage.setItem(SESSION_KEY, JSON.stringify({ id, ts: now }));
    } catch {
      /* private mode */
    }

    let utm: Record<string, string> = {};
    try {
      const saved = window.sessionStorage.getItem(UTM_KEY);
      if (saved) {
        utm = JSON.parse(saved) as Record<string, string>;
      } else {
        const params = new URLSearchParams(window.location.search);
        for (const k of ["utm_source", "utm_medium", "utm_campaign"]) {
          const v = params.get(k);
          if (v) utm[k] = v.slice(0, 100);
        }
        if (Object.keys(utm).length) window.sessionStorage.setItem(UTM_KEY, JSON.stringify(utm));
      }
    } catch {
      /* ignore */
    }
    return { id, utm };
  } catch {
    return empty;
  }
}

function isMe(): boolean {
  if (!hasWindow) return false;
  try {
    const params = new URLSearchParams(window.location.search);
    if (params.get("me") === "1") localStorage.setItem(ME_KEY, "1");
    if (params.get("me") === "0") localStorage.removeItem(ME_KEY);
    return localStorage.getItem(ME_KEY) === "1";
  } catch {
    return false;
  }
}

/** In-site navigation is not a referrer: only other hosts are reported. */
function externalReferrer(): string | undefined {
  if (!hasWindow) return undefined;
  const ref = document.referrer;
  if (!ref) return undefined;
  try {
    const host = new URL(ref).hostname.replace(/^www\./, "");
    if (host === window.location.hostname.replace(/^www\./, "")) return undefined;
    return ref.slice(0, 300);
  } catch {
    return undefined;
  }
}

function timeZone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "";
  } catch {
    return "";
  }
}

/* -------------------------------------------------------- active time --- */

let activeMs = 0;
let segmentStart = 0;
let lastActivity = 0;
let maxScroll = 0;

function noteActivity(): void {
  lastActivity = Date.now();
  // Start a new measured segment at the first sign of life after an idle gap,
  // so no active second is lost between two 1s ticks.
  if (!segmentStart && document.visibilityState === "visible") segmentStart = lastActivity;
}

/**
 * Active = visible tab whose last mouse/key/scroll/touch input is < 60s old.
 * Time is accumulated in whole segments, so a hidden tab or an idle reader
 * never inflates active_sec.
 */
function tickActive(): void {
  if (!hasWindow) return;
  const now = Date.now();
  const active = document.visibilityState === "visible" && now - lastActivity < IDLE_LIMIT;
  if (active) {
    if (!segmentStart) segmentStart = now;
    activeMs += now - segmentStart;
    segmentStart = now;
  } else if (segmentStart) {
    activeMs += now - segmentStart;
    segmentStart = 0;
  }
}

export function getActiveSec(): number {
  tickActive();
  return Math.round(activeMs / 1000);
}

function readScrollDepth(): number {
  if (!hasWindow) return 0;
  const doc = document.documentElement;
  const total = Math.max(doc.scrollHeight, document.body ? document.body.scrollHeight : 0);
  if (!total) return 0;
  const seen = window.innerHeight + window.scrollY;
  return Math.min(100, Math.max(0, Math.round((seen / total) * 100)));
}

export function getMaxScroll(): number {
  if (!hasWindow) return 0;
  maxScroll = Math.max(maxScroll, readScrollDepth());
  return maxScroll;
}

/* --------------------------------------------------------- payloads --- */

function cleanProps(input?: EventProps): PayloadProps {
  const out: PayloadProps = {};
  if (!input) return out;
  for (const [key, value] of Object.entries(input)) {
    if (value === undefined || value === null) continue;
    if (typeof value === "boolean") {
      out[key] = value ? 1 : 0;
      continue;
    }
    if (typeof value === "number") {
      if (Number.isFinite(value)) out[key] = Math.round(value * 1000) / 1000;
      continue;
    }
    const text = value.trim().slice(0, key === "query" ? QUERY_MAX : PROP_MAX);
    if (text) out[key] = text;
  }
  return out;
}

/** Browser language: what the visitor speaks, not the version of the site. */
function browserLang(): string {
  if (!hasWindow) return "";
  return (navigator.language || document.documentElement.lang || "").slice(0, 16);
}

/**
 * Which build of the site was shown: `/ru` prefix or the prerendered <html lang>
 * for RU pages, plus the active theme. Component props win over these defaults.
 */
function siteProps(): PayloadProps {
  const html = document.documentElement;
  const lang = html.lang || (window.location.pathname.startsWith("/ru") ? "ru" : "en");
  return {
    site_lang: (lang || "en").slice(0, 8),
    theme: html.dataset.theme === "light" ? "light" : "dark",
  };
}

function buildPayload(name: string, props?: EventProps): Payload {
  const { id: session, utm } = getSession();
  const pageview = name === "pageview";
  const referrer = pageview ? externalReferrer() : undefined;
  const title = pageview ? document.title.slice(0, 200) : undefined;
  return {
    key: SITE_KEY ?? "",
    name,
    path: window.location.pathname,
    ...(title ? { title } : {}),
    ...(referrer ? { referrer } : {}),
    session,
    visitor: getVisitor(),
    me: isMe(),
    lang: browserLang(),
    screen: `${window.screen.width}x${window.screen.height}`,
    viewport: `${window.innerWidth}x${window.innerHeight}`,
    tz: timeZone(),
    client_ts: Date.now(),
    props: { ...utm, active_sec: getActiveSec(), ...siteProps(), ...cleanProps(props) },
  };
}

/* ------------------------------------------------------------ queue --- */

function isPayload(value: unknown): value is Payload {
  if (!value || typeof value !== "object") return false;
  const item = value as Partial<Payload>;
  return typeof item.name === "string" && typeof item.client_ts === "number" && typeof item.props === "object" && item.props !== null;
}

function readQueue(): Payload[] {
  if (!hasWindow) return [];
  try {
    const raw = window.sessionStorage.getItem(QUEUE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isPayload).slice(-QUEUE_LIMIT);
  } catch {
    return [];
  }
}

function writeQueue(items: Payload[]): void {
  if (!hasWindow) return;
  try {
    if (items.length) window.sessionStorage.setItem(QUEUE_KEY, JSON.stringify(items.slice(-QUEUE_LIMIT)));
    else window.sessionStorage.removeItem(QUEUE_KEY);
  } catch {
    /* storage full or blocked */
  }
}

let flushTimers: number[] = [];
let flushing = false;

/** Batch retry for a cold Render instance: 3s, 8s, 20s after the failure. */
function scheduleFlush(): void {
  if (!enabled || typeof window === "undefined") return;
  for (const timer of flushTimers) window.clearTimeout(timer);
  flushTimers = RETRY_DELAYS.map((delay) => window.setTimeout(() => void flushQueue(), delay));
}

async function flushQueue(): Promise<void> {
  if (!enabled || flushing) return;
  const queued = readQueue();
  if (!queued.length) return;
  flushing = true;
  try {
    const batch = queued.slice(0, QUEUE_LIMIT);
    const ok = await post(JSON.stringify(batch));
    // FIFO: events enqueued during the request stay; sent ones are dropped.
    if (ok) writeQueue(readQueue().slice(batch.length));
  } finally {
    flushing = false;
  }
}

/* ------------------------------------------------------------- send --- */

/** Returns true only when the collector acknowledged the write (2xx). */
async function post(body: string): Promise<boolean> {
  if (!enabled || !ENDPOINT) return false;
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT);
  try {
    const response = await fetch(`${ENDPOINT}/collect`, {
      method: "POST",
      // text/plain keeps the beacon a "simple" CORS request: no preflight, works cross-origin.
      headers: { "content-type": "text/plain" },
      body,
      keepalive: true,
      credentials: "omit",
      signal: controller.signal,
    });
    return response.ok;
  } catch {
    return false;
  } finally {
    window.clearTimeout(timer);
  }
}

function beacon(payloads: Payload[]): boolean {
  if (!enabled || !ENDPOINT || !navigator.sendBeacon) return false;
  const body = JSON.stringify(payloads.length === 1 ? payloads[0] : payloads);
  const blob = new Blob([body], { type: "text/plain;charset=UTF-8" });
  try {
    return navigator.sendBeacon(`${ENDPOINT}/collect`, blob);
  } catch {
    return false;
  }
}

async function sendPayload(payload: Payload): Promise<void> {
  // Pending events go first: a fresh event joins the queue instead of
  // overtaking an older batch, so the dashboard keeps the real order.
  if (readQueue().length) {
    writeQueue([...readQueue(), payload]);
    await flushQueue();
    if (readQueue().length) scheduleFlush();
    return;
  }
  const ok = await post(JSON.stringify(payload));
  if (!ok) {
    writeQueue([...readQueue(), payload]);
    scheduleFlush();
  }
}

export function trackEvent(name: string, props?: EventProps): void {
  if (!enabled) return;
  void sendPayload(buildPayload(name, props));
}

/* ------------------------------------------------------------ vitals --- */

interface VitalsState {
  ttfb: number;
  fcp: number;
  lcp: number;
  cls: number;
  inp: number;
  clsSupported: boolean;
}

const vitals: VitalsState = { ttfb: 0, fcp: 0, lcp: 0, cls: 0, inp: 0, clsSupported: false };
let vitalsStarted = false;
let vitalsSent = false;

/** At least one load timing arrived: enough to report something honest. */
function vitalsReady(): boolean {
  return vitals.lcp > 0 || vitals.fcp > 0 || vitals.ttfb > 0;
}

function supportsEntry(type: string): boolean {
  const supported = (PerformanceObserver as unknown as { supportedEntryTypes?: string[] }).supportedEntryTypes;
  return !supported || supported.includes(type);
}

/** Same weak-device signals the scene degrades on. */
function lowPowerDevice(): boolean {
  if (!hasWindow) return false;
  const nav = navigator as Navigator & { deviceMemory?: number; connection?: { saveData?: boolean } };
  if (nav.connection?.saveData) return true;
  if (typeof nav.deviceMemory === "number" && nav.deviceMemory <= 4) return true;
  if (typeof nav.hardwareConcurrency === "number" && nav.hardwareConcurrency <= 4) return true;
  try {
    return window.matchMedia("(max-width: 760px)").matches;
  } catch {
    return false;
  }
}

function vitalsProps(): EventProps {
  const props: EventProps = { low_power: lowPowerDevice() };
  if (vitals.ttfb > 0) props.ttfb = vitals.ttfb;
  if (vitals.fcp > 0) props.fcp = vitals.fcp;
  if (vitals.lcp > 0) props.lcp = vitals.lcp;
  if (vitals.inp > 0) props.inp = vitals.inp;
  // an honest CLS of 0 still counts, so it ships whenever the observer exists
  if (vitals.clsSupported) props.cls = vitals.cls;
  return props;
}

/** Standard PerformanceObserver only: no web-vitals package, no new weight. */
function observeVitals(): void {
  if (vitalsStarted || !hasWindow || typeof PerformanceObserver === "undefined") return;
  vitalsStarted = true;

  try {
    const nav = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming | undefined;
    if (nav && Number.isFinite(nav.responseStart)) {
      const ttfb = Math.round(nav.responseStart - Math.max(0, nav.requestStart));
      if (ttfb > 0) vitals.ttfb = ttfb;
    }
  } catch {
    /* navigation timing unavailable */
  }

  try {
    if (supportsEntry("paint")) {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.name === "first-contentful-paint") vitals.fcp = Math.round(entry.startTime);
        }
      });
      observer.observe({ type: "paint", buffered: true });
    }
  } catch {
    /* paint unsupported */
  }

  try {
    if (supportsEntry("largest-contentful-paint")) {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const entry = entries[entries.length - 1];
        if (entry) vitals.lcp = Math.round(entry.startTime);
      });
      observer.observe({ type: "largest-contentful-paint", buffered: true });
    }
  } catch {
    /* LCP unsupported */
  }

  try {
    if (supportsEntry("layout-shift")) {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          const shift = entry as PerformanceEntry & { value?: number; hadRecentInput?: boolean };
          if (typeof shift.value === "number" && !shift.hadRecentInput) {
            vitals.cls = Math.round((vitals.cls + shift.value) * 1000) / 1000;
          }
        }
      });
      observer.observe({ type: "layout-shift", buffered: true });
      vitals.clsSupported = true;
    }
  } catch {
    /* CLS unsupported (Safari) */
  }

  try {
    if (supportsEntry("event")) {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          const timing = entry as PerformanceEntry & { duration?: number; interactionId?: number };
          if ((timing.interactionId ?? 0) > 0) {
            vitals.inp = Math.max(vitals.inp, Math.round(timing.duration ?? 0));
          }
        }
      });
      // durationThreshold is part of the spec but missing from the TS lib type
      observer.observe({ type: "event", buffered: true, durationThreshold: 40 } as PerformanceObserverInit);
    }
  } catch {
    /* event timing unsupported */
  }

  try {
    if (supportsEntry("first-input")) {
      const observer = new PerformanceObserver((list) => {
        if (vitals.inp > 0) return;
        const entry = list.getEntries()[0] as PerformanceEntry & { duration?: number };
        if (entry) vitals.inp = Math.round(entry.duration ?? 0);
      });
      observer.observe({ type: "first-input", buffered: true });
    }
  } catch {
    /* first-input unsupported */
  }
}

/* -------------------------------------------------------- exit beacon --- */

/** Set while the tab is in the background: reset when the page is visible again. */
let hiddenExitSent = false;
/** One-shot per page load (and per bfcache restore): the final beacon. */
let pagehideSent = false;

/**
 * visibilitychange->hidden (Alt+Tab, another tab) sends an exit with
 * reason="hidden"; pagehide (close, reload, navigation away) always sends a
 * final exit with reason="pagehide", even when a hidden exit was already sent.
 * Both bypass the queue: sendBeacon survives the page being torn down.
 */
function sendExit(reason: "hidden" | "pagehide"): void {
  if (!enabled) return;
  // A real leave fires pagehide before visibilitychange->hidden: the final
  // beacon already carries the state, a second exit would double-count.
  if (reason === "hidden" && pagehideSent) return;
  if (reason === "hidden" ? hiddenExitSent : pagehideSent) return;
  if (reason === "hidden") hiddenExitSent = true;
  else pagehideSent = true;
  tickActive();
  maxScroll = Math.max(maxScroll, readScrollDepth());
  const pending: Payload[] = [...readQueue()];
  if (!vitalsSent && vitalsReady()) {
    // a visit shorter than 10s still reports its timings, in the same beacon
    vitalsSent = true;
    pending.push(buildPayload("vitals", vitalsProps()));
  }
  const payload = buildPayload("exit", { active_sec: getActiveSec(), max_scroll: maxScroll, reason });
  const batch = [...pending, payload].slice(-QUEUE_LIMIT);
  if (beacon(batch)) {
    writeQueue([]);
    return;
  }
  void post(JSON.stringify(batch)).then((ok) => {
    if (ok) writeQueue([]);
    else writeQueue([...readQueue(), payload]);
  });
}

/* ---------------------------------------------------- global listeners --- */

function clickKind(href: string): string | null {
  if (href.startsWith("mailto:")) return "mailto";
  if (href.endsWith(".pdf")) return "download";
  if (!/^https?:/i.test(href)) return null; // in-page navigation
  try {
    const host = new URL(href).hostname.replace(/^www\./, "");
    if (host === "github.com") return "github";
    if (host === "linkedin.com") return "linkedin";
    if (host === "t.me" || host === "telegram.me") return "telegram";
    return host;
  } catch {
    return "external";
  }
}

function selectorOf(el: Element): string {
  const parts: string[] = [];
  let cur: Element | null = el;
  let depth = 0;
  while (cur && depth < 4) {
    let part = cur.tagName.toLowerCase();
    if (cur.id) part += `#${cur.id}`;
    const cls = [...cur.classList].slice(0, 2).join(".");
    if (cls) part += `.${cls}`;
    parts.unshift(part);
    if (cur.id) break;
    cur = cur.parentElement;
    depth++;
  }
  return parts.join(" > ");
}

function sectionOf(el: Element | null): string | undefined {
  const section = el?.closest?.("[data-section]");
  return section instanceof HTMLElement ? section.dataset.section : undefined;
}

/** Icon-only buttons (☼ ☾ ⧉ ×) carry no readable text: such clicks never send glyphs. */
function readableText(el: Element): string {
  const text = (el.textContent ?? "").replace(/\s+/g, " ").trim();
  if (!text) return "";
  return /[\p{L}\p{N}]/u.test(text) ? text.slice(0, 60) : "";
}

function labelOf(el: Element): string {
  const explicit = el.getAttribute("data-track");
  if (explicit) return explicit.slice(0, 60);
  const text = readableText(el);
  if (text) return text;
  const aria = (el.getAttribute("aria-label") || el.getAttribute("title") || "").replace(/\s+/g, " ").trim();
  if (aria) return aria.slice(0, 60);
  return el.tagName.toLowerCase();
}

/** data-track-props="{\"key\":\"value\"}" merges extra short props into the event. */
function extraProps(el: Element): PayloadProps {
  const raw = el.getAttribute("data-track-props");
  if (!raw) return {};
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};
    const out: PayloadProps = {};
    for (const [key, value] of Object.entries(parsed as Record<string, unknown>)) {
      if (typeof value === "string") out[key] = value.slice(0, PROP_MAX);
      else if (typeof value === "number" && Number.isFinite(value)) out[key] = value;
      else if (typeof value === "boolean") out[key] = value ? 1 : 0;
    }
    return out;
  } catch {
    return {};
  }
}

function onGlobalClick(event: MouseEvent): void {
  const target = event.target instanceof Element ? event.target : null;
  if (!target) return;
  // Specialized helpers mark their element with data-track: the click is
  // already reported as a semantic event, the generic one would duplicate it.
  if (target.closest("[data-track]")) return;

  const anchor = target.closest("a");
  if (anchor) {
    const href = anchor.getAttribute("href") || "";
    const kind = anchor.hasAttribute("download") ? "download" : clickKind(href);
    trackEvent("click", {
      kind: kind ?? "anchor",
      target: href.slice(0, 200),
      text: labelOf(anchor),
      element: selectorOf(anchor),
      section: sectionOf(anchor),
      ...extraProps(anchor),
    });
    return;
  }

  const widget = target.closest("button, [role=button]");
  if (widget) {
    trackEvent("ui", {
      text: labelOf(widget),
      element: selectorOf(widget),
      section: sectionOf(widget),
      ...extraProps(widget),
    });
  }
}

/* ---------------------------------------------------------- sections --- */

let sectionsStarted = false;
let loaderFinished = false;

/**
 * Sections are observed only after the splash screen is gone: while the loader
 * covers the page every [data-section] would otherwise be reported at once.
 */
function startSections(): void {
  // initAnalytics() must have sent the pageview first: a section event before
  // it would look like a session without a landing page.
  if (sectionsStarted || !enabled || !analyticsStarted) return;
  sectionsStarted = true;
  const seen = new Set<string>();
  const io = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        const id = entry.target instanceof HTMLElement ? entry.target.dataset.section : undefined;
        if (entry.isIntersecting && id && !seen.has(id)) {
          seen.add(id);
          trackEvent("section", { id });
        }
      }
    },
    // -15%/-25% margins plus a small threshold: on mobile a 1900-2200px section
    // can never cover 40% of the viewport, so a tall section never fired.
    { rootMargin: "-15% 0px -25% 0px", threshold: 0.05 },
  );
  document.querySelectorAll("[data-section]").forEach((el) => io.observe(el));
}

/** Loader (complete or skip) and App/SiteProvider call this when the splash is gone. */
export function markLoaderDone(): void {
  loaderFinished = true;
  startSections();
}

/* --------------------------------------------------------------- init --- */

let analyticsStarted = false;

export function initAnalytics(): void {
  if (!enabled || analyticsStarted) return;
  analyticsStarted = true;

  noteActivity();
  trackEvent("pageview");
  observeVitals();

  document.addEventListener("click", onGlobalClick, true);

  // Activity signals for active_sec: only real input refreshes the 60s window.
  for (const type of ["mousemove", "keydown", "scroll", "touchstart", "pointerdown"] as const) {
    window.addEventListener(type, noteActivity, { passive: true });
  }
  window.addEventListener("focus", noteActivity);
  window.setInterval(tickActive, 1_000);

  // A visible tab with no loader (project page, catalog, 404) starts at once;
  // otherwise markLoaderDone() opens the gate, with a safety net in case the
  // splash unmounts without calling it.
  if (loaderFinished || document.documentElement.classList.contains("boot-done") || !document.querySelector(".loader-screen")) {
    startSections();
  }
  window.setTimeout(() => {
    if (!document.querySelector(".loader-screen")) startSections();
  }, 3_000);

  const depths = new Set<number>();
  let lastScroll = 0;
  window.addEventListener(
    "scroll",
    () => {
      const now = performance.now();
      if (now - lastScroll < 400) return;
      lastScroll = now;
      const depth = readScrollDepth();
      maxScroll = Math.max(maxScroll, depth);
      for (const d of [25, 50, 75, 100]) {
        if (depth >= d && !depths.has(d)) {
          depths.add(d);
          trackEvent("scroll", { depth: d });
        }
      }
    },
    { passive: true },
  );

  window.setInterval(() => {
    if (document.visibilityState === "visible") trackEvent("ping");
  }, 30_000);

  // One vitals event per page load, and only for a page the visitor actually saw.
  window.setTimeout(() => {
    if (vitalsSent || document.visibilityState !== "visible" || !vitalsReady()) return;
    vitalsSent = true;
    trackEvent("vitals", vitalsProps());
  }, 10_000);

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      // Alt+Tab / another tab: reported as hidden, pagehide still owes a final beacon.
      sendExit("hidden");
      return;
    }
    // Back from the background: a fresh visible period, a fresh hidden exit.
    hiddenExitSent = false;
    noteActivity();
  });
  window.addEventListener("pagehide", () => sendExit("pagehide"));
  // bfcache restore is a new visible period on the same page: both flags reset.
  window.addEventListener("pageshow", (event) => {
    if (!event.persisted) return;
    hiddenExitSent = false;
    pagehideSent = false;
    noteActivity();
  });

  // Events queued on a previous page (cold start, aborted fetch) are retried now.
  if (readQueue().length) scheduleFlush();
}
