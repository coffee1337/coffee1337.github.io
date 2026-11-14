import { useEffect } from "react";
import { useSite } from "../context/site";
import { getScrollTrigger, refreshScrollTriggers } from "../lib/scrollRefresh";

export function useSmoothScroll(enabled: boolean) {
  const { reduced } = useSite();

  useEffect(() => {
    if (!enabled || reduced) return;
    let destroyed = false;
    let lenis: { raf: (t: number) => void; destroy: () => void } | null = null;
    let raf = 0;

    void import("lenis").then(({ default: Lenis }) => {
      if (destroyed) return;
      const instance = new Lenis({
        duration: 1.05,
        smoothWheel: true,
        wheelMultiplier: 0.9,
        touchMultiplier: 1.1,
      });
      lenis = instance;
      // ScrollTrigger следит за нативным скроллом — Lenis должен его дёргать.
      instance.on("scroll", () => {
        void getScrollTrigger().then(({ ScrollTrigger }) => ScrollTrigger.update());
      });
      const loop = (time: number) => {
        instance.raf(time);
        raf = requestAnimationFrame(loop);
      };
      raf = requestAnimationFrame(loop);
      // §10.1: после инициализации Lenis позиции триггеров надо перемерить.
      refreshScrollTriggers();
    });

    return () => {
      destroyed = true;
      cancelAnimationFrame(raf);
      lenis?.destroy();
    };
  }, [enabled, reduced]);
}
