// Privacy-friendly analytics beacon. Inert unless VITE_ANALYTICS_URL and
// VITE_ANALYTICS_KEY are set at build time; respects Do Not Track.
const ENDPOINT = import.meta.env.VITE_ANALYTICS_URL as string | undefined;
const SITE_KEY = import.meta.env.VITE_ANALYTICS_KEY as string | undefined;
const enabled =
  typeof window !== "undefined" &&
  Boolean(ENDPOINT && SITE_KEY) &&
  (navigator as Navigator & { doNotTrack?: string }).doNotTrack !== "1";

function send(name: string, props?: Record<string, unknown>): void {
  if (!enabled) return;
  const body = JSON.stringify({
    key: SITE_KEY,
    name,
    path: window.location.pathname,
    referrer: document.referrer || undefined,
    lang: navigator.language,
    props,
  });
  const url = `${ENDPOINT}/collect`;
  // text/plain keeps the beacon a "simple" CORS request: no preflight, works cross-origin.
  const blob = new Blob([body], { type: "text/plain;charset=UTF-8" });
  if (navigator.sendBeacon) {
    navigator.sendBeacon(url, blob);
  } else {
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
  if (!/^https?:/i.test(href)) return null; // in-page anchors are not interesting
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

export function initAnalytics(): void {
  if (!enabled) return;
  trackEvent("pageview");

  document.addEventListener(
    "click",
    (event) => {
      const anchor = (event.target as Element | null)?.closest?.("a");
      if (!anchor) return;
      const href = anchor.getAttribute("href") || "";
      const kind = anchor.hasAttribute("download") ? "download" : clickKind(href);
      if (kind) trackEvent("click", { kind, target: href });
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
}
