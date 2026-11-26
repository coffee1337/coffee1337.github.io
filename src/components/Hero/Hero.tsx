import { useEffect, useRef, useState } from "react";
import { links, resumePdfFor } from "../../content";
import { useSite } from "../../context/site";
import { useMagnetic } from "../../hooks/useMotion";
import { trackEvent } from "../../analytics";
import { CopyButton } from "../CopyButton";
import { ScrambleHeading } from "../Scramble/ScrambleHeading";
import github from "../../generated/github.json";
import { EmbeddingSpace } from "./EmbeddingSpace";
import { HeroLogs } from "./HeroLogs";

function moscowClock() {
  return new Intl.DateTimeFormat("ru-RU", {
    timeZone: "Europe/Moscow",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(new Date());
}

function CountUp({ value }: { value: number }) {
  const { reduced, loaderDone } = useSite();
  const [shown, setShown] = useState(reduced ? value : 0);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (reduced || !loaderDone) {
      setShown(value);
      return;
    }
    const el = ref.current;
    if (!el) return;
    let raf = 0;
    const io = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      io.disconnect();
      const start = performance.now();
      const step = (now: number) => {
        const p = Math.min(1, (now - start) / 900);
        setShown(Math.round(value * (1 - Math.pow(1 - p, 3))));
        if (p < 1) raf = requestAnimationFrame(step);
      };
      raf = requestAnimationFrame(step);
    }, { threshold: 0.4 });
    io.observe(el);
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [loaderDone, reduced, value]);

  return <span ref={ref}>{shown}</span>;
}

export function Hero() {
  const { dict, loaderDone, lang } = useSite();
  const exploreRef = useMagnetic<HTMLAnchorElement>();
  const root = useRef<HTMLElement>(null);
  const [clock, setClock] = useState("--:--:--");

  useEffect(() => {
    setClock(moscowClock());
    const id = window.setInterval(() => setClock(moscowClock()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const metrics = [
    { value: github.commitsLastYear, label: dict.hero.metricCommits, href: links.github, suffix: "+" },
    { value: github.publicRepos, label: dict.hero.metricRepos, href: links.github },
    { value: dict.hero.metricYearValue, label: dict.hero.metricYear, href: "#about" },
    { value: dict.hero.metricLangsValue, label: dict.hero.metricLangs, href: "#projects" },
  ];

  const status = dict.hero.status.replace("{time}", clock);

  return (
    <section
      id="top"
      data-section="top"
      ref={root}
      className="section-anchor relative flex min-h-[100svh] items-end overflow-hidden pb-16 pt-28 md:items-center md:pb-0"
    >
      <HeroLogs />
      <div className="dot-grid pointer-events-none absolute inset-0 opacity-70" aria-hidden />
      <EmbeddingSpace />
      <div className="site-wrap relative z-[2] grid items-center gap-8 lg:grid-cols-[minmax(0,1.02fr)_minmax(0,0.98fr)]">
        <div className="min-w-0">
          <p className="flex flex-wrap items-center gap-2 font-mono text-[11px] uppercase tracking-[0.14em] text-[var(--ink-dim)]">
            <span className="status-dot bg-[var(--ok)]" aria-hidden />
            {status}
          </p>
          <div className="mt-5">
            <ScrambleHeading
              as="h1"
              text={dict.hero.headline}
              start={loaderDone}
              caret
              className="hero-name hero-gradient display"
            />
          </div>
          <p className="mt-6 max-w-[38rem] text-[18px] leading-relaxed text-[var(--ink-dim)] md:text-[20px]">
            {dict.hero.summary}
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a ref={exploreRef} href="#projects" className="btn btn-primary">
              {dict.hero.explore}
            </a>
            <a href="#contact" className="btn btn-ghost">
              {dict.hero.contact} ↗
            </a>
          </div>
          <p className="mt-6 flex flex-wrap items-center gap-x-3 gap-y-2 font-mono text-[11px] uppercase tracking-[0.14em] text-[var(--ink-dim)]">
            <CopyButton value={links.email} label={dict.hero.linkEmail} copiedLabel={dict.contact.copied} className="hero-copy" />
            <span aria-hidden>·</span>
            <a
              href={links.telegram}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => trackEvent("social_click", { network: "telegram", section: "hero" })}
              data-track="hero_social_telegram"
            >
              {dict.hero.linkTelegram}
            </a>
            <span aria-hidden>·</span>
            <a
              href={links.github}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => trackEvent("social_click", { network: "github", section: "hero" })}
              data-track="hero_social_github"
            >
              {dict.hero.linkGithub}
            </a>
            <span aria-hidden>·</span>
            <a
              href={links.linkedin}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => trackEvent("social_click", { network: "linkedin", section: "hero" })}
              data-track="hero_social_linkedin"
            >
              {dict.hero.linkLinkedin}
            </a>
            <span aria-hidden>·</span>
            <a
              href={resumePdfFor(lang)}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => trackEvent("resume", { action: "download_pdf", section: "hero" })}
              data-track="resume_hero"
            >
              {dict.hero.linkResume}
            </a>
          </p>
          <div className="hero-metrics mt-10 grid grid-cols-2 gap-px bg-[var(--line)] sm:grid-cols-4">
            {metrics.map((metric) => {
              // Only the GitHub-backed tiles are outbound links; the others are anchors.
              const toGithub = metric.href === links.github;
              return (
                <a
                  key={metric.label}
                  href={metric.href}
                  onClick={
                    toGithub
                      ? () => trackEvent("social_click", { network: "github", section: "hero_metrics" })
                      : undefined
                  }
                  data-track={toGithub ? "hero_metric_github" : undefined}
                  className="bg-[var(--bg)] px-4 py-5 transition-colors hover:bg-[var(--bg-2)]"
                >
                  <p className="display text-[clamp(1.8rem,4vw,2.6rem)] leading-none">
                    <CountUp value={metric.value} />
                    {"suffix" in metric ? <span aria-hidden>{metric.suffix}</span> : null}
                  </p>
                  <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--ink-faint)]">
                    {metric.label}
                  </p>
                </a>
              );
            })}
          </div>
        </div>
        <div aria-hidden className="hidden lg:block" />
      </div>
    </section>
  );
}
