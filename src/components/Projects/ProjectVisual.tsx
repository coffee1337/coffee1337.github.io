import { useState } from "react";
import type { ProjectContent } from "../../content";
import { useSite } from "../../context/site";
import {
  AnalyticsVisual,
  AstarVisual,
  KnnVisual,
  MentorVisual,
  MonitorVisual,
  NgieuVisual,
} from "./visuals";

const MAP = {
  mentor: MentorVisual,
  campus: NgieuVisual,
  ledger: MonitorVisual,
  search: AstarVisual,
  neighbors: KnnVisual,
  analytics: AnalyticsVisual,
} as const;

/**
 * Diagram slot with a fixed aspect ratio: switching projects crossfades in
 * place instead of jumping in height. No border/padding here — the surface
 * that wraps it owns the frame, this only paints the background.
 * Если у проекта есть реальный скриншот — сверху появляется переключатель.
 */
export function ProjectVisual({ project }: { project: ProjectContent; position?: string }) {
  const { dict } = useSite();
  const labels = dict.projectPage;
  const Visual = MAP[project.visual] ?? MentorVisual;
  const [mode, setMode] = useState<"diagram" | "image">("diagram");
  const hasImage = Boolean(project.image);
  const showImage = hasImage && mode === "image";

  return (
    <div>
      {hasImage && (
        <div className="mb-2 flex justify-end gap-1" role="group" aria-label={`${labels.diagram} / ${labels.screenshot}`}>
          {(["diagram", "image"] as const).map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setMode(value)}
              aria-pressed={mode === value}
              className={`border px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.1em] transition-colors ${
                mode === value
                  ? "border-[var(--accent)] text-[var(--accent)]"
                  : "border-[var(--line)] text-[var(--ink-faint)] hover:text-[var(--ink)]"
              }`}
            >
              {value === "diagram" ? labels.diagram : labels.screenshot}
            </button>
          ))}
        </div>
      )}
      <div className="relative w-full overflow-hidden bg-[var(--bg-2)] aspect-[480/300]">
        {showImage ? (
          <img
            src={project.image}
            alt={`${project.name} — ${labels.screenshot}`}
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover"
          />
        ) : (
          <Visual />
        )}
      </div>
    </div>
  );
}
