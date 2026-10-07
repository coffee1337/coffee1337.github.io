import { useSite } from "../../context/site";
import { useReveal } from "../../hooks/useMotion";

export function About() {
  const { dict } = useSite();
  const ref = useReveal<HTMLElement>({ stagger: 0.08 });
  return (
    <section id="about" data-section="about" ref={ref} className="section-anchor relative z-[2] py-24 md:py-36">
      <div className="site-wrap">
        <div className="mb-10 flex items-baseline justify-between gap-4">
          <p className="kicker">{dict.about.index} — {dict.about.label}</p>
          <p className="mono text-[10px] text-[var(--faint)]">Independent developer</p>
        </div>
        <div className="grid gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:gap-20">
          <h2 data-reveal className="display text-[clamp(2.4rem,5vw,4.8rem)]">{dict.about.statement}</h2>
          <div className="space-y-5 text-lg leading-relaxed text-[var(--muted)]">
            {dict.about.paragraphs.map((p) => (
              <p key={p} data-reveal>{p}</p>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
