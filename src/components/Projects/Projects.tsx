import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useSite } from "../../context/site";
import { useReveal } from "../../hooks/useMotion";
import { useToast } from "../Toast/ToastProvider";
import { ScrambleHeading } from "../Scramble/ScrambleHeading";
import { Explorer } from "./Explorer";
import { ProjectVisual } from "./ProjectVisual";

const FILTERS = ["All", "Python", "AI/ML", "FastAPI", "Flutter", "C#", "C++"] as const;

const matches = (stack: string[], filter: string): boolean => {
  if (filter === "All") return true;
  const lowered = stack.map((s) => s.toLowerCase());
  if (filter === "AI/ML") return lowered.some((s) => ["pytorch", "rag", "llm", "numpy", "a*"].includes(s));
  if (filter === "C#") return lowered.some((s) => s.startsWith("c#") || s === ".net 8");
  if (filter === "C++") return lowered.some((s) => s.startsWith("c++"));
  return lowered.includes(filter.toLowerCase());
};

export function Projects() {
  const { dict, pathBase } = useSite();
  const { toast } = useToast();
  const ref = useReveal<HTMLElement>();
  const [filter, setFilter] = useState<string>("All");
  const [activeId, setActiveId] = useState<string>(dict.projects.items[0]?.id ?? "");
  const [detailsOpen, setDetailsOpen] = useState(false);

  const projects = dict.projects.items;

  useEffect(() => {
    const hash = window.location.hash.replace(/^#projects\//, "");
    if (hash && projects.some((p) => p.id === hash)) setActiveId(hash);
  }, [projects]);

  useEffect(() => {
    if (!activeId) return;
    const target = `#projects/${activeId}`;
    if (window.location.hash !== target) {
      history.replaceState(null, "", target);
    }
    setDetailsOpen(false);
  }, [activeId]);

  useEffect(() => {
    const onFilter = (event: Event) => {
      const tech = String((event as CustomEvent<string>).detail || "");
      const match = FILTERS.find((filter) => filter.toLowerCase() === tech.toLowerCase());
      setFilter(match ?? "All");
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

  if (!active) return null;

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
          {FILTERS.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setFilter(item)}
              aria-pressed={filter === item}
              className={`rounded-full border px-3 py-1 font-mono text-[11px] uppercase tracking-[0.08em] transition-colors ${
                filter === item
                  ? "border-[var(--accent)] bg-[var(--accent)] text-[var(--bg)]"
                  : "border-[var(--line)] text-[var(--ink-dim)] hover:border-[var(--accent)] hover:text-[var(--ink)]"
              }`}
            >
              {item === "All" ? dict.sections.projectsUi.filterAll : item}
            </button>
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
          <div className="hidden lg:block">
            <Explorer projects={projects} activeId={active.id} onSelect={setActiveId} dimmed={dimmed} />
          </div>

          <div className="lg:hidden -mx-1 flex gap-2 overflow-x-auto px-1 pb-2">
            {visible.map((project) => (
              <button
                key={project.id}
                type="button"
                onClick={() => setActiveId(project.id)}
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
              className="border border-[var(--line)] bg-[var(--bg)]"
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
                      active
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

                <div className="mt-5 flex flex-wrap gap-2">
                  <a
                    href={active.github}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-full bg-[var(--accent)] px-4 py-2 font-mono text-[11px] uppercase text-[var(--bg)]"
                  >
                    {dict.sections.projectsUi.repo} ↗
                  </a>
                  <a
                    href={`${pathBase}/projects/${active.id}/`}
                    className="rounded-full border border-[var(--line)] px-4 py-2 font-mono text-[11px] uppercase text-[var(--ink)] hover:border-[var(--accent)]"
                  >
                    {dict.sections.projectsUi.caseStudy} →
                  </a>
                  <button
                    type="button"
                    onClick={() => setDetailsOpen((open) => !open)}
                    aria-expanded={detailsOpen}
                    aria-controls="project-details"
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
                    onClick={() => copy(cloneCommand)}
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
