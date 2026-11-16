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

// SEO/smoke: JSON-LD парсится, og:image/canonical/hreflang на месте (кроме 404),
// у кейсов — своя OG-карточка, в llms.txt нет «undefined».
const seo = [];
for (const file of files) {
  const html = readFileSync(file, "utf8");
  const head = html.split("</head>")[0] || "";
  const name = file.replace(DIST, "dist");

  for (const m of html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) {
    try {
      JSON.parse(m[1]);
    } catch (error) {
      seo.push(`${name}: невалидный JSON-LD — ${error.message}`);
    }
  }

  if (file.endsWith("404.html")) {
    if (/rel="canonical"/.test(html)) seo.push(`${name}: canonical не должен стоять на 404`);
    continue;
  }

  if (!/<meta property="og:image" content="https?:\/\/[^"]+"/.test(head)) seo.push(`${name}: нет og:image`);
  if (!/<meta property="og:image:alt" content="[^"]+"/.test(head)) seo.push(`${name}: нет og:image:alt`);
  if (!/<link rel="canonical" href="https?:\/\/[^"]+"/.test(head)) seo.push(`${name}: нет canonical`);
  if (!/hreflang="en"/.test(head) || !/hreflang="ru"/.test(head)) seo.push(`${name}: нет hreflang en/ru`);

  const caseId = file.match(/\/projects\/([^/]+)\/index\.html$/)?.[1];
  if (caseId && caseId !== "projects") {
    const og = head.match(/property="og:image" content="[^"]*\/og\/([^"]+)\.png"/)?.[1];
    if (og !== caseId) seo.push(`${name}: og:image должен быть /og/${caseId}.png, сейчас ${og ?? "общий"}`);
  }
}

for (const llms of ["llms.txt", "llms-full.txt"]) {
  const path = join(DIST, llms);
  if (!existsSync(path)) {
    seo.push(`dist/${llms}: файл не сгенерирован`);
    continue;
  }
  const line = readFileSync(path, "utf8").split("\n").find((row) => /\bundefined\b/.test(row));
  if (line) seo.push(`dist/${llms}: содержит undefined → ${line.slice(0, 120)}`);
}

if (broken.length || seo.length) {
  if (broken.length) {
    console.error(`битых ссылок/якорей: ${broken.length}`);
    for (const b of broken.slice(0, 40)) console.error("  " + b);
  }
  if (seo.length) {
    console.error(`SEO-проблем: ${seo.length}`);
    for (const item of seo.slice(0, 40)) console.error("  " + item);
  }
  process.exit(1);
}
console.log(`ссылки ok: ${files.length} html-файлов, SEO-разметка и llms.txt в порядке`);
