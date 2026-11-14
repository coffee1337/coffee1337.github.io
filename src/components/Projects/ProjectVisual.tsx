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

export function ProjectVisual({ project }: { project: ProjectContent; position?: string }) {
  const Visual = MAP[project.visual] ?? MentorVisual;
  return (
    <div className="relative w-full border border-[var(--line)] bg-[var(--bg-2)] p-2 md:p-3">
      <Visual />
    </div>
  );
}
