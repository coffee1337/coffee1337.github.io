import type { ProjectContent } from "../../content";
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
 */
export function ProjectVisual({ project }: { project: ProjectContent; position?: string }) {
  const Visual = MAP[project.visual] ?? MentorVisual;
  return (
    <div className="relative w-full overflow-hidden bg-[var(--bg-2)] aspect-[480/300]">
      <Visual />
    </div>
  );
}
