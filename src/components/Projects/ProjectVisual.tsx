import type { ProjectContent } from "../../content";

export function ProjectVisual({ project }: { project: ProjectContent }) {
  return (
    <div className={`project-art art-${project.visual}`} aria-hidden>
      <div className="flex items-start justify-between">
        <span className="mono text-[10px] text-[var(--faint)]">{project.index} / SYS</span>
        <span className="mono text-[10px] text-[var(--muted)]">{project.stack[0]}</span>
      </div>
      <Diagram kind={project.visual} />
      <p className="display max-w-[12ch] text-[clamp(1.8rem,3vw,2.6rem)] leading-none">{project.name}</p>
    </div>
  );
}

function Diagram({ kind }: { kind: ProjectContent["visual"] }) {
  if (kind === "mentor") {
    return (
      <div className="my-8 grid grid-cols-[1fr_auto_1fr] items-center gap-3">
        <Node k="API" v="FastAPI" />
        <span className="mono text-[10px] text-[var(--lime)]">RAG</span>
        <Node k="LLM" v="Tutor" />
      </div>
    );
  }
  if (kind === "campus") {
    return (
      <div className="my-8 grid grid-cols-3 gap-3">
        {["Schedule", "Cache", "Widgets"].map((label) => (
          <div key={label} className="border border-[var(--line-strong)] p-3">
            <p className="mono text-[10px] text-[var(--faint)]">{label}</p>
            <p className="mt-4 h-1.5 w-2/3 bg-[var(--accent)]" />
            <p className="mt-2 h-1.5 w-1/2 bg-[var(--line-strong)]" />
          </div>
        ))}
      </div>
    );
  }
  if (kind === "ledger") {
    return (
      <div className="my-8 grid grid-cols-[1fr_auto_auto] items-center gap-3">
        <Node k="TX" v="Stream" />
        <span className="mono text-[10px] text-[var(--muted)]">→</span>
        <div className="border border-[var(--line-strong)] px-3 py-3 text-right">
          <p className="mono text-[10px] text-[var(--faint)]">Risk</p>
          <p className="display text-3xl text-[var(--lime)]">72</p>
        </div>
      </div>
    );
  }
  if (kind === "search") {
    return (
      <div className="my-10 flex flex-wrap items-center gap-2">
        {["State", "V(s)", "A*", "Path"].map((step, i) => (
          <span key={step} className="contents">
            <span className="mono border border-[var(--line-strong)] px-2.5 py-1.5 text-[11px]">{step}</span>
            {i < 3 && <span className="text-[var(--faint)]">→</span>}
          </span>
        ))}
      </div>
    );
  }
  return (
    <svg viewBox="0 0 260 120" className="my-6 h-28 w-full">
      {[[36, 78], [70, 40], [98, 82], [132, 34], [168, 70], [206, 46]].map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r={i === 4 ? 7 : 4} fill={i === 4 ? "var(--lime)" : "var(--accent)"} />
      ))}
      <circle cx="168" cy="70" r="30" fill="none" stroke="var(--text)" strokeOpacity="0.35" />
      <text x="188" y="28" fill="var(--muted)" fontSize="11" fontFamily="IBM Plex Mono, monospace">k = 3</text>
    </svg>
  );
}

function Node({ k, v }: { k: string; v: string }) {
  return (
    <div className="border border-[var(--line-strong)] p-3">
      <p className="mono text-[10px] text-[var(--faint)]">{k}</p>
      <p className="mt-2 text-sm">{v}</p>
    </div>
  );
}
