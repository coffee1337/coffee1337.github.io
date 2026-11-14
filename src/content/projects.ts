import type { ProjectContent } from "./types";

export const projectMeta = [
  {
    id: "ai-python-mentor",
    visual: "mentor" as const,
    image: undefined as string | undefined,
    github: "https://github.com/coffee1337/ai-python-mentor",
    stack: ["Python", "FastAPI", "PostgreSQL", "SQLAlchemy", "Alembic", "Next.js", "Docker", "RAG", "LLM"],
    status: true,
  },
  {
    id: "ngie",
    visual: "campus" as const,
    image: undefined as string | undefined,
    github: "https://github.com/coffee1337/ngieuapp",
    stack: ["Flutter", "Dart", "Riverpod", "Drift", "SQLite", "Swift", "WidgetKit"],
    status: false,
  },
  {
    id: "transaction-monitor",
    visual: "ledger" as const,
    image: undefined as string | undefined,
    github: "https://github.com/coffee1337/TransactionMonitor",
    stack: ["C#", ".NET 8", "WinUI 3", "SQL Server"],
    status: false,
  },
  {
    id: "neural-astar",
    visual: "search" as const,
    image: undefined as string | undefined,
    github: "https://github.com/coffee1337/neural-astar-heuristic",
    stack: ["Python", "PyTorch", "NumPy", "A*", "Docker"],
    status: false,
  },
  {
    id: "knn",
    visual: "neighbors" as const,
    image: undefined as string | undefined,
    github: "https://github.com/coffee1337/k-nearest-neighbors",
    stack: ["C++17", "CMake", "WinAPI"],
    status: false,
  },
  {
    id: "portfolio-analytics",
    visual: "analytics" as const,
    image: undefined as string | undefined,
    github: "https://github.com/coffee1337/portfolio-analytics",
    stack: ["Python", "FastAPI", "SQLAlchemy", "SQLite", "JavaScript"],
    status: false,
  },
];

export type ProjectCopy = Pick<ProjectContent, "name" | "statement" | "purpose" | "built" | "highlights" | "status">;

export function mergeProjects(copy: ProjectCopy[]): ProjectContent[] {
  return projectMeta.map((meta, i) => ({
    ...meta,
    ...copy[i],
    status: copy[i]?.status,
  }));
}
