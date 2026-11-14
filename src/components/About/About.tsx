import { useSite } from "../../context/site";
import { useReveal } from "../../hooks/useMotion";
import { ScrambleHeading } from "../Scramble/ScrambleHeading";
import { EducationCard } from "../Education/EducationCard";

export function About() {
  const { dict } = useSite();
  const ref = useReveal<HTMLElement>({ stagger: 0.08 });
  return (
    <section id="about" data-section="about" ref={ref} className="section-anchor relative z-[2] py-20 md:py-28">
      <div className="site-wrap">
        <div className="mb-8 flex items-baseline justify-between gap-4">
          <p className="kicker">§{dict.about.index} / {dict.about.label}</p>
          <p className="mono text-[10px] text-[var(--ink-faint)]">{dict.footer.role}</p>
        </div>

        <div className="grid gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16">
          <div>
            <ScrambleHeading data-reveal text={dict.about.statement} className="display max-w-[18ch] text-[clamp(2rem,4.2vw,3.6rem)]" />
            <div className="mt-6 max-w-[62ch] space-y-4 text-base leading-relaxed text-[var(--ink-dim)] md:text-lg">
              {dict.about.paragraphs.map((paragraph) => (
                <p key={paragraph} data-reveal>{paragraph}</p>
              ))}
            </div>
          </div>

          <div data-reveal>
            <EducationCard />
          </div>
        </div>
      </div>
    </section>
  );
}
