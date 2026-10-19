// Privacy-friendly analytics beacon. Inert unless VITE_ANALYTICS_URL and
// VITE_ANALYTICS_KEY are set at build time; respects Do Not Track.
// Sends: pageview, click (with element/text/section), ui (button presses),
// section (scroll-through), scroll (depth 25/50/75/100), ping (30s heartbeat),
// exit (time on page), lang_switch. Each payload carries a 30-minute session id
// and the "me" flag (opt-in via ?me=1) so the owner can be told apart in the dashboard.
const ENDPOINT = import.meta.env.VITE_ANALYTICS_URL as string | undefined;
const SITE_KEY = import.meta.env.VITE_ANALYTICS_KEY as string | undefined;

const SESSION_WINDOW = 30 * 60 * 1000;
const SESSION_KEY = "et-sess";
const UTM_KEY = "et-utm";
const ME_KEY = "et-me";

const hasWindow = typeof window !== "undefined";
const enabled =
  hasWindow &&
  Boolean(ENDPOINT && SITE_KEY) &&
  (navigator as Navigator & { doNotTrack?: string }).doNotTrack !== "1";

function getSession(): { id: string; utm: Record<string, string> } {
  const empty: { id: string; utm: Record<string, string> } = { id: "", utm: {} };
  if (!hasWindow) return empty;
  try {
    const now = Date.now();
    let id = "";
    try {
      const raw = window.sessionStorage.getItem(SESSION_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as { id: string; ts: number };
        if (now - parsed.ts < SESSION_WINDOW) id = parsed.id;
      }
    } catch {
      /* corrupted storage - regenerate below */
    }
    if (!id) id = `${crypto.randomUUID().slice(0, 13)}-${now.toString(36)}`;
    try {
      window.sessionStorage.setItem(SESSION_KEY, JSON.stringify({ id, ts: now }));
    } catch {
      /* private mode */
    }

    let utm: Record<string, string> = {};
    try {
      const saved = window.sessionStorage.getItem(UTM_KEY);
      if (saved) {
        utm = JSON.parse(saved);
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

function send(name: string, props?: Record<string, unknown>): void {
  if (!enabled) return;
  const { id: session, utm } = getSession();
  const body = JSON.stringify({
    key: SITE_KEY,
    name,
    path: window.location.pathname,
    title: name === "pageview" ? document.title.slice(0, 200) : undefined,
    referrer: name === "pageview" ? document.referrer || undefined : undefined,
    session,
    me: isMe(),
    lang: navigator.language,
    props: { ...utm, ...props },
  });
  const url = `${ENDPOINT}/collect`;
  // text/plain keeps the beacon a "simple" CORS request: no preflight, works cross-origin.
  const blob = new Blob([body], { type: "text/plain;charset=UTF-8" });
  if (!navigator.sendBeacon || !navigator.sendBeacon(url, blob)) {
    void fetch(url, { method: "POST", body, headers: { "content-type": "text/plain" }, keepalive: true }).catch(
      () => {},
    );
  }
}

export function trackEvent(name: string, props?: Record<string, unknown>): void {
  send(name, props);
}

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
  const section = el?.closest?.("[data-section]") as HTMLElement | null;
  return section?.dataset.section;
}

export function initAnalytics(): void {
  if (!enabled) return;
  trackEvent("pageview");

  document.addEventListener(
    "click",
    (event) => {
      const target = event.target as Element | null;
      const anchor = target?.closest?.("a");
      if (anchor) {
        const href = anchor.getAttribute("href") || "";
        const kind = anchor.hasAttribute("download") ? "download" : clickKind(href);
        trackEvent("click", {
          kind: kind ?? "anchor",
          target: href.slice(0, 200),
          text: (anchor.textContent || "").trim().slice(0, 60),
          element: selectorOf(anchor),
          section: sectionOf(anchor),
        });
        return;
      }
      const widget = target?.closest?.("button, [role=button]");
      if (widget) {
        trackEvent("ui", {
          text: (widget.textContent || "").trim().slice(0, 40),
          element: selectorOf(widget),
          section: sectionOf(widget),
        });
      }
    },
    true,
  );

  const seen = new Set<string>();
  const io = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        const id = (entry.target as HTMLElement).dataset.section;
        if (entry.isIntersecting && id && !seen.has(id)) {
          seen.add(id);
          trackEvent("section", { id });
        }
      }
    },
    { threshold: 0.4 },
  );
  document.querySelectorAll("[data-section]").forEach((el) => io.observe(el));

  const depths = new Set<number>();
  let lastScroll = 0;
  window.addEventListener(
    "scroll",
    () => {
      const now = performance.now();
      if (now - lastScroll < 400) return;
      lastScroll = now;
      const doc = document.documentElement;
      if (!doc.scrollHeight) return;
      const max = Math.round(((window.innerHeight + window.scrollY) / doc.scrollHeight) * 100);
      for (const d of [25, 50, 75, 100]) {
        if (max >= d && !depths.has(d)) {
          depths.add(d);
          trackEvent("scroll", { depth: d });
        }
      }
    },
    { passive: true },
  );

  const started = performance.now();
  window.setInterval(() => {
    if (document.visibilityState === "visible") trackEvent("ping");
  }, 30_000);
  window.addEventListener("pagehide", () => {
    trackEvent("exit", { dwell: Math.round((performance.now() - started) / 1000) });
  });
}
