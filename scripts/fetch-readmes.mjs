// README публичных репозиториев coffee1337/* → src/content/knowledge/generated/<repo>.md
// Сеть недоступна — берём существующий снапшот и НЕ ломаем сборку.
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { loadTs } from "./lib/load-ts.mjs";

const OUT_DIR = join("src", "content", "knowledge", "generated");
const MAX_CHARS = 6000;
const TIMEOUT_MS = 20000;
const OFFLINE = process.env.READMES_OFFLINE === "1";

const { projectMeta } = await loadTs("src/content/projects.ts", ["projectMeta"]);
let names = new Map();
try {
  const { dictionaries } = await loadTs("src/content/index.ts", ["dictionaries"]);
  names = new Map(dictionaries.en.projects.items.map((item) => [item.id, item.name]));
} catch {
  /* имена не критичны */
}

function repoOf(url) {
  const match = /github\.com\/([^/]+)\/([^/#?]+)/i.exec(url ?? "");
  return match ? `${match[1]}/${match[2].replace(/\.git$/, "")}` : null;
}

function cleanReadme(raw) {
  let text = raw.replace(/\r\n/g, "\n");
  text = text.replace(/<!--[\s\S]*?-->/g, "");
  text = text.replace(/<picture[\s\S]*?<\/picture>/gi, "");
  text = text.replace(/<img[^>]*>/gi, "");
  text = text.replace(/\[!\[[^\]]*\]\([^)]*\)\]\([^)]*\)/g, "");
  text = text.replace(/!\[[^\]]*\]\([^)]*\)/g, "");
  text = text.replace(/<a[^>]*>([\s\S]*?)<\/a>/gi, "$1");
  text = text.replace(/<\/?[a-zA-Z][^>]*>/g, "");
  text = text.replace(/```[\s\S]*?```/g, "");
  text = text.replace(/^\s*\|.*\|\s*$/gm, "");
  text = text.replace(/\[([^\]]+)\]\([^)]*\)/g, "$1");
  text = text.replace(/^#{1,2}\s+(.+)$/gm, "$1");
  text = text.replace(/^[ \t]*[-*_]{3,}[ \t]*$/gm, "");
  text = text.replace(/[ \t]+$/gm, "");
  text = text.replace(/\n{3,}/g, "\n\n");
  text = text.trim();
  if (text.length > MAX_CHARS) {
    const cut = text.slice(0, MAX_CHARS);
    const at = cut.lastIndexOf("\n\n");
    text = cut.slice(0, at > MAX_CHARS * 0.5 ? at : MAX_CHARS).trim();
  }
  return text;
}

function readmeLang(text) {
  const cyr = (text.match(/[\u0400-\u04FF]/g) ?? []).length;
  const lat = (text.match(/[A-Za-z]/g) ?? []).length;
  if (!cyr) return "en";
  return cyr / Math.max(1, cyr + lat) > 0.3 ? "ru" : "en";
}

async function viaGh(full) {
  try {
    const out = execFileSync("gh", ["api", `repos/${full}/readme`, "-H", "Accept: application/vnd.github.raw"], {
      encoding: "utf8",
      timeout: TIMEOUT_MS,
      maxBuffer: 8 * 1024 * 1024,
      stdio: ["ignore", "pipe", "ignore"],
    });
    return typeof out === "string" && out.trim() ? out : null;
  } catch {
    return null;
  }
}

async function viaRaw(full) {
  for (const branch of ["HEAD", "main", "master"]) {
    try {
      const response = await fetch(`https://raw.githubusercontent.com/${full}/${branch}/README.md`, {
        signal: AbortSignal.timeout(TIMEOUT_MS),
        headers: { "user-agent": "coffee1337-portfolio" },
      });
      if (response.ok) {
        const text = await response.text();
        if (text.trim()) return text;
      }
    } catch {
      /* пробуем следующую ветку */
    }
  }
  return null;
}

async function main() {
  mkdirSync(OUT_DIR, { recursive: true });
  let fetched = 0;
  let kept = 0;
  let skipped = 0;

  for (const meta of projectMeta) {
    const full = repoOf(meta.github);
    if (!full) {
      skipped += 1;
      continue;
    }
    const repo = full.split("/")[1];
    const file = join(OUT_DIR, `${repo}.md`);
    const existing = existsSync(file) ? readFileSync(file, "utf8") : null;

    const raw = OFFLINE ? null : ((await viaGh(full)) ?? (await viaRaw(full)));
    if (!raw) {
      if (existing) {
        kept += 1;
        console.log(`fetch-readmes: ${repo} — сеть недоступна, оставляю снапшот`);
      } else {
        skipped += 1;
        console.log(`fetch-readmes: ${repo} — README не получен и снапшота нет, пропускаю`);
      }
      continue;
    }

    const clean = cleanReadme(raw);
    if (clean.length < 80) {
      if (existing) kept += 1;
      else skipped += 1;
      console.log(`fetch-readmes: ${repo} — README пустой после очистки`);
      continue;
    }

    const name = names.get(meta.id) ?? repo;
    const body = [`<!-- lang: ${readmeLang(clean)} -->`, `# ${name} — README`, "", `Source: ${meta.github}`, "", clean, ""].join("\n");
    writeFileSync(file, body, "utf8");
    fetched += 1;
    console.log(`fetch-readmes: ${repo} — ${clean.length} символов`);
  }

  const total = readdirSync(OUT_DIR).filter((name) => name.endsWith(".md")).length;
  console.log(`fetch-readmes: обновлено ${fetched}, снапшотов ${kept}, пропущено ${skipped}, файлов ${total}`);
}

await main();
