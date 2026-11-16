import github from "../generated/github.json";
import type { Lang } from "../content";

export type RepoMeta = {
  pushedAt?: string;
  language?: string | null;
  stars?: number;
  license?: string | null;
  release?: string | null;
};

const repos = (github as { repos?: Record<string, RepoMeta> }).repos ?? {};

/** Реальные данные GitHub API, сохранённые на сборке (см. scripts/fetch-github.mjs). */
export function repoMeta(id: string): RepoMeta | undefined {
  return repos[id];
}

export function formatRepoDate(value: string | undefined, lang: Lang): string {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat(lang === "ru" ? "ru-RU" : "en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}
