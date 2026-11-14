// Сборка базы знаний для AI-ассистента: markdown → чанки → MiniSearch-индекс.
// Вход: src/content/knowledge/**/*.md   Выход: public/kb-index.json
import { readdirSync, readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join, basename, extname } from "node:path";
import MiniSearch from "minisearch";

const SRC = "src/content/knowledge";
const OUT = "public/kb-index.json";
const MAX_CHARS = 900;

if (!existsSync(SRC)) {
  console.warn(`build-kb: нет ${SRC} — пропускаю`);
  process.exit(0);
}

function files(dir, out = []) {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, e.name);
    if (e.isDirectory()) files(full, out);
    else if (extname(e.name) === ".md") out.push(full);
  }
  return out;
}

const docs = [];
const langOf = (path) => (/\.ru\.md$|\/ru\//.test(path) ? "ru" : /\.en\.md$|\/en\//.test(path) ? "en" : "both");

for (const file of files(SRC)) {
  const source = basename(file, ".md");
  const raw = readFileSync(file, "utf8");
  const sections = raw.split(/\n(?=#{1,3}\s)/);
  let part = 0;

  for (const section of sections) {
    const heading = (section.match(/^#{1,3}\s+(.+)$/m) || [, source])[1].trim();
    const body = section.replace(/^#{1,3}\s+.+$/m, "").trim();
    if (!body) continue;

    const paragraphs = body.split(/\n{2,}/);
    let buffer = "";

    const flush = () => {
      if (!buffer.trim()) return;
      docs.push({
        id: `${source}#${part}`,
        title: heading,
        text: buffer.trim(),
        tags: heading.toLowerCase().split(/\s+/).join(" "),
        source,
        lang: langOf(file),
      });
      part += 1;
      buffer = "";
    };

    for (const paragraph of paragraphs) {
      if (buffer.length + paragraph.length > MAX_CHARS) flush();
      buffer += (buffer ? "\n\n" : "") + paragraph;
    }
    flush();
  }
}

const mini = new MiniSearch({
  fields: ["title", "text", "tags"],
  storeFields: ["title", "text", "source", "lang"],
  searchOptions: { boost: { title: 2, tags: 1.5 }, fuzzy: 0.2, prefix: true },
});
mini.addAll(docs);

mkdirSync("public", { recursive: true });
writeFileSync(OUT, JSON.stringify({ docs, index: mini.toJSON() }));
console.log(`build-kb: ${docs.length} чанков из ${new Set(docs.map((d) => d.source)).size} файлов → ${OUT}`);
