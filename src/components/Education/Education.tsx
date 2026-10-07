import { useSite } from "../../context/site";

export function Education() {
  const { dict } = useSite();
  const edu = dict.education;
  return (
    <section id="education" data-section="education" className="section-anchor relative z-[2] bg-[var(--bg)] pb-4">
      <div className="site-wrap grid items-end gap-4 border-y border-[var(--line)] py-8 md:grid-cols-[auto_1fr_auto] md:gap-8">
        <p className="kicker">{edu.index} — {edu.label}</p>
        <div>
          <p className="display text-3xl md:text-5xl">{edu.school}</p>
          <p className="mt-2 text-lg text-[var(--muted)]">{edu.program}</p>
        </div>
        <p className="mono text-[12px] text-[var(--lime)]">{edu.period}</p>
      </div>
    </section>
  );
}
