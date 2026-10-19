import { useEffect } from "react";
import { useSite } from "../../context/site";
import { useReveal } from "../../hooks/useMotion";
import { useSmoothScroll } from "../../hooks/useSmoothScroll";
import { Header } from "../Header/Header";
import { Footer } from "../Footer/Footer";
import { NotFound } from "../NotFound";
import { ProjectVisual } from "./ProjectVisual";

export function ProjectPage({ id }: { id?: string }) {
  const { dict, lang, pathBase, loaderDone } = useSite();
  const ref = useReveal<HTMLElement>();
  useSmoothScroll(loaderDone);

  const items = dict.projects.items;
  const index = items.findIndex((p) => p.id === id);
  const project = index >= 0 ? items[index] : undefined;
  const copy = dict.projects;
  const t = dict.projectPage;

  useEffect(() => {
    if (!project) return;
    const title = `${project.name} — ${dict.resume.name}`;
    const description = project.statement;
    const url = `${window.location.origin}${pathBase}/projects/${project.id}/`;
    document.title = title;
    const desc = document.querySelector('meta[name="description"]');
    if (desc) desc.setAttribute("content", description);
    const patches: [string, string, string][] = [
      ['link[rel="canonical"]', "href", url],
      ['meta[property="og:url"]', "content", url],
      ['meta[property="og:title"]', "content", title],
      ['meta[property="og:description"]', "content", description],
      ['meta[name="twitter:title"]', "content", title],
      ['meta[name="twitter:description"]', "content", description],
    ];
    for (const [selector, attr, value] of patches) {
      const el = document.querySelector(selector);
      if (el) el.setAttribute(attr, value);
    }
    window.scrollTo(0, 0);
  }, [project, dict, pathBase, lang]);

  if (!project) return <NotFound />;

  const next = items[(index + 1) % items.length];

  return (
    <>
      <Header />
      <main id="content">
        <section ref={ref} className="section-anchor relative z-[2] pt-36 pb-16 md:pt-44 md:pb-24">
          <div className="site-wrap">
            <div data-reveal className="flex flex-wrap items-center gap-3">
              <p className="kicker">
                {project.index} / {copy.index} — {copy.label}
              </p>
              {project.status && (
                <span className="inline-flex items-center gap-2">
                  <span className="status-dot" aria-hidden />
                  <span className="mono text-[10px] text-[var(--lime)]">{project.status}</span>
                </span>
              )}
            </div>
            <h1 data-reveal className="display mt-6 text-[clamp(2.6rem,6vw,5.2rem)]">{project.name}</h1>
            <p data-reveal className="mt-5 max-w-2xl text-xl leading-snug text-[var(--muted)] md:text-2xl">
              {project.statement}
            </p>

            <div className="mt-16 grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
              <div>
                <div className="space-y-5 text-[var(--muted)]">
                  <p data-reveal>
                    <span className="kicker mr-3 text-[var(--text)]">{copy.purpose}</span>
                    {project.purpose}
                  </p>
                  <p data-reveal>
                    <span className="kicker mr-3 text-[var(--text)]">{copy.built}</span>
                    {project.built}
                  </p>
                </div>
                <h2 data-reveal className="kicker mt-10">{copy.highlights}</h2>
                <ul className="mt-4 grid gap-2 sm:grid-cols-2">
                  {project.highlights.map((h) => (
                    <li key={h} data-reveal className="border-t border-[var(--line)] py-2 text-sm">{h}</li>
                  ))}
                </ul>
                <h2 data-reveal className="kicker mt-10">{copy.technology}</h2>
                <div data-reveal className="mt-4 flex flex-wrap gap-2">
                  {project.stack.map((s) => (
                    <span key={s} className="chip">{s}</span>
                  ))}
                </div>
              </div>
              <div data-reveal className="case-visual">
                <ProjectVisual project={project} />
              </div>
            </div>

            <div data-reveal className="mt-16 flex flex-wrap gap-3">
              <a className="btn btn-primary" href={project.github} target="_blank" rel="noopener noreferrer">
                {copy.github}
              </a>
              <a className="btn btn-ghost" href={`${pathBase}/#projects`}>{t.back}</a>
            </div>
          </div>
        </section>

        <section className="relative z-[2] border-t border-[var(--line)] py-12">
          <div className="site-wrap">
            <a data-reveal className="link-arrow" href={`${pathBase}/projects/${next.id}/`}>
              {t.next} — {next.name}
              <span className="arr" aria-hidden>→</span>
            </a>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
