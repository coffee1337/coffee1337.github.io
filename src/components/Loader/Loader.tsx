import { useEffect, useRef, useState } from "react";
import { useSite } from "../../context/site";

const VISIT_KEY = "et-seen";
const BITS = ["1", "0", "1", "0", "0", "1", "1", "0", "1", "0", "1", "1", "0", "1"];

export function Loader({ onDone }: { onDone: () => void }) {
  const { dict, reduced, setOrbMode, assembleRef } = useSite();
  const [progress, setProgress] = useState(0);
  const [leaving, setLeaving] = useState(false);
  const seen = sessionStorage.getItem(VISIT_KEY) === "1";
  const duration = reduced ? 260 : seen ? 800 : 1500;
  const doneRef = useRef(onDone);
  doneRef.current = onDone;

  useEffect(() => {
    setOrbMode("assemble");
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [setOrbMode]);

  useEffect(() => {
    const start = performance.now();
    let raf = 0;
    let timeout = 0;
    const step = (now: number) => {
      const p = Math.min(1, (now - start) / duration);
      setProgress(p);
      assembleRef.current = reduced ? 1 : p;
      if (p < 1) raf = requestAnimationFrame(step);
      else {
        setLeaving(true);
        sessionStorage.setItem(VISIT_KEY, "1");
        timeout = window.setTimeout(() => doneRef.current(), reduced ? 120 : 420);
      }
    };
    raf = requestAnimationFrame(step);
    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(timeout);
    };
  }, [assembleRef, duration, reduced]);

  return (
    <div className="loader-screen" style={{ opacity: leaving ? 0 : 1 }} role="status" aria-live="polite" aria-label={dict.loader.forming}>
      <div className="loader-bits" aria-hidden>
        {BITS.map((bit, i) => {
          const angle = (i / BITS.length) * Math.PI * 2 - Math.PI / 2;
          const radius = 28 + progress * 92;
          const spin = progress * 2.4;
          const x = Math.cos(angle + spin) * radius;
          const y = Math.sin(angle + spin) * radius * 0.92;
          return (
            <span
              key={i}
              className="loader-bit"
              style={{
                transform: `translate(-50%, -50%) translate(${x}px, ${y}px)`,
                opacity: Math.max(0, 0.85 - progress * 0.9),
              }}
            >
              {bit}
            </span>
          );
        })}
      </div>
      <div className="loader-caption">
        <p className="display text-3xl sm:text-5xl">Egor Trefilov</p>
        <p className="kicker mt-3">{dict.loader.forming}</p>
        <div className="mt-4 h-px w-36 bg-[var(--line)]">
          <div className="h-px bg-[var(--lime)]" style={{ width: `${progress * 100}%` }} />
        </div>
      </div>
    </div>
  );
}
