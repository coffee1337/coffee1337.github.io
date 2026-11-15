import { useEffect, useMemo, useRef } from "react";
import { LOG_LINES } from "../../content/logs";
import { useSite } from "../../context/site";

/**
 * Фоновые логи hero: один transform-слой, петля без видимого шва.
 * scrollHeight читается только при resize, вне экрана и в скрытой вкладке
 * анимация останавливается.
 */
export function HeroLogs() {
  const { reduced } = useSite();
  const text = useMemo(() => [...LOG_LINES, ...LOG_LINES].join("\n"), []);
  const ref = useRef<HTMLPreElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    const wrap = wrapRef.current;
    if (!el || !wrap || reduced) return;
    let offset = 0;
    let half = 0;
    let raf = 0;
    let last = 0;
    let visible = true;
    let running = false;

    const measure = () => {
      // полная высота дублированного списка; петля — ровно половина
      half = el.scrollHeight / 2;
    };

    const step = (now: number) => {
      raf = requestAnimationFrame(step);
      if (!running) {
        last = now;
        return;
      }
      const dt = Math.min(48, now - last);
      last = now;
      if (half > 0) {
        offset = (offset + dt * 0.018) % half;
        el.style.transform = `translate3d(0, ${-offset}px, 0)`;
      }
    };

    const sync = () => {
      const shouldRun = visible && document.visibilityState === "visible" && !reduced;
      if (shouldRun === running) return;
      running = shouldRun;
      last = performance.now();
    };

    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    const io = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting;
        sync();
      },
      { threshold: 0.01 },
    );
    io.observe(wrap);
    document.addEventListener("visibilitychange", sync);
    document.fonts.ready.then(measure).catch(() => undefined);
    sync();
    raf = requestAnimationFrame(step);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      document.removeEventListener("visibilitychange", sync);
    };
  }, [reduced]);

  return (
    <div
      ref={wrapRef}
      className="hero-logs pointer-events-none absolute inset-0 overflow-hidden"
      aria-hidden
    >
      <pre ref={ref} className="hero-logs-text">
        {text}
      </pre>
    </div>
  );
}
