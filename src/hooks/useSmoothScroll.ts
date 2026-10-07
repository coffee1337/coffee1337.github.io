import { useEffect } from "react";
import { useSite } from "../context/site";

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
      const loop = (time: number) => {
        instance.raf(time);
        raf = requestAnimationFrame(loop);
      };
      raf = requestAnimationFrame(loop);
    });

    return () => {
      destroyed = true;
      cancelAnimationFrame(raf);
      lenis?.destroy();
    };
  }, [enabled, reduced]);
}
