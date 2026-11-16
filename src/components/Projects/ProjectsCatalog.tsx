import { useMemo, useState } from "react";
import { useSite } from "../../context/site";
import { useReveal } from "../../hooks/useMotion";
import { useSmoothScroll } from "../../hooks/useSmoothScroll";
import { sameTech } from "../../lib/tech";
import { formatRepoDate, repoMeta } from "../../lib/repoMeta";
import { Header } from "../Header/Header";
import { Footer } from "../Footer/Footer";
import { Assistant } from "../Assistant/Assistant";

/**
 * Каталог всех проектов: тот же контент, что на главной, но без 3D и скролла —
 * прямые ссылки на кейсы, фильтр по любой технологии из стека.
 */
export function ProjectsCatalog() {
  const { dict, pathBase, lang, loaderDone } = useSite();
  const t = dict.catalog;
  const projectLabels = dict.projectPage;
  const ref = useReveal<HTMLElement>();
  const [filter, setFilter] = useState<string | null>(null);
  useSmoothScroll(loaderDone);

  const projects = dict.projects.items;

  const filters = useMemo(() => {
    const counts = new Map<string, number>();
    for (const project of projects) {
      for (const tech of project.stack) counts.set(tech, (counts.get(tech) ?? 0) + 1);
    }
    return [...counts.entries()]
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .slice(0, 10)
      .map(([tech]) => tech);
  }, [projects]);

  const visible = filter ? projects.filter((p) => p.stack.some((tech) => sameTech(tech, filter))) : projects;

  return (
    <>
      <Header />
      <main id="content">
        <section ref={ref} className="section-anchor relative z-[2] pt-36 pb-16 md:pt-44 md:pb-24">
          <div className="site-wrap">
            <div className="flex flex-wrap items-baseline justify-between gap-3">
              <p className="kicker">
                {t.index} — {t.label}
              </p>
              <a className="font-mono text-[11px] uppercase tracking-[0.1em] text-[var(--ink-dim)] hover:text-[var(--accent)]" href={`${pathBase}/`}>
                ← {t.back}
              </a>
            </div>

            <h1 className="display mt-6 text-[clamp(2.6rem,6vw,5.2rem)]">{t.title}</h1>
            <p className="mt-5 max-w-2xl text-lg leading-snug text-[var(--ink-dim)] md:text-xl">{t.lead}</p>

            <div className="mt-10 flex flex-wrap items-center gap-2" role="group" aria-label={t.stackLabel} data-reveal>
              <button
                type="button"
                onClick={() => setFilter(null)}
                aria-pressed={filter === null}
                className={`rounded-full border px-3 py-1 font-mono text-[11px] uppercase tracking-[0.08em] ${
                  filter === null
                    ? "border-[var(--accent)] bg-[var(--accent)] text-[var(--bg)]"
                    : "border-[var(--line)] text-[var(--ink-dim)] hover:border-[var(--accent)]"
                }`}
              >
                {t.all}
              </button>
              {filters.map((tech) => (
                <button
                  key={tech}
                  type="button"
                  onClick={() => setFilter(tech)}
                  aria-pressed={filter === tech}
                  className={`rounded-full border px-3 py-1 font-mono text-[11px] uppercase tracking-[0.08em] ${
                    filter === tech
                      ? "border-[var(--accent)] bg-[var(--accent)] text-[var(--bg)]"
                      : "border-[var(--line)] text-[var(--ink-dim)] hover:border-[var(--accent)]"
                  }`}
                >
                  {tech}
                </button>
              ))}
            </div>

            {visible.length === 0 ? (
              <p className="mt-10 border-t border-[var(--line)] pt-6 text-sm text-[var(--ink-dim)]">{t.empty}</p>
            ) : (
              <ul className="mt-10 grid gap-px border border-[var(--line)] bg-[var(--line)] md:grid-cols-2 lg:grid-cols-3">
                {visible.map((project) => {
                  const meta = repoMeta(project.id);
                  const updated = formatRepoDate(meta?.pushedAt, lang);
                  return (
                    <li key={project.id} data-project-card data-reveal className="flex flex-col bg-[var(--bg)] p-6">
                      <div className="flex items-baseline justify-between gap-3">
                        <h2 className="font-display text-xl">{project.name}</h2>
                        {project.status && (
                          <span className="shrink-0 font-mono text-[9px] uppercase tracking-[0.1em] text-[var(--accent)]">
                            {project.status}
                          </span>
                        )}
                      </div>
                      <p className="mt-3 flex-1 text-sm leading-relaxed text-[var(--ink-dim)]">{project.statement}</p>

                      <ul className="mt-4 flex flex-wrap gap-1.5">
                        {project.stack.slice(0, 4).map((tech) => (
                          <li key={tech} className="rounded-full border border-[var(--line)] px-2 py-0.5 font-mono text-[10px] text-[var(--ink-dim)]">
                            {tech}
                          </li>
                        ))}
                      </ul>

                      {(updated || meta?.language) && (
                        <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.1em] text-[var(--ink-faint)]">
                          {updated && <>{projectLabels.updated} {updated}</>}
                          {updated && meta?.language ? " · " : ""}
                          {meta?.language}
                        </p>
                      )}

                      <div className="mt-5 flex flex-wrap gap-2">
                        <a
                          href={`${pathBase}/projects/${project.id}/`}
                          className="rounded-full bg-[var(--accent)] px-4 py-2 font-mono text-[11px] uppercase text-[var(--bg)]"
                        >
                          {t.open} →
                        </a>
                        <a
                          href={project.github}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="rounded-full border border-[var(--line)] px-4 py-2 font-mono text-[11px] uppercase text-[var(--ink)] hover:border-[var(--accent)]"
                        >
                          {t.github} ↗
                        </a>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </section>
      </main>
      <Footer />
      <Assistant />
    </>
  );
}
