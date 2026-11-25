import type { ProjectContent } from "./types";

/**
 * Локальные PDF Роспатента. Кнопки скачивания рендерятся только для реально
 * существующих файлов: `check-links.mjs` валидирует каждый локальный href,
 * поэтому путь публикуется лишь после того, как файл положен в `public/certificates/`.
 *
 * Чтобы включить кнопки:
 *   1. public/certificates/ru2026624059-certificate.pdf  ← свидетельство № 2026624059
 *   2. public/certificates/ru2026624059-abstract.pdf     ← официальный бюллетень / реферат
 *   3. раскомментировать пути ниже.
 */
export const CERTIFICATE_FILES: { certificate?: string; abstract?: string } = {
  certificate: undefined,
  abstract: undefined,
};

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
    id: "radar-ppi-mtd",
    visual: "radar" as const,
    image: undefined as string | undefined,
    github: undefined as string | undefined,
    stack: ["Python", "PyTorch", "YOLO11s", "NumPy", "Pillow", "OpenCV", "Pandas", "Matplotlib", "ByteTrack"],
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
    stack: ["C++17", "CMake", "WinAPI", "k-NN"],
    status: false,
  },
  {
    id: "portfolio-analytics",
    visual: "analytics" as const,
    image: undefined as string | undefined,
    github: "https://github.com/coffee1337/portfolio-analytics",
    stack: ["Python", "FastAPI", "PostgreSQL", "SQLAlchemy", "SQLite", "React", "TypeScript", "Tailwind CSS", "Docker"],
    status: true,
  },
];

export type ProjectCopy = Pick<
  ProjectContent,
  | "name"
  | "statement"
  | "purpose"
  | "built"
  | "highlights"
  | "status"
  | "architecture"
  | "decisions"
  | "patent"
  | "demoUrl"
  | "docsUrl"
>;

export function mergeProjects(copy: ProjectCopy[]): ProjectContent[] {
  return projectMeta.map((meta, i) => ({
    ...meta,
    ...copy[i],
    status: copy[i]?.status,
  }));
}