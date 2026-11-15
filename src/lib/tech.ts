/** Сопоставление названий технологий между стеком, клавиатурой и проектами. */

const ALIAS_GROUPS: string[][] = [
  ["llm", "llm api", "llm apis", "llm integration"],
  [".net", ".net 8", "dotnet"],
  ["c++", "c++17", "cpp"],
  ["rest api", "rest apis"],
  ["ci", "github actions"],
  ["postgres", "postgresql"],
  ["c#", "csharp", "winui", "winui 3"],
  ["sql server", "mssql"],
  ["a*", "astar", "a-star"],
  ["k-nn", "knn", "k nearest neighbors"],
  ["next.js", "nextjs", "next js"],
  ["async", "asyncio"],
  ["js", "javascript"],
  ["ts", "typescript"],
];

const lookup = new Map<string, string>();
for (const group of ALIAS_GROUPS) {
  const key = group[0];
  for (const alias of group) lookup.set(alias, key);
}

export function canon(tech: string): string {
  const value = tech.trim().toLowerCase().replace(/\s+/g, " ");
  return lookup.get(value) ?? value;
}

/** true, если это одна и та же технология (с учётом алиасов из ALIAS_GROUPS). */
export function sameTech(a: string, b: string): boolean {
  if (!a || !b) return false;
  const ca = canon(a);
  const cb = canon(b);
  if (ca === cb) return true;
  // «Python» ↔ «Python 3.11», «FastAPI» ↔ «FastAPI framework»
  return ca.length >= 3 && cb.length >= 3 && (ca.includes(cb) || cb.includes(ca));
}

/** Технологии, которые не названы в стеках напрямую, но стоят за ними. */
const RELATED: Record<string, string[]> = {
  asyncio: ["python"],
  pandas: ["python"],
  "data processing": ["python"],
  automation: ["python"],
  python: ["fastapi"],
  linux: ["docker"],
  docker: ["linux"],
  typescript: ["next.js"],
  "next.js": ["typescript"],
  sqlalchemy: ["postgresql", "sqlite"],
  postgresql: ["sqlalchemy"],
};

/** Технологии, которые есть в любом публичном проекте (все они — git-репозитории). */
const GLOBAL = new Set(["git"]);

/** Проекты, в стеке которых есть технология. */
export function projectsWithTech<T extends { stack: string[] }>(projects: T[], tech: string): T[] {
  const key = canon(tech);
  if (GLOBAL.has(key)) return projects.filter((project) => (project as { github?: string }).github);
  return projects.filter((project) => project.stack.some((item) => sameTech(item, tech)));
}

/** Ближайшие проекты, если прямого совпадения нет: смежные технологии из RELATED. */
export function projectsWithRelated<T extends { stack: string[] }>(projects: T[], tech: string): T[] {
  const related = RELATED[canon(tech)] ?? [];
  if (!related.length) return [];
  return projects.filter((project) =>
    project.stack.some((item) => related.some((alias) => sameTech(item, alias))),
  );
}
