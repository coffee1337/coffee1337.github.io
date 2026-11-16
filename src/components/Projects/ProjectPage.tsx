import { useEffect } from "react";
import { useSite } from "../../context/site";
import { useReveal } from "../../hooks/useMotion";
import { useSmoothScroll } from "../../hooks/useSmoothScroll";
import { Header } from "../Header/Header";
import { Footer } from "../Footer/Footer";
import { Assistant } from "../Assistant/Assistant";
import { NotFound } from "../NotFound";
import { ProjectVisual } from "./ProjectVisual";
import { formatRepoDate, repoMeta } from "../../lib/repoMeta";
import { trackEvent } from "../../analytics";

export function ProjectPage({ id }: { id?: string }) {
  const { dict, lang, pathBase, loaderDone } = useSite();
  const ref = useReveal<HTMLElement>();
  const nextRef = useReveal<HTMLElement>();
  useSmoothScroll(loaderDone);

  const items = dict.projects.items;
  const index = items.findIndex((p) => p.id === id);
  const project = index >= 0 ? items[index] : undefined;
  const copy = dict.projects;
  const t = dict.projectPage;
  const meta = id ? repoMeta(id) : undefined;
  const updated = formatRepoDate(meta?.pushedAt, lang);

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
      ['meta[property="og:image"]', "content", `${window.location.origin}/og/${project.id}.png`],
      ['meta[name="twitter:image"]', "content", `${window.location.origin}/og/${project.id}.png`],
    ];
    for (const [selector, attr, value] of patches) {
      const el = document.querySelector(selector);
      if (el) el.setAttribute(attr, value);
    }
    window.scrollTo(0, 0);
  }, [project, dict, pathBase, lang]);

  if (!project) return <NotFound />;

  const next = items[(index + 1) % items.length];
  // §10.2: позиция и всего считаются из массива, без захардкоженных номеров.
  const position = String(index + 1).padStart(2, "0");
  const total = String(items.length).padStart(2, "0");

  return (
    <>
      <Header />
      <main id="content">
        <section ref={ref} className="section-anchor relative z-[2] pt-36 pb-16 md:pt-44 md:pb-24">
          <div className="site-wrap">
            <div className="flex flex-wrap items-center gap-3">
              <p className="kicker">
                {position} / {total} — {copy.label}
              </p>
              {project.status && (
                <span className="inline-flex items-center gap-2">
                  <span className="status-dot" aria-hidden />
                  <span className="mono text-[10px] text-[var(--accent)]">{project.status}</span>
                </span>
              )}
            </div>
            <h1 className="display mt-6 text-[clamp(2.6rem,6vw,5.2rem)]">{project.name}</h1>
            <p className="mt-5 max-w-2xl text-xl leading-snug text-[var(--ink-dim)] md:text-2xl">
              {project.statement}
            </p>

            {(updated || meta?.language || meta?.license || meta?.release) && (
              <p className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[10px] uppercase tracking-[0.1em] text-[var(--ink-faint)]">
                {updated && <span>{t.updated} {updated}</span>}
                {meta?.language && <><span aria-hidden>·</span><span>{meta.language}</span></>}
                {meta?.license && <><span aria-hidden>·</span><span>{meta.license}</span></>}
                {meta?.release && <><span aria-hidden>·</span><span>{meta.release}</span></>}
              </p>
            )}

            <div className="mt-16 grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
              <div>
                <div className="space-y-5 text-[var(--ink-dim)]">
                  <p>
                    <span className="kicker mr-3 text-[var(--ink)]">{copy.purpose}</span>
                    {project.purpose}
                  </p>
                  <p>
                    <span className="kicker mr-3 text-[var(--ink)]">{copy.built}</span>
                    {project.built}
                  </p>
                </div>
                <h2 className="kicker mt-10">{copy.highlights}</h2>
                <ul className="mt-4 grid gap-2 sm:grid-cols-2">
                  {project.highlights.map((h) => (
                    <li key={h} className="border-t border-[var(--line)] py-2 text-sm">{h}</li>
                  ))}
                </ul>
                <h2 className="kicker mt-10">{copy.technology}</h2>
                <div className="mt-4 flex flex-wrap gap-2">
                  {project.stack.map((s) => (
                    <span key={s} className="chip">{s}</span>
                  ))}
                </div>
              </div>
              <div>
                <ProjectVisual project={project} position={position} />
              </div>
            </div>

            {(project.architecture?.length || project.decisions?.length) && (
              <div className="mt-16 grid gap-10 border-t border-[var(--line)] pt-10 md:grid-cols-2">
                {project.architecture?.length ? (
                  <div>
                    <h2 className="kicker">{t.architecture}</h2>
                    <ul className="mt-4 grid gap-3">
                      {project.architecture.map((item) => (
                        <li key={item} className="border-t border-[var(--line)] pt-3 text-sm leading-relaxed text-[var(--ink-dim)]">
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
                {project.decisions?.length ? (
                  <div>
                    <h2 className="kicker">{t.decisions}</h2>
                    <ul className="mt-4 grid gap-3">
                      {project.decisions.map((item) => (
                        <li key={item} className="border-t border-[var(--line)] pt-3 text-sm leading-relaxed text-[var(--ink-dim)]">
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </div>
            )}

            <div className="mt-16 flex flex-wrap gap-3">
              <a
                className="btn btn-primary"
                href={project.github}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => trackEvent("project_action", { project: project.id, action: "github" })}
                data-track="project_github"
              >
                {copy.github}
              </a>
              {project.demoUrl && (
                <a
                  className="btn btn-ghost"
                  href={project.demoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => trackEvent("project_action", { project: project.id, action: "demo" })}
                  data-track="project_demo"
                >
                  {t.demo} ↗
                </a>
              )}
              {project.docsUrl && (
                <a
                  className="btn btn-ghost"
                  href={project.docsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => trackEvent("project_action", { project: project.id, action: "docs" })}
                  data-track="project_docs"
                >
                  {t.docs} ↗
                </a>
              )}
              <a className="btn btn-ghost" href={`${pathBase}/projects/`}>{t.back}</a>
            </div>
          </div>
        </section>

        <section ref={nextRef} className="relative z-[2] border-t border-[var(--line)] py-12">
          <div className="site-wrap">
            {/* Единственный выбор проекта на странице кейса — переход «next»: это чип-навигация. */}
            <a
              data-reveal
              className="link-arrow"
              href={`${pathBase}/projects/${next.id}/`}
              onClick={() => trackEvent("project_select", { project: next.id, via: "pill" })}
              data-track="project_next"
            >
              {t.next} — {next.name}
              <span className="arr" aria-hidden>→</span>
            </a>
          </div>
        </section>
      </main>
      <Footer />
      <Assistant />
    </>
  );
}
