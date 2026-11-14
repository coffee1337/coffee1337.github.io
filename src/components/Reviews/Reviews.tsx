import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { testimonials } from "../../content/testimonials";
import { useSite } from "../../context/site";
import { useReveal } from "../../hooks/useMotion";
import { ScrambleHeading } from "../Scramble/ScrambleHeading";

const AUTOPLAY_MS = 7000;

export function Reviews() {
  const { dict, lang } = useSite();
  const ref = useReveal<HTMLElement>();
  const r = dict.sections.reviews;
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const touchX = useRef<number | null>(null);

  const count = testimonials.length;
  const go = useCallback((delta: number) => setIndex((i) => (i + delta + count) % count), [count]);

  useEffect(() => {
    if (count < 2 || paused) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = window.setInterval(() => go(1), AUTOPLAY_MS);
    return () => window.clearInterval(id);
  }, [count, paused, go]);

  if (count === 0) return null;

  const item = testimonials[index];

  return (
    <section
      id="reviews"
      data-section="reviews"
      ref={ref}
      className="section-anchor relative z-[2] py-20 md:py-28"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={(event) => {
        touchX.current = event.touches[0].clientX;
      }}
      onTouchEnd={(event) => {
        if (touchX.current === null) return;
        const delta = event.changedTouches[0].clientX - touchX.current;
        if (Math.abs(delta) > 48) go(delta > 0 ? -1 : 1);
        touchX.current = null;
      }}
      onKeyDown={(event) => {
        if (event.key === "ArrowLeft") go(-1);
        if (event.key === "ArrowRight") go(1);
      }}
      tabIndex={0}
      aria-roledescription="carousel"
      aria-label={r.label}
    >
      <div className="site-wrap">
        <div className="mb-8 flex items-baseline justify-between gap-4">
          <p className="kicker">§{r.index} / {r.label}</p>
          <p className="mono text-[10px] tabular-nums text-[var(--ink-faint)]">
            {String(index + 1).padStart(2, "0")} / {String(count).padStart(2, "0")}
          </p>
        </div>

        <ScrambleHeading text={r.title} className="display text-[clamp(2rem,4vw,3.4rem)]" />

        <div className="mt-8 min-h-[220px]">
          <AnimatePresence mode="wait">
            <motion.blockquote
              key={item.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.35, ease: [0.2, 0.8, 0.2, 1] }}
              className="relative border-l border-[var(--accent)] pl-6"
            >
              <span className="absolute -left-3 -top-2 font-display text-5xl text-[var(--accent)]" aria-hidden>
                “
              </span>
              <p className="max-w-3xl font-body text-[clamp(1.1rem,2vw,1.5rem)] leading-relaxed text-[var(--ink)]">
                {item.quote[lang]}
              </p>
              <footer className="mt-5 flex items-center gap-3 font-mono text-xs text-[var(--ink-dim)]">
                {item.avatar && <img src={item.avatar} alt="" width={28} height={28} className="rounded-full" />}
                <span className="text-[var(--ink)]">{item.author}</span>
                <span aria-hidden>·</span>
                <span>{item.role[lang]}</span>
                {item.link && (
                  <a href={item.link} target="_blank" rel="noopener noreferrer" className="text-[var(--accent)]">
                    ↗
                  </a>
                )}
              </footer>
            </motion.blockquote>
          </AnimatePresence>
        </div>

        <div className="mt-8 flex items-center gap-3">
          <div className="flex gap-1.5" aria-hidden>
            {testimonials.map((t, i) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setIndex(i)}
                className={`h-1.5 w-8 transition-colors ${i === index ? "bg-[var(--accent)]" : "bg-[var(--line)]"}`}
                tabIndex={-1}
              />
            ))}
          </div>
          <div className="ml-auto flex gap-2">
            <button
              type="button"
              onClick={() => go(-1)}
              aria-label={r.prev}
              className="grid h-9 w-9 place-items-center rounded-full border border-[var(--line)] hover:border-[var(--accent)]"
            >
              ←
            </button>
            <button
              type="button"
              onClick={() => go(1)}
              aria-label={r.next}
              className="grid h-9 w-9 place-items-center rounded-full border border-[var(--line)] hover:border-[var(--accent)]"
            >
              →
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
