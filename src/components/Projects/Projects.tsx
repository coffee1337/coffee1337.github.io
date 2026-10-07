import type { ProjectContent } from "../../content";
import { useSite } from "../../context/site";
import { useReveal } from "../../hooks/useMotion";
import { ProjectVisual } from "./ProjectVisual";

export function Projects() {
  const { dict } = useSite();
  return (
    <section id="projects" data-section="projects" className="section-anchor relative z-[2] py-20 md:py-28">
      <div className="site-wrap">
        <div className="mb-14 flex flex-wrap items-end justify-between gap-6 md:mb-20">
          <div>
            <p className="kicker">{dict.projects.index} — {dict.projects.label}</p>
            <h2 className="display mt-4 text-[clamp(2.8rem,6.5vw,6rem)]">{dict.projects.title}</h2>
          </div>
          <p className="mono text-[10px] text-[var(--faint)]">05</p>
        </div>
        <div className="flex flex-col gap-24 md:gap-32">
          {dict.projects.items.map((project, i) => (
            <CaseStudy key={project.id} project={project} flipped={i % 2 === 1} />
          ))}
        </div>
      </div>
    </section>
  );
}

function CaseStudy({ project, flipped }: { project: ProjectContent; flipped: boolean }) {
  const { dict } = useSite();
  const ref = useReveal<HTMLElement>({ stagger: 0.05 });
  const copy = dict.projects;

  return (
    <article ref={ref} className="case grid items-center gap-8 lg:grid-cols-2 lg:gap-14">
      <div className={flipped ? "lg:order-2" : ""}>
        <div data-reveal className="flex items-center gap-3">
          <span className="display text-3xl text-[var(--faint)]">{project.index}</span>
          {project.status && (
            <span className="inline-flex items-center gap-2">
              <span className="status-dot" aria-hidden />
              <span className="mono text-[10px] text-[var(--lime)]">{project.status}</span>
            </span>
          )}
        </div>
        <h3 data-reveal className="display mt-3 text-[clamp(2rem,3.6vw,3.6rem)]">{project.name}</h3>
        <p data-reveal className="mt-4 max-w-xl text-lg">{project.statement}</p>
        <div className="mt-8 space-y-5 text-[var(--muted)]">
          <p data-reveal><span className="kicker mr-3 text-[var(--text)]">{copy.purpose}</span>{project.purpose}</p>
          <p data-reveal><span className="kicker mr-3 text-[var(--text)]">{copy.built}</span>{project.built}</p>
        </div>
        <ul className="mt-6 grid gap-2 sm:grid-cols-2">
          {project.highlights.map((h) => (
            <li key={h} data-reveal className="border-t border-[var(--line)] py-2 text-sm">{h}</li>
          ))}
        </ul>
        <div data-reveal className="mt-6 flex flex-wrap gap-2">
          {project.stack.map((t) => (
            <span key={t} className="chip">{t}</span>
          ))}
        </div>
        <a data-reveal className="link-arrow mt-8" href={project.github} target="_blank" rel="noopener noreferrer">
          {copy.github}
          <span className="arr" aria-hidden>↗</span>
        </a>
      </div>
      <div data-reveal className={`case-visual ${flipped ? "lg:order-1" : ""}`}>
        <ProjectVisual project={project} />
      </div>
    </article>
  );
}
