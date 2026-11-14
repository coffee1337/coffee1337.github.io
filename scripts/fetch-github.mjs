// Build-time GitHub stats. Never fails the build: on error or missing token
// the committed cache at src/generated/github.json is kept as-is.
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const LOGIN = "coffee1337";
const root = fileURLToPath(new URL("..", import.meta.url));
const outFile = join(root, "src", "generated", "github.json");
const token = process.env.GH_STATS_TOKEN ?? process.env.GITHUB_TOKEN ?? "";

const fallback = {
  login: LOGIN,
  commitsLastYear: 307,
  publicRepos: 10,
  fetchedAt: "2026-11-14T00:00:00.000Z",
};

async function readCache() {
  try {
    return { ...fallback, ...JSON.parse(await readFile(outFile, "utf8")) };
  } catch {
    return { ...fallback };
  }
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

async function restPublicRepos(auth) {
  const headers = { "User-Agent": "coffee1337-portfolio", Accept: "application/vnd.github+json" };
  if (auth) headers.Authorization = `Bearer ${auth}`;
  const res = await fetch(`https://api.github.com/users/${LOGIN}`, { headers });
  if (!res.ok) throw new Error(`rest ${res.status}`);
  const body = await res.json();
  if (typeof body.public_repos !== "number") throw new Error("rest empty");
  return body.public_repos;
}

const cache = await readCache();
const next = { ...cache };

try {
  if (token) {
    try {
      next.commitsLastYear = await graphqlContributions(token);
    } catch {
      // keep cached commitsLastYear
    }
  }
  try {
    next.publicRepos = await restPublicRepos(token);
  } catch {
    // keep cached publicRepos
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
