import { useSite } from "../../context/site";
import { useReveal } from "../../hooks/useMotion";

export function Experience() {
  const { dict } = useSite();
  const ref = useReveal<HTMLElement>();
  const exp = dict.experience;
  return (
    <section id="experience" data-section="experience" ref={ref} className="section-anchor relative z-[2] bg-[var(--bg)] py-24 md:py-32">
      <div className="site-wrap">
        <p className="kicker">
          {exp.index} — {exp.label}
        </p>
        <div className="mt-8 grid gap-12 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <h2 data-reveal className="display text-[clamp(2.4rem,4.5vw,4.4rem)]">
              {exp.title}
            </h2>
            <div data-reveal className="mt-8 border-t border-[var(--line)] pt-6">
              <p className="text-xl">{exp.role}</p>
              <p className="mt-2 text-[var(--muted)]">{exp.employment}</p>
              <p className="mono mt-4 text-[11px] text-[var(--lime)]">{exp.period}</p>
              <p className="mt-5 max-w-md text-[var(--muted)]">{exp.intro}</p>
            </div>
            <ol className="mt-8">
              {exp.tracks.map((track) => (
                <li key={track.title} data-reveal className="track">
                  <span className="mono text-[10px] text-[var(--lime)]">{track.period}</span>
                  <p className="mt-1">{track.title}</p>
                  <p className="mt-1 text-sm text-[var(--muted)]">{track.body}</p>
                </li>
              ))}
            </ol>
          </div>
          <div className="grid gap-10 sm:grid-cols-2">
            <div>
              <h3 className="kicker">{exp.builtTitle}</h3>
              <ul className="mt-4">
                {exp.built.map((item, i) => (
                  <li key={item} data-reveal className="stack-item">
                    <span>{item}</span>
                    <span className="idx mono text-[10px] text-[var(--faint)]">{String(i + 1).padStart(2, "0")}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="kicker">{exp.practiceTitle}</h3>
              <ul className="mt-4">
                {exp.practice.map((item) => (
                  <li key={item} data-reveal className="border-t border-[var(--line)] py-2.5 text-[var(--muted)]">
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
