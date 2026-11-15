import { useSite } from "../../context/site";

/** Карточка образования (§4.3): моно-лейблы, бейдж пиксельным шрифтом, чипы дисциплин. */
export function EducationCard() {
  const { dict } = useSite();
  const e = dict.sections.educationCard;

  return (
    <aside id="education" className="scroll-mt-24 border border-[var(--line)] bg-[var(--bg-2)] p-6" aria-label={e.aria}>
      <div className="flex items-start justify-between gap-4">
        <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--ink-faint)]">{e.label}</p>
        <span className="border border-[var(--accent)] px-2 py-0.5 font-pixel text-[10px] uppercase tracking-wider text-[var(--accent)]">
          {e.badge}
        </span>
      </div>

      <p className="mt-4 font-display text-lg leading-snug">{e.school}</p>

      <dl className="mt-4 space-y-1.5 font-mono text-[12px] text-[var(--ink-dim)]">
        <div className="flex gap-2">
          <dt className="w-16 shrink-0 text-[var(--ink-faint)]">{e.labels.code}</dt>
          <dd>{e.program}</dd>
        </div>
        <div className="flex gap-2">
          <dt className="w-16 shrink-0 text-[var(--ink-faint)]">{e.labels.profile}</dt>
          <dd>{e.profile}</dd>
        </div>
        <div className="flex gap-2">
          <dt className="w-16 shrink-0 text-[var(--ink-faint)]">{e.labels.term}</dt>
          <dd>{e.period}</dd>
        </div>
      </dl>

      <p className="mt-6 font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--ink-faint)]">{e.chipsTitle}</p>
      <ul className="mt-2 flex flex-wrap gap-1.5">
        {e.chips.map((chip) => (
          <li key={chip} className="rounded-full border border-[var(--line)] px-2.5 py-1 font-mono text-[10px] text-[var(--ink-dim)]">
            {chip}
          </li>
        ))}
      </ul>

      <p className="mt-5 text-xs leading-relaxed text-[var(--ink-faint)]">{e.note}</p>
    </aside>
  );
}
