import type { ReactNode } from "react";
import { links } from "../../content";
import { useSite } from "../../context/site";
import { useReveal } from "../../hooks/useMotion";
import { trackEvent } from "../../analytics";

export function Resume() {
  const { dict, pathBase } = useSite();
  const ref = useReveal<HTMLElement>();
  const r = dict.resume;
  const exp = dict.experience;
  const edu = dict.education;
  const certificates = dict.sections.certificates;
  const keyCertificates = certificates.items.filter((item) => item.featured || item.highlight);
  const year = new Date().getFullYear();

  return (
    <section id="resume" data-section="resume" ref={ref} className="section-anchor relative z-[2] bg-[var(--bg)] py-20 md:py-28">
      <div className="site-wrap">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <p className="kicker">{r.index} — {r.label}</p>
          <p className="mono text-[10px] text-[var(--ink-faint)]">CV / {year}</p>
        </div>
        <div className="mt-6 flex flex-wrap items-end justify-between gap-6">
          <div>
            <h2 className="display text-[clamp(2.6rem,5vw,4.6rem)]">{r.name}</h2>
            <p className="mt-2 text-[var(--ink-dim)]">{r.role}</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <a
              className="btn btn-primary"
              href={links.resumePdf}
              download
              onClick={() => trackEvent("resume", { action: "download_pdf", section: "resume" })}
              data-track="resume_pdf"
            >
              {r.download}
            </a>
            <a
              className="btn btn-ghost"
              href={links.resumeRepo}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => trackEvent("resume", { action: "view_repo", section: "resume" })}
              data-track="resume_repo"
            >
              {r.view}
            </a>
          </div>
        </div>

        <div className="resume-sheet mt-10">
          <div className="grid md:grid-cols-2">
            <Cell title={r.profileTitle}><p>{r.profile}</p></Cell>
            <Cell id="experience" title={r.experienceTitle}>
              <p className="text-[var(--ink)]">{exp.role}</p>
              <p className="mt-1">{exp.employment}</p>
              <p className="mono mt-3 text-[11px] text-[var(--accent)]">{exp.period}</p>
            </Cell>
            <Cell title={r.educationTitle}>
              <p className="text-[var(--ink)]">{edu.school}</p>
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
            <ol className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {dict.projects.items.map((p, i) => {
                const href = p.github ?? `${pathBase}/projects/${p.id}/`;
                const external = Boolean(p.github);
                return (
                  <li key={p.id}>
                    <a
                      href={href}
                      target={external ? "_blank" : undefined}
                      rel={external ? "noopener noreferrer" : undefined}
                      onClick={() =>
                        trackEvent("project_action", {
                          project: p.id,
                          action: external ? "github" : "case_study",
                          section: "resume",
                        })
                      }
                      data-track={external ? "resume_project_github" : "resume_project_case"}
                      className="group block"
                    >
                      <span className="mono text-[10px] text-[var(--ink-faint)]">{String(i + 1).padStart(2, "0")}</span>
                      <span className="mt-1 block text-sm group-hover:text-[var(--accent)]">{p.name}</span>
                    </a>
                  </li>
                );
              })}
            </ol>
          </div>

          <div className="border-t border-[var(--line)] px-5 py-6 md:px-8">
            <div className="flex flex-wrap items-baseline justify-between gap-3">
              <h3 className="kicker">{r.certTitle}</h3>
              <a
                href={`${pathBase}/#certificates`}
                onClick={() => trackEvent("certificate_click", { id: "all", issuer: "section", section: "resume" })}
                data-track="resume_certificates_all"
                className="font-mono text-[10px] uppercase tracking-[0.1em] text-[var(--ink-dim)] hover:text-[var(--accent)]"
              >
                {r.certMore} →
              </a>
            </div>
            <ul className="mt-4 grid gap-3 sm:grid-cols-2">
              {keyCertificates.map((item) => {
                const target = item.links.find((link) => link.kind === "registry" || link.kind === "verify");
                const href = target
                  ? target.kind === "case"
                    ? `${pathBase}${target.href}`
                    : target.href
                  : `${pathBase}/#certificates`;
                const external = href.startsWith("http");
                return (
                  <li key={item.id}>
                    <a
                      href={href}
                      target={external ? "_blank" : undefined}
                      rel={external ? "noopener noreferrer" : undefined}
                      onClick={() => trackEvent("certificate_click", { id: item.id, issuer: item.issuer, section: "resume" })}
                      data-track="resume_certificate"
                      className="group flex items-baseline justify-between gap-3 border-t border-[var(--line)] pt-2"
                    >
                      <span className="text-sm leading-snug group-hover:text-[var(--accent)]">{item.title}</span>
                      <span className="mono shrink-0 text-[10px] text-[var(--ink-faint)]">{item.date}</span>
                    </a>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}

function Cell({ title, id, children }: { title: string; id?: string; children: ReactNode }) {
  return (
    <div
      id={id}
      data-reveal
      className="resume-cell scroll-mt-24 border-b border-[var(--line)] px-5 py-6 text-[var(--ink-dim)] md:px-8 md:odd:border-r"
    >
      <h3 className="kicker mb-3">{title}</h3>
      {children}
    </div>
  );
}
