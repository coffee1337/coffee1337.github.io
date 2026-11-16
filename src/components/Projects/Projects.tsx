import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useSite } from "../../context/site";
import { useReveal } from "../../hooks/useMotion";
import { useToast } from "../Toast/ToastProvider";
import { ScrambleHeading } from "../Scramble/ScrambleHeading";
import { Explorer } from "./Explorer";
import { ProjectVisual } from "./ProjectVisual";
import { sameTech } from "../../lib/tech";
import { formatRepoDate, repoMeta } from "../../lib/repoMeta";
import { trackEvent } from "../../analytics";

const FILTERS = ["All", "Python", "AI/ML", "FastAPI", "Flutter", "C#", "C++"] as const;

const AI_ML = ["pytorch", "rag", "llm", "numpy", "a*", "k-nn", "knn", "машинное обучение", "machine learning"];

/** Фильтр принимает любую технологию: из стека клавиатуры приходит произвольная строка. */
const matches = (stack: string[], filter: string | null): boolean => {
  if (!filter) return true;
  if (filter === "AI/ML") return stack.some((s) => AI_ML.includes(s.toLowerCase()));
  return stack.some((s) => sameTech(s, filter));
};

export function Projects() {
  const { dict, pathBase, lang } = useSite();
  const { toast } = useToast();
  const ref = useReveal<HTMLElement>();
  const [filter, setFilter] = useState<string | null>(null);
  const [activeId, setActiveId] = useState<string>(dict.projects.items[0]?.id ?? "");
  const [detailsOpen, setDetailsOpen] = useState(false);

  const projects = dict.projects.items;

  useEffect(() => {
    const hash = window.location.hash.replace(/^#projects\//, "");
    if (hash && projects.some((p) => p.id === hash)) setActiveId(hash);
  }, [projects]);

  /**
   * Хэш пишется только по явному действию пользователя (клик по проекту).
   * На монтировании URL остаётся чистым, а входящий #about/#top не затирается.
   */
  const selectProject = (id: string, via: "explorer" | "pill") => {
    trackEvent("project_select", { project: id, via });
    setActiveId(id);
    const target = `#projects/${id}`;
    if (window.location.hash !== target) history.replaceState(null, "", target);
    setDetailsOpen(false);
  };

  const changeFilter = (value: string | null) => {
    trackEvent("project_filter", { filter: value ?? "All", page: "home" });
    setFilter(value);
  };

  useEffect(() => {
    const onFilter = (event: Event) => {
      const tech = String((event as CustomEvent<string>).detail || "").trim();
      if (!tech) return;
      const preset = FILTERS.find((item) => item.toLowerCase() === tech.toLowerCase());
      const next = preset && preset !== "All" ? preset : tech;
      // Фильтр пришёл из панели стека — это тот же выбор технологии.
      trackEvent("project_filter", { filter: next, page: "home" });
      setFilter(next);
    };
    window.addEventListener("stack-filter", onFilter);
    return () => window.removeEventListener("stack-filter", onFilter);
  }, []);

  const dimmed = useMemo(() => {
    const set = new Set<string>();
    for (const project of projects) if (!matches(project.stack, filter)) set.add(project.id);
    return set;
  }, [filter, projects]);

  const visible = projects.filter((p) => !dimmed.has(p.id));
  const active = projects.find((p) => p.id === activeId) ?? visible[0] ?? projects[0];

  // при смене фильтра активная карточка не должна оставаться вне выборки
  useEffect(() => {
    if (!active) return;
    if (!dimmed.has(active.id)) return;
    const next = visible[0];
    if (next) setActiveId(next.id);
  }, [dimmed, visible, active]);

  if (!active) return null;

  const customFilter = filter && !FILTERS.includes(filter as (typeof FILTERS)[number]) ? filter : null;

  const copy = (value: string) => {
    void navigator.clipboard.writeText(value).then(() => toast(`✓ ${dict.contact.copied}: ${value}`));
  };

  const cloneCommand = `git clone ${active.github}.git`;

  return (
    <section id="projects" data-section="projects" ref={ref} className="section-anchor relative z-[2] py-20 md:py-28">
      <div className="site-wrap">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="kicker">§{dict.projects.index} / {dict.projects.label}</p>
            <ScrambleHeading text={dict.projects.title} className="display mt-3 text-[clamp(2.2rem,5vw,4.4rem)]" />
          </div>
          <p className="mono text-[10px] tabular-nums text-[var(--ink-faint)]">
            {String(projects.indexOf(active) + 1).padStart(2, "0")} / {String(projects.length).padStart(2, "0")}
          </p>
        </div>

        <div className="mb-6 flex flex-wrap gap-2" role="group" aria-label={dict.projects.label}>
          {FILTERS.map((item) => {
            const value = item === "All" ? null : item;
            const pressed = filter === value;
            return (
              <button
                key={item}
                type="button"
                onClick={() => changeFilter(value)}
                aria-pressed={pressed}
                data-track={`filter_${item}`}
                className={`rounded-full border px-3 py-1 font-mono text-[11px] uppercase tracking-[0.08em] transition-colors ${
                  pressed
                    ? "border-[var(--accent)] bg-[var(--accent)] text-[var(--bg)]"
                    : "border-[var(--line)] text-[var(--ink-dim)] hover:border-[var(--accent)] hover:text-[var(--ink)]"
                }`}
              >
                {item === "All" ? dict.sections.projectsUi.filterAll : item}
              </button>
            );
          })}
          {customFilter && (
            <button
              type="button"
              onClick={() => changeFilter(null)}
              aria-label={dict.sections.projectsUi.clearFilter}
              data-track="filter_clear"
              className="inline-flex items-center gap-2 rounded-full border border-[var(--accent)] bg-[var(--accent)] px-3 py-1 font-mono text-[11px] uppercase tracking-[0.08em] text-[var(--bg)]"
            >
              {customFilter}
              <span aria-hidden>×</span>
            </button>
          )}
        </div>

        <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
          <div className="hidden lg:block">
            <Explorer projects={projects} activeId={active.id} onSelect={(id) => selectProject(id, "explorer")} dimmed={dimmed} />
          </div>

          <div className="lg:hidden -mx-1 flex min-w-0 gap-2 overflow-x-auto px-1 pb-2">

            {visible.map((project) => (
              <button
                key={project.id}
                type="button"
                onClick={() => selectProject(project.id, "pill")}
                data-track="project_pill"
                className={`whitespace-nowrap rounded-full border px-3 py-1 font-mono text-[11px] ${
                  project.id === active.id ? "border-[var(--accent)] text-[var(--accent)]" : "border-[var(--line)] text-[var(--ink-dim)]"
                }`}
              >
                {project.id}
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            <motion.article
              key={active.id}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -14 }}
              transition={{ duration: 0.3, ease: [0.2, 0.8, 0.2, 1] }}
              className="min-w-0 border border-[var(--line)] bg-[var(--bg)]"
            >
              <ProjectVisual project={active} />

              <div className="p-5 md:p-7">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <h3 className="font-display text-2xl md:text-3xl">{active.name}</h3>
                    <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[var(--ink-dim)]">{active.statement}</p>
                  </div>
                  {active.status && (
                    <span className="border border-[var(--accent)] px-2 py-0.5 font-mono text-[10px] uppercase text-[var(--accent)]">
                      {dict.sections.projectsUi.active}
                    </span>
                  )}
                </div>

                <ul className="mt-4 flex flex-wrap gap-1.5">
                  {active.stack.map((tech) => (
                    <li key={tech} className="rounded-full border border-[var(--line)] px-2.5 py-0.5 font-mono text-[10px] text-[var(--ink-dim)]">
                      {tech}
                    </li>
                  ))}
                </ul>

                {(() => {
                  const meta = repoMeta(active.id);
                  const updated = formatRepoDate(meta?.pushedAt, lang);
                  if (!updated && !meta?.language) return null;
                  return (
                    <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.1em] text-[var(--ink-faint)]">
                      {updated && <>{dict.projectPage.updated} {updated}</>}
                      {updated && meta?.language ? " · " : ""}
                      {meta?.language}
                    </p>
                  );
                })()}

                <div className="mt-5 flex flex-wrap gap-2">
                  <a
                    href={active.github}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => trackEvent("project_action", { project: active.id, action: "github" })}
                    data-track="project_github"
                    className="rounded-full bg-[var(--accent)] px-4 py-2 font-mono text-[11px] uppercase text-[var(--bg)]"
                  >
                    {dict.sections.projectsUi.repo} ↗
                  </a>
                  <a
                    href={`${pathBase}/projects/${active.id}/`}
                    onClick={() => trackEvent("project_action", { project: active.id, action: "case_study" })}
                    data-track="project_case"
                    className="rounded-full border border-[var(--line)] px-4 py-2 font-mono text-[11px] uppercase text-[var(--ink)] hover:border-[var(--accent)]"
                  >
                    {dict.sections.projectsUi.caseStudy} →
                  </a>
                  <button
                    type="button"
                    onClick={() => {
                      const nextOpen = !detailsOpen;
                      trackEvent("project_details", { project: active.id, open: nextOpen });
                      setDetailsOpen(nextOpen);
                    }}
                    aria-expanded={detailsOpen}
                    aria-controls="project-details"
                    data-track="project_details"
                    className="rounded-full border border-[var(--line)] px-4 py-2 font-mono text-[11px] uppercase text-[var(--ink)] hover:border-[var(--accent)]"
                  >
                    {dict.sections.projectsUi.details} {detailsOpen ? "−" : "+"}
                  </button>
                </div>

                <div className="mt-4 flex items-center gap-2 border border-[var(--line)] bg-[var(--bg-2)] px-3 py-2 font-mono text-[11px]">
                  <span className="text-[var(--accent)]">$</span>
                  <code className="truncate text-[var(--ink-dim)]">{cloneCommand}</code>
                  <button
                    type="button"
                    onClick={() => {
                      copy(cloneCommand);
                      trackEvent("project_action", { project: active.id, action: "clone_copy" });
                    }}
                    data-track="project_clone"
                    className="ml-auto shrink-0 text-[var(--ink-faint)] hover:text-[var(--ink)]"
                    aria-label={dict.sections.projectsUi.copy}
                  >
                    ⧉
                  </button>
                </div>

                <AnimatePresence initial={false}>
                  {detailsOpen && (
                    <motion.div
                      id="project-details"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: [0.2, 0.8, 0.2, 1] }}
                      className="overflow-hidden"
                    >
                      <dl className="mt-6 grid gap-5 border-t border-[var(--line)] pt-6 md:grid-cols-3">
                        <div>
                          <dt className="font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--accent)]">
                            {dict.sections.projectsUi.problem}
                          </dt>
                          <dd className="mt-2 text-sm leading-relaxed text-[var(--ink-dim)]">{active.purpose}</dd>
                        </div>
                        <div>
                          <dt className="font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--accent)]">
                            {dict.sections.projectsUi.solution}
                          </dt>
                          <dd className="mt-2 text-sm leading-relaxed text-[var(--ink-dim)]">{active.built}</dd>
                        </div>
                        <div>
                          <dt className="font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--accent)]">
                            {dict.sections.projectsUi.result}
                          </dt>
                          <dd className="mt-2">
                            <ul className="space-y-1 text-sm text-[var(--ink-dim)]">
                              {active.highlights.map((item) => (
                                <li key={item} className="flex gap-2">
                                  <span className="text-[var(--accent-2)]">·</span>
                                  {item}
                                </li>
                              ))}
                            </ul>
                          </dd>
                        </div>
                      </dl>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.article>
          </AnimatePresence>
        </div>

        {visible.length === 0 && (
          <p className="mt-6 font-mono text-xs text-[var(--ink-faint)]">{dict.sections.projectsUi.empty}</p>
        )}
      </div>
    </section>
  );
}
