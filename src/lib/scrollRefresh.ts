// Shared GSAP/ScrollTrigger loader + отложенный refresh (§10.1).
// ScrollTrigger меряет позиции триггеров; если измерить до загрузки шрифтов,
// картинок или до старта Lenis — стартовые точки съезжают и блоки «виснут»
// с opacity: 0 до первого скролла.

type ScrollTriggerApi = typeof import("gsap/ScrollTrigger").ScrollTrigger;
type GsapApi = typeof import("gsap").default;

let cached: Promise<{ gsap: GsapApi; ScrollTrigger: ScrollTriggerApi }> | null = null;

export function getScrollTrigger(): Promise<{ gsap: GsapApi; ScrollTrigger: ScrollTriggerApi }> {
  if (!cached) {
    cached = Promise.all([import("gsap"), import("gsap/ScrollTrigger")]).then(
      ([gsapMod, stMod]) => {
        const gsap = gsapMod.default;
        const { ScrollTrigger } = stMod;
        gsap.registerPlugin(ScrollTrigger);
        return { gsap, ScrollTrigger };
      },
    );
  }
  return cached;
}

/** Пересчитать триггеры на следующем кадре (после того, как ляжет layout). */
export function refreshScrollTriggers(): void {
  void getScrollTrigger().then(({ ScrollTrigger }) => {
    requestAnimationFrame(() => ScrollTrigger.refresh());
  });
}

/**
 * Вызывается один раз из клиентского entry: держит позиции триггеров
 * актуальными после загрузки веб-шрифтов и всех изображений страницы.
 */
export function installScrollTriggerRefresh(): void {
  if (typeof window === "undefined") return;
  document.fonts.ready.then(() => refreshScrollTriggers());
  window.addEventListener("load", () => refreshScrollTriggers());
}
