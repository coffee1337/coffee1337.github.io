// OG-карточки 1200×630 для каждого проекта и каталога.
// Рендер: SVG → PNG через @resvg/resvg-js (WASM/native, без системных зависимостей).
// Шрифты — сабсеты Onest / JetBrains Mono из scripts/og/fonts (OFL).
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { loadTs } from "./lib/load-ts.mjs";

const SITE = "coffee1337.github.io";
const OUT = join("dist", "og");
const FONTS = [
  join("scripts", "og", "fonts", "onest-400.ttf"),
  join("scripts", "og", "fonts", "onest-600.ttf"),
  join("scripts", "og", "fonts", "jetbrains-mono-500.ttf"),
];

const esc = (value) =>
  String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

/** Простой перенос по словам: OG-карточка не нуждается в полноценном текстовом движке. */
function wrap(text, maxChars, maxLines) {
  const words = String(text).split(/\s+/);
  const lines = [];
  let line = "";
  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (next.length <= maxChars || !line) {
      line = next;
    } else {
      lines.push(line);
      line = word;
      if (lines.length === maxLines) break;
    }
  }
  if (line && lines.length < maxLines) lines.push(line);
  if (lines.length === maxLines) {
    const last = lines[maxLines - 1];
    if (last.length > maxChars - 1) lines[maxLines - 1] = `${last.slice(0, maxChars - 2)}…`;
  }
  return lines;
}

function card({ kicker, title, statement, stack, index }) {
  const titleLines = wrap(title, title.length > 26 ? 20 : 26, 2);
  const titleSize = titleLines.length > 1 ? 74 : 88;
  const statementLines = wrap(statement, 58, 2);
  const stackLine = stack.length > 64 ? `${stack.slice(0, 63)}…` : stack;

  const titleSvg = titleLines
    .map(
      (line, i) =>
        `<text x="86" y="${212 + i * (titleSize + 6)}" font-family="Onest" font-weight="600" font-size="${titleSize}" fill="#f3efe8">${esc(line)}</text>`,
    )
    .join("");

  const statementSvg = statementLines
    .map(
      (line, i) =>
        `<text x="86" y="${212 + titleLines.length * (titleSize + 6) + 34 + i * 38}" font-family="Onest" font-weight="400" font-size="28" fill="#a39d94">${esc(line)}</text>`,
    )
    .join("");

  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <pattern id="dots" width="28" height="28" patternUnits="userSpaceOnUse">
      <circle cx="1.6" cy="1.6" r="1.6" fill="#221d1a"/>
    </pattern>
    <linearGradient id="fade" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#0c0a09" stop-opacity="0"/>
      <stop offset="1" stop-color="#0c0a09" stop-opacity="0.85"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="630" fill="#0c0a09"/>
  <rect width="1200" height="630" fill="url(#dots)"/>
  <rect width="1200" height="630" fill="url(#fade)"/>
  <rect x="0" y="0" width="6" height="630" fill="#c4562a"/>
  <text x="86" y="112" font-family="JetBrains Mono" font-size="20" letter-spacing="2.4" fill="#8a847c">${esc(kicker)}</text>
  <text x="1114" y="112" text-anchor="end" font-family="JetBrains Mono" font-size="20" letter-spacing="2.4" fill="#cf6234">${esc(index)}</text>
  <line x1="86" y1="138" x2="1114" y2="138" stroke="#2a2420" stroke-width="1"/>
  ${titleSvg}
  ${statementSvg}
  <line x1="86" y1="506" x2="1114" y2="506" stroke="#2a2420" stroke-width="1"/>
  <text x="86" y="556" font-family="JetBrains Mono" font-size="21" letter-spacing="0.6" fill="#d9a066">${esc(stackLine)}</text>
  <text x="86" y="596" font-family="JetBrains Mono" font-size="18" letter-spacing="1.8" fill="#6a5449">${SITE}</text>
</svg>`;
}

async function main() {
  let Resvg;
  try {
    ({ Resvg } = await import("@resvg/resvg-js"));
  } catch {
    console.warn("og: @resvg/resvg-js не установлен — карточки не сгенерированы");
    return;
  }
  if (!FONTS.every(existsSync)) {
    console.warn("og: нет сабсетов шрифтов в scripts/og/fonts — пропускаю");
    return;
  }

  const { dictionaries } = await loadTs("src/content/index.ts", ["dictionaries"]).catch(() => ({ dictionaries: null }));
  if (!dictionaries?.en?.projects?.items?.length) {
    console.warn("og: словари не загрузились — пропускаю");
    return;
  }

  const items = dictionaries.en.projects.items;
  mkdirSync(OUT, { recursive: true });
  let count = 0;

  for (const [i, project] of items.entries()) {
    const svg = card({
      kicker: `${SITE} / CASE STUDY`,
      title: project.name,
      statement: project.statement,
      stack: project.stack.slice(0, 6).join(" · ").toUpperCase(),
      index: `${String(i + 1).padStart(2, "0")} / ${String(items.length).padStart(2, "0")}`,
    });
    const png = new Resvg(svg, { font: { fontFiles: FONTS, loadSystemFonts: false, defaultFontFamily: "Onest" } })
      .render()
      .asPng();
    writeFileSync(join(OUT, `${project.id}.png`), png);
    count += 1;
  }

  const catalogSvg = card({
    kicker: `${SITE} / CATALOG`,
    title: "All projects",
    statement: dictionaries.en.catalog.lead,
    stack: `${items.length} CASE STUDIES · OPEN SOURCE & R&D`,
    index: "PROJECTS",
  });
  writeFileSync(
    join(OUT, "projects.png"),
    new Resvg(catalogSvg, { font: { fontFiles: FONTS, loadSystemFonts: false, defaultFontFamily: "Onest" } })
      .render()
      .asPng(),
  );

  console.log(`og: ${count + 1} карточек → ${OUT}`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await main();
}
