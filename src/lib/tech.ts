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

/** Проекты, в стеке которых есть технология. */
export function projectsWithTech<T extends { stack: string[] }>(projects: T[], tech: string): T[] {
  return projects.filter((project) => project.stack.some((item) => sameTech(item, tech)));
}
