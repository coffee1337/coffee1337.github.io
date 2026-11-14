import { useEffect, useMemo, useRef } from "react";
import { LOG_LINES } from "../../content/logs";
import { useSite } from "../../context/site";

export function HeroLogs() {
  const { reduced } = useSite();
  const text = useMemo(() => [...LOG_LINES, ...LOG_LINES].join("\n"), []);
  const ref = useRef<HTMLPreElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || reduced) return;
    let offset = 0;
    let raf = 0;
    let last = performance.now();
    const step = (now: number) => {
      const dt = Math.min(48, now - last);
      last = now;
      offset = (offset + dt * 0.018) % (el.scrollHeight / 2);
      el.style.transform = `translate3d(0, ${-offset}px, 0)`;
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [reduced]);

  return (
    <div
      className="hero-logs pointer-events-none absolute inset-0 overflow-hidden"
      aria-hidden
    >
      <pre ref={ref} className="hero-logs-text">
        {text}
      </pre>
    </div>
  );
}
