// Проверка локальных ссылок в собранном dist: href/src без протокола должны существовать на диске.
// Внешние URL не проверяются (офлайн-сборка), якоря — только на существование файла.
import { readdirSync, readFileSync, statSync, existsSync } from "node:fs";
import { join, resolve, dirname } from "node:path";

const DIST = resolve("dist");
const SKIP = /^(https?:|mailto:|tel:|data:|javascript:|#|\/\/)/i;

function walk(dir, out = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (entry.name.endsWith(".html")) out.push(full);
  }
  return out;
}

const files = walk(DIST);
const broken = [];

for (const file of files) {
  const html = readFileSync(file, "utf8");
  for (const m of html.matchAll(/(?:href|src)="([^"]+)"/g)) {
    const raw = m[1].trim();
    if (!raw || SKIP.test(raw)) continue;
    const clean = raw.split("#")[0].split("?")[0];
    if (!clean) continue;
    const target = clean.startsWith("/")
      ? join(DIST, clean)
      : resolve(dirname(file), clean);
    const candidates = [target, join(target, "index.html"), `${target}.html`];
    if (!candidates.some((c) => existsSync(c))) broken.push(`${file.replace(DIST, "dist")} → ${raw}`);
  }
}

if (broken.length) {
  console.error(`битых локальных ссылок: ${broken.length}`);
  for (const b of broken.slice(0, 40)) console.error("  " + b);
  process.exit(1);
}
console.log(`ссылки ok: ${files.length} html-файлов, битых нет`);
