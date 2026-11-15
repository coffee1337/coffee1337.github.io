import { useMemo, useRef, useState } from "react";
import type { ProjectContent } from "../../content";
import { useSite } from "../../context/site";

export const GROUPS: { dir: string; ids: string[] }[] = [
  { dir: "ai", ids: ["ai-python-mentor", "neural-astar"] },
  { dir: "mobile", ids: ["ngie"] },
  { dir: "desktop", ids: ["transaction-monitor"] },
  { dir: "ml-from-scratch", ids: ["knn"] },
  { dir: "tools", ids: ["portfolio-analytics"] },
];

const GLYPH: Record<string, string> = {
  "ai-python-mentor": "py",
  "neural-astar": "py",
  ngie: "dart",
  "transaction-monitor": "cs",
  knn: "cpp",
  "portfolio-analytics": "py",
};

type Props = {
  projects: ProjectContent[];
  activeId: string;
  onSelect: (id: string) => void;
  dimmed: Set<string>;
};

export function Explorer({ projects, activeId, onSelect, dimmed }: Props) {
  const { dict } = useSite();
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const treeRef = useRef<HTMLDivElement>(null);

  const rows = useMemo(() => {
    const flat: { dir: string; project: ProjectContent }[] = [];
    for (const group of GROUPS) {
      if (collapsed[group.dir]) continue;
      for (const id of group.ids) {
        const project = projects.find((p) => p.id === id);
        if (project) flat.push({ dir: group.dir, project });
      }
    }
    return flat;
  }, [projects, collapsed]);

  const focusRow = (id: string) => {
    const node = treeRef.current?.querySelector<HTMLButtonElement>(`[data-file="${id}"]`);
    node?.focus();
  };

  /** Enter/стрелки работают с элементом в фокусе, а не с последним выбранным проектом. */
  const focused = (event: React.KeyboardEvent) => {
    const target = event.target as HTMLElement | null;
    return {
      file: target?.closest<HTMLElement>("[data-file]")?.dataset.file,
      dir: target?.closest<HTMLElement>("[data-dir]")?.dataset.dir,
    };
  };

  const toggleDir = (dir: string) => setCollapsed((state) => ({ ...state, [dir]: !state[dir] }));

  const move = (delta: number) => {
    const current = rows.findIndex((row) => row.project.id === activeId);
    const next = Math.min(Math.max(current + delta, 0), rows.length - 1);
    const target = rows[next];
    if (target) {
      onSelect(target.project.id);
      focusRow(target.project.id);
    }
  };

  return (
    <div
      ref={treeRef}
      role="tree"
      aria-label={dict.sections.projectsUi.explorer}
      className="border border-[var(--line)] bg-[var(--bg-2)]"
      onKeyDown={(event) => {
        if (event.key === "ArrowDown") {
          event.preventDefault();
          move(1);
        }
        if (event.key === "ArrowUp") {
          event.preventDefault();
          move(-1);
        }
        if (event.key === "Enter") {
          event.preventDefault();
          const { file, dir } = focused(event);
          if (file) onSelect(file);
          else if (dir) toggleDir(dir);
        }
        if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
          event.preventDefault();
          const { dir } = focused(event);
          if (!dir) return;
          setCollapsed((state) => ({ ...state, [dir]: event.key === "ArrowLeft" }));
        }
      }}
    >
      <div className="flex items-center gap-2 border-b border-[var(--line)] px-3 py-2 font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--ink-faint)]">
        <span className="text-[var(--accent)]">▾</span>
        {dict.sections.projectsUi.tabs}
      </div>

      <div className="py-2">
        {GROUPS.map((group) => {
          const items = group.ids
            .map((id) => projects.find((p) => p.id === id))
            .filter((p): p is ProjectContent => Boolean(p));
          if (!items.length) return null;
          const isCollapsed = collapsed[group.dir];

          return (
            <div key={group.dir} role="group" aria-label={group.dir}>
              <button
                type="button"
                role="treeitem"
                aria-expanded={!isCollapsed}
                data-dir={group.dir}
                onClick={() => toggleDir(group.dir)}
                className="flex w-full items-center gap-2 px-3 py-1 text-left font-mono text-[11px] text-[var(--ink-dim)] hover:text-[var(--ink)]"
              >
                <span className="text-[var(--accent)]">{isCollapsed ? "▸" : "▾"}</span>
                {group.dir}/
              </button>

              {!isCollapsed &&
                items.map((project) => {
                  const active = project.id === activeId;
                  const dim = dimmed.has(project.id);
                  return (
                    <button
                      key={project.id}
                      type="button"
                      role="treeitem"
                      aria-selected={active}
                      data-file={project.id}
                      onClick={() => onSelect(project.id)}
                      className={`relative flex w-full items-center gap-2 py-1 pl-8 pr-3 text-left font-mono text-[12px] transition-opacity ${
                        active ? "text-[var(--ink)]" : "text-[var(--ink-dim)] hover:text-[var(--ink)]"
                      } ${dim ? "opacity-35" : ""}`}
                    >
                      {active && <span className="absolute left-0 top-0 h-full w-0.5 bg-[var(--accent)]" />}
                      <span className="text-[9px] uppercase text-[var(--ink-faint)]">{GLYPH[project.id] ?? "file"}</span>
                      <span className="truncate">{project.id}</span>
                      {project.status && <span className="ml-auto text-[10px] text-[var(--accent)]">★</span>}
                    </button>
                  );
                })}
            </div>
          );
        })}
      </div>
    </div>
  );
}
