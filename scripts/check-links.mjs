// Проверка локальных ссылок и якорей в собранном dist.
// - href/src без протокола должны существовать на диске;
// - якорь (#id) должен указывать на существующий id в целевом HTML-файле.
// Внешние URL не проверяются (офлайн-сборка).
import { readdirSync, readFileSync, existsSync } from "node:fs";
import { join, resolve, dirname } from "node:path";

const DIST = resolve("dist");
const EXTERNAL = /^(https?:|mailto:|tel:|data:|javascript:|\/\/)/i;

function walk(dir, out = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (entry.name.endsWith(".html")) out.push(full);
  }
  return out;
}

const idCache = new Map();

/** Все id="…" целевого HTML (включая SVG: на них ссылаются mpath/use). */
function idsOf(file) {
  let ids = idCache.get(file);
  if (!ids) {
    ids = new Set();
    for (const m of readFileSync(file, "utf8").matchAll(/\sid="([^"]*)"/g)) ids.add(m[1]);
    idCache.set(file, ids);
  }
  return ids;
}

/** Существует ли путь; для якорей нужен именно HTML-файл. */
function resolveTarget(file, clean) {
  const target = clean.startsWith("/") ? join(DIST, clean) : resolve(dirname(file), clean);
  const candidates = [target, join(target, "index.html"), `${target}.html`];
  const hit = candidates.find((candidate) => existsSync(candidate));
  return { exists: Boolean(hit), html: hit && hit.endsWith(".html") ? hit : null };
}

const files = walk(DIST);
const broken = [];
const report = (file, raw, reason) => broken.push(`${file.replace(DIST, "dist")} → ${raw} ${reason}`);

for (const file of files) {
  const html = readFileSync(file, "utf8");
  for (const m of html.matchAll(/(?:href|src)="([^"]+)"/g)) {
    const raw = m[1].trim();
    if (!raw || EXTERNAL.test(raw)) continue;

    const hashIndex = raw.indexOf("#");
    const pathPart = hashIndex === -1 ? raw : raw.slice(0, hashIndex);
    const hash = hashIndex === -1 ? "" : raw.slice(hashIndex + 1);
    const clean = pathPart.split("?")[0];

    if (!clean) {
      // Якорь на текущую страницу.
      if (hash && !idsOf(file).has(hash)) report(file, raw, `(нет id="${hash}")`);
      continue;
    }

    const target = resolveTarget(file, clean);
    if (!target.exists) {
      report(file, raw, "(файл не найден)");
      continue;
    }
    // hash на не-HTML (pdf, svg-файл) не проверяем
    if (hash && target.html && !idsOf(target.html).has(hash)) {
      report(file, raw, `(нет id="${hash}")`);
    }
  }
}

if (broken.length) {
  console.error(`битых ссылок/якорей: ${broken.length}`);
  for (const b of broken.slice(0, 40)) console.error("  " + b);
  process.exit(1);
}
console.log(`ссылки ok: ${files.length} html-файлов, битых ссылок/якорей нет`);
