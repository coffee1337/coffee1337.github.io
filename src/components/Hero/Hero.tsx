import { useEffect, useRef, useState } from "react";
import { useSite } from "../../context/site";
import { useMagnetic } from "../../hooks/useMotion";
import { NeuralOrb } from "../NeuralOrb/NeuralOrb";
import { NeuralMark } from "../Brand/NeuralMark";

export function Hero() {
  const { dict, reduced, loaderDone, lowPower } = useSite();
  const exploreRef = useMagnetic<HTMLAnchorElement>();
  const root = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const [orbLive, setOrbLive] = useState(true);
  const showOrb = !lowPower || !window.matchMedia("(max-width: 760px)").matches;

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => setOrbLive(entry.isIntersecting),
      { threshold: 0 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    const el = root.current;
    if (!el || !loaderDone || reduced) return;
    let ctx: { revert: () => void } | undefined;
    let dead = false;
    void import("gsap").then(({ default: gsap }) => {
      if (dead) return;
      const lines = el.querySelectorAll<HTMLElement>("[data-line]");
      const fades = el.querySelectorAll<HTMLElement>("[data-fade]");
      gsap.set(lines, { yPercent: 110 });
      gsap.set(fades, { opacity: 0, y: 14 });
      ctx = gsap.context(() => {
        gsap.to(lines, { yPercent: 0, duration: 1, ease: "power3.out", stagger: 0.06 });
        gsap.to(fades, { opacity: 1, y: 0, duration: 0.7, delay: 0.28, stagger: 0.07 });
      }, el);
    });
    return () => {
      dead = true;
      ctx?.revert();
    };
  }, [loaderDone, reduced]);

  const roleLines = dict.hero.role.split("\n");

  return (
    <section id="top" data-section="top" ref={root} className="section-anchor relative flex min-h-[100svh] items-end pb-16 pt-28 md:items-center md:pb-0">
      {showOrb && orbLive && <NeuralOrb stageRef={stageRef} />}
      <div className="site-wrap relative z-[2] grid items-center gap-8 lg:grid-cols-[minmax(0,1.25fr)_minmax(240px,0.9fr)]">
        <div className="min-w-0">
          <p data-fade className="kicker">{dict.hero.label}</p>
          <h1 className="hero-name display mt-5">
            <span className="reveal-line"><span data-line>{dict.hero.first}</span></span>
            <span className="reveal-line">
              <span data-line className="text-[color-mix(in_srgb,var(--text)_76%,var(--accent))]">{dict.hero.last}</span>
            </span>
          </h1>
          <p className="mt-6 max-w-xl text-xl leading-snug text-[var(--muted)] md:text-2xl">
            {roleLines.map((line) => (
              <span key={line} className="reveal-line"><span data-line>{line}</span></span>
            ))}
          </p>
          <p data-fade className="mt-6 max-w-lg text-[var(--muted)]">{dict.hero.summary}</p>
          <div data-fade className="mt-8 flex flex-wrap gap-3">
            <a ref={exploreRef} href="#projects" className="btn btn-primary">{dict.hero.explore}</a>
            <a href="#contact" className="btn btn-ghost">{dict.hero.contact}</a>
          </div>
          <p data-fade className="mt-8 flex items-center gap-3 text-sm text-[var(--muted)]">
            <span className="status-dot" aria-hidden />
            {dict.hero.available}
            <span className="hidden sm:inline">· {dict.hero.locationNote}</span>
          </p>
        </div>
        <div ref={stageRef} className="hero-stage" aria-hidden>
          {!showOrb && <NeuralMark className="h-48 w-48 text-[var(--text)]" />}
          <p className="mono absolute bottom-2 right-2 text-[10px] text-[var(--faint)]">CORE / ONLINE</p>
        </div>
      </div>
    </section>
  );
}
