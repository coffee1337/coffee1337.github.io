import { useEffect, useRef, useState } from "react";
import { useSite } from "../../context/site";

const VISIT_KEY = "et-seen";
const CHAOS = "#/8}~%*01<>_[]=+·◉●";

type LogLine = { text: string; at: number };

function paintFrame(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  t: number,
  reduced: boolean,
) {
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue("--bg").trim() || "#0c0a09";
  ctx.fillRect(0, 0, w, h);
  const ink = getComputedStyle(document.documentElement).getPropertyValue("--ink").trim() || "#f3efe8";
  const accent = getComputedStyle(document.documentElement).getPropertyValue("--accent").trim() || "#c4562a";
  const faint = getComputedStyle(document.documentElement).getPropertyValue("--ink-faint").trim() || "#7f7972";
  const layers = 5;
  const cols = [6, 8, 10, 8, 6];
  const cx = w * 0.52;
  const cy = h * 0.42;
  const gather = reduced ? 1 : Math.min(1, t / 900);
  const pulse = t < 900 ? 0 : Math.min(1, (t - 900) / 1100);
  const scatter = t < 2700 ? 0 : Math.min(1, (t - 2700) / 300);
  ctx.font = "13px ui-monospace, monospace";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  for (let l = 0; l < layers; l++) {
    const n = cols[l];
    const x = cx + (l - 2) * Math.min(120, w * 0.12);
    for (let i = 0; i < n; i++) {
      const y = cy + (i - (n - 1) / 2) * 28;
      const jx = (1 - gather) * Math.sin(i * 12.7 + l) * 80;
      const jy = (1 - gather) * Math.cos(i * 7.3 + l) * 60;
      const sx = (Math.random() - 0.5) * scatter * 220;
      const sy = (Math.random() - 0.5) * scatter * 180;
      const lit = pulse > 0 && Math.abs((pulse * 4.2) - l) < 0.55;
      ctx.fillStyle = lit ? accent : ink;
      ctx.globalAlpha = (0.35 + gather * 0.55) * (1 - scatter);
      const glyph = gather < 0.85 ? CHAOS[(i * 5 + l + Math.floor(t / 40)) % CHAOS.length] : i % 2 ? "◉" : "●";
      ctx.fillText(glyph, x + jx + sx, y + jy + sy);
      if (l < layers - 1 && gather > 0.4) {
        ctx.globalAlpha = 0.22 * gather * (1 - scatter);
        ctx.fillStyle = faint;
        const n2 = cols[l + 1];
        const x2 = cx + (l + 1 - 2) * Math.min(120, w * 0.12);
        const y2 = cy + ((i % n2) - (n2 - 1) / 2) * 28;
        for (let d = 0; d < 8; d++) {
          const p = d / 8;
          ctx.fillText("·", x + (x2 - x) * p, y + (y2 - y) * p);
        }
      }
    }
  }
  ctx.globalAlpha = 1;
}

export function Loader({ onDone }: { onDone: () => void }) {
  const { dict, reduced } = useSite();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [leaving, setLeaving] = useState(false);
  const [log, setLog] = useState<LogLine[]>([]);
  const [tokens, setTokens] = useState<string[]>([]);
  const [bar, setBar] = useState(0);
  const doneRef = useRef(onDone);
  doneRef.current = onDone;
  const skipRef = useRef(false);

  const seen = typeof sessionStorage !== "undefined" && sessionStorage.getItem(VISIT_KEY) === "1";
  const duration = reduced ? 600 : seen ? 700 : 3000;

  const finish = () => {
    if (skipRef.current) return;
    skipRef.current = true;
    setLeaving(true);
    try {
      sessionStorage.setItem(VISIT_KEY, "1");
    } catch {
      /* private mode */
    }
    window.setTimeout(() => doneRef.current(), reduced ? 120 : 220);
  };

  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, []);

  // Критический оверлей из index.html снимаем, как только лоадер отрисовался.
  useEffect(() => {
    document.documentElement.classList.add("boot-done");
    document.getElementById("boot")?.remove();
  }, []);

  useEffect(() => {
    const onSkip = () => finish();
    window.addEventListener("keydown", onSkip);
    window.addEventListener("pointerdown", onSkip);
    return () => {
      window.removeEventListener("keydown", onSkip);
      window.removeEventListener("pointerdown", onSkip);
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      window.setTimeout(finish, duration);
      return;
    }
    const start = performance.now();
    let raf = 0;
    const resize = () => {
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      canvas.width = Math.floor(window.innerWidth * dpr);
      canvas.height = Math.floor(window.innerHeight * dpr);
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);

    const logs = dict.loader.lines;
    const nameTokens = dict.loader.tokens;
    const shown = new Set<number>();

    const step = (now: number) => {
      const t = Math.min(duration, now - start);
      const p = t / duration;
      paintFrame(ctx, window.innerWidth, window.innerHeight, reduced ? duration : t, reduced);
      if (!reduced && duration >= 2000) {
        logs.forEach((line, i) => {
          if (t >= i * 160 && !shown.has(i)) {
            shown.add(i);
            setLog((prev) => [...prev, { text: line, at: i }]);
          }
        });
        const pct = Math.min(100, Math.floor(Math.max(0, t - 900) / 11));
        setBar(pct);
        const tokenCount = Math.min(nameTokens.length, Math.max(0, Math.floor((t - 2000) / 140)));
        setTokens(nameTokens.slice(0, tokenCount));
      } else if (reduced) {
        setLog(logs.map((text, i) => ({ text, at: i })));
        setBar(100);
        setTokens(nameTokens);
      }
      if (p < 1 && !skipRef.current) raf = requestAnimationFrame(step);
      else finish();
    };
    raf = requestAnimationFrame(step);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, [dict.loader.lines, dict.loader.tokens, duration, reduced]);

  const filled = Math.round(bar / 5);
  const barText = `${"▓".repeat(filled)}${"░".repeat(Math.max(0, 20 - filled))} ${bar}%`;

  return (
    <div
      className="loader-screen"
      style={{ opacity: leaving ? 0 : 1 }}
      role="status"
      aria-live="polite"
      aria-label={dict.loader.forming}
    >
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" aria-hidden />
      <div className="relative z-[1] flex h-full w-full flex-col justify-between p-6 md:p-10">
        <pre className="font-mono text-[12px] leading-6 text-[var(--ink-dim)]">
          {log.map((line) => (
            <div key={line.at}>{line.text}</div>
          ))}
        </pre>
        <div className="mb-[12vh]">
          {!reduced && tokens.length > 0 && (
            <p className="font-mono text-sm text-[var(--ink)]">
              {tokens.map((tok) => (
                <span key={tok} className="mr-3">
                  {tok}
                  <span className="ml-1 text-[10px] text-[var(--ink-faint)]">p=0.97</span>
                </span>
              ))}
            </p>
          )}
          <p className="mt-4 font-mono text-[12px] tracking-[0.08em] text-[var(--accent)]">{barText}</p>
          <p className="kicker mt-3">{dict.loader.forming}</p>
        </div>
      </div>
      <button
        type="button"
        className="absolute bottom-6 right-6 z-[2] font-mono text-[11px] uppercase tracking-[0.14em] text-[var(--ink-faint)]"
        onClick={(event) => {
          event.stopPropagation();
          finish();
        }}
      >
        {dict.loader.skip}
      </button>
    </div>
  );
}
