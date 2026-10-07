import type { ReactNode } from "react";
import { links } from "../../content";
import { useSite } from "../../context/site";
import { useReveal } from "../../hooks/useMotion";

export function Resume() {
  const { dict } = useSite();
  const ref = useReveal<HTMLElement>();
  const r = dict.resume;
  const exp = dict.experience;
  const edu = dict.education;
  const year = new Date().getFullYear();

  return (
    <section id="resume" data-section="resume" ref={ref} className="section-anchor relative z-[2] bg-[var(--bg)] py-20 md:py-28">
      <div className="site-wrap">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <p className="kicker">{r.index} — {r.label}</p>
          <p className="mono text-[10px] text-[var(--faint)]">CV / {year}</p>
        </div>
        <div className="mt-6 flex flex-wrap items-end justify-between gap-6">
          <div>
            <h2 className="display text-[clamp(2.6rem,5vw,4.6rem)]">{r.name}</h2>
            <p className="mt-2 text-[var(--muted)]">{r.role}</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <a className="btn btn-primary" href={links.resumePdf} download>{r.download}</a>
            <a className="btn btn-ghost" href={links.resumeRepo} target="_blank" rel="noopener noreferrer">{r.view}</a>
          </div>
        </div>

        <div className="resume-sheet mt-10">
          <div className="grid md:grid-cols-2">
            <Cell title={r.profileTitle}><p>{r.profile}</p></Cell>
            <Cell title={r.experienceTitle}>
              <p className="text-[var(--text)]">{exp.role}</p>
              <p className="mt-1">{exp.employment}</p>
              <p className="mono mt-3 text-[11px] text-[var(--lime)]">{exp.period}</p>
            </Cell>
            <Cell title={r.educationTitle}>
              <p className="text-[var(--text)]">{edu.school}</p>
              <p className="mt-1">{edu.program}</p>
              <p className="mono mt-3 text-[11px]">{edu.period}</p>
            </Cell>
            <Cell title={r.skillsTitle}>
              <ul className="flex flex-wrap gap-2">
                {r.skills.map((s) => <li key={s} className="chip">{s}</li>)}
              </ul>
            </Cell>
          </div>
          <div className="border-t border-[var(--line)] px-5 py-6 md:px-8">
            <h3 className="kicker">{r.workTitle}</h3>
            <ol className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
              {dict.projects.items.map((p) => (
                <li key={p.id}>
                  <a href={p.github} target="_blank" rel="noopener noreferrer" className="group block">
                    <span className="mono text-[10px] text-[var(--faint)]">{p.index}</span>
                    <span className="mt-1 block text-sm group-hover:text-[var(--accent)]">{p.name}</span>
                  </a>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>
    </section>
  );
}

function Cell({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div data-reveal className="border-b border-[var(--line)] px-5 py-6 text-[var(--muted)] md:border-r md:px-8">
      <h3 className="kicker mb-3">{title}</h3>
      {children}
    </div>
  );
}
