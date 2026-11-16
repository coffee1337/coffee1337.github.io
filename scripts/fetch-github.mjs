// Build-time GitHub stats. Never fails the build: on error or missing token
// the committed cache at src/generated/github.json is kept as-is.
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { loadTs } from "./lib/load-ts.mjs";

const LOGIN = "coffee1337";
const root = fileURLToPath(new URL("..", import.meta.url));
const outFile = join(root, "src", "generated", "github.json");
const token = process.env.GH_STATS_TOKEN ?? process.env.GITHUB_TOKEN ?? "";

const fallback = {
  login: LOGIN,
  commitsLastYear: 307,
  publicRepos: 10,
  repos: {},
  fetchedAt: "2026-11-14T00:00:00.000Z",
};

async function readCache() {
  try {
    return { ...fallback, ...JSON.parse(await readFile(outFile, "utf8")) };
  } catch {
    return { ...fallback };
  }
}

async function gh(path, { allow404 = false } = {}) {
  const headers = { "User-Agent": "coffee1337-portfolio", Accept: "application/vnd.github+json" };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`https://api.github.com${path}`, { headers });
  if (allow404 && res.status === 404) return null;
  if (!res.ok) throw new Error(`rest ${res.status} ${path}`);
  return res.json();
}

async function graphqlContributions(auth) {
  const res = await fetch("https://api.github.com/graphql", {
    method: "POST",
    headers: {
      "User-Agent": "coffee1337-portfolio",
      "Content-Type": "application/json",
      Authorization: `Bearer ${auth}`,
    },
    body: JSON.stringify({
      query: `query($login: String!) {
        user(login: $login) {
          contributionsCollection {
            contributionCalendar { totalContributions }
          }
        }
      }`,
      variables: { login: LOGIN },
    }),
  });
  if (!res.ok) throw new Error(`graphql ${res.status}`);
  const body = await res.json();
  const total = body?.data?.user?.contributionsCollection?.contributionCalendar?.totalContributions;
  if (typeof total !== "number" || total < 0) throw new Error("graphql empty");
  return total;
}

async function restPublicRepos() {
  const body = await gh(`/users/${LOGIN}`);
  if (typeof body.public_repos !== "number") throw new Error("rest empty");
  return body.public_repos;
}

/** Метаданные репозиториев из projectMeta: язык, звёзды, лицензия, последний коммит/релиз. */
async function repoStats(cache) {
  const { projectMeta } = await loadTs("src/content/projects.ts", ["projectMeta"]).catch(() => ({ projectMeta: [] }));
  if (!projectMeta.length) return cache.repos ?? {};

  const repos = { ...(cache.repos ?? {}) };
  for (const project of projectMeta) {
    const repo = String(project.github || "").split("/").pop();
    if (!repo) continue;
    const previous = repos[project.id] ?? {};
    const entry = { ...previous };
    try {
      const data = await gh(`/repos/${LOGIN}/${repo}`);
      if (data?.pushed_at) entry.pushedAt = data.pushed_at;
      entry.language = data?.language ?? null;
      entry.stars = typeof data?.stargazers_count === "number" ? data.stargazers_count : previous.stars ?? 0;
      entry.license = data?.license?.spdx_id ?? null;
    } catch {
      // сеть/лимит — оставляем кэш
    }
    try {
      const release = await gh(`/repos/${LOGIN}/${repo}/releases/latest`, { allow404: true });
      if (release?.tag_name) entry.release = release.tag_name;
    } catch {
      // релизов может не быть вовсе — прежнее значение остаётся
    }
    repos[project.id] = entry;
  }
  return repos;
}

const cache = await readCache();
const next = { ...cache, repos: { ...(cache.repos ?? {}) } };

try {
  if (token) {
    try {
      next.commitsLastYear = await graphqlContributions(token);
    } catch {
      // keep cached commitsLastYear
    }
  }
  try {
    next.publicRepos = await restPublicRepos();
  } catch {
    // keep cached publicRepos
  }
  try {
    next.repos = await repoStats(cache);
  } catch {
    // keep cached repos
  }
  next.login = LOGIN;
  next.fetchedAt = new Date().toISOString();
} catch {
  // swallow — write cache as we have it
}

try {
  await mkdir(dirname(outFile), { recursive: true });
  await writeFile(outFile, `${JSON.stringify(next, null, 2)}\n`);
} catch {
  // cache unwritable: ignore, build continues
}
