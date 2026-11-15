// Сборка базы знаний ассистента: markdown + структурированный контент сайта → чанки → MiniSearch.
// Вход: src/content/knowledge/**/*.md, src/content/{en,ru}.ts, projects.ts, sections.ts
// Выход: public/kb-index.json
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { basename, extname, join } from "node:path";
import { pathToFileURL } from "node:url";
import MiniSearch from "minisearch";
import { loadTs } from "./lib/load-ts.mjs";

const SRC = "src/content/knowledge";
const OUT = "public/kb-index.json";
const MAX_CHARS = 900;

/** Раздел сайта для чанка — чтобы источники были кликабельными. */
const SECTION_HREFS = {
  about: "/#about",
  stack: "/#stack",
  projects: "/#projects",
  education: "/#education",
  contacts: "/#contact",
  contact: "/#contact",
  hiring: "/#contact",
  freelance: "/#contact",
  faq: "/#contact",
  resume: "/#resume",
  entry: "/#entry",
};

const LANG_LINE = /^##\s+(RU|EN)\s*$/i;
const HEADING_LINE = /^(#{1,3})\s+(.+)$/;
const LANG_MARKER = /<!--\s*lang:\s*(ru|en)\s*-->/i;

function mdFiles(dir, out = []) {
  if (!existsSync(dir)) return out;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) mdFiles(full, out);
    else if (extname(entry.name) === ".md") out.push(full);
  }
  return out;
}

function detectLang(file, raw) {
  if (/\.ru\.md$/i.test(file) || /[\\/]ru[\\/]/.test(file)) return "ru";
  if (/\.en\.md$/i.test(file) || /[\\/]en[\\/]/.test(file)) return "en";
  const marker = raw.match(LANG_MARKER);
  if (marker) return marker[1].toLowerCase();
  return "both";
}

function hrefFor(source, lang) {
  const key = source.replace(/^generated[/\\]/, "");
  const href = SECTION_HREFS[key];
  if (!href) return undefined;
  if (lang === "both") return href;
  return lang === "ru" ? `/ru${href}` : href;
}

function pack(paragraphs, max = MAX_CHARS) {
  const out = [];
  let buffer = "";
  for (const paragraph of paragraphs) {
    const text = paragraph.trim();
    if (!text) continue;
    if (buffer && buffer.length + text.length + 2 > max) {
      out.push(buffer);
      buffer = "";
    }
    buffer = buffer ? `${buffer}\n\n${text}` : text;
  }
  if (buffer) out.push(buffer);
  return out;
}

/** Markdown → чанки. `## RU` / `## EN` разносятся в отдельные чанки со своим lang и title. */
export function markdownDocs() {
  const docs = [];
  for (const file of mdFiles(SRC)) {
    const raw = readFileSync(file, "utf8").replace(/\r\n/g, "\n");
    const source = basename(file, extname(file));
    const fileLang = detectLang(file, raw);
    const lines = raw.split("\n").filter((line) => !LANG_MARKER.test(line));

    const titleLine = lines.find((line) => /^#\s+/.test(line));
    const docTitle = titleLine ? titleLine.replace(/^#\s+/, "").trim() : source;

    const segments = [];
    let current = { lang: fileLang, heading: docTitle, lines: [] };
    let split = false;
    for (const line of lines) {
      if (line === titleLine) continue;
      const langMatch = line.match(LANG_LINE);
      if (langMatch) {
        if (current.lines.some((item) => item.trim())) segments.push(current);
        current = { lang: langMatch[1].toLowerCase(), heading: docTitle, lines: [] };
        split = true;
        continue;
      }
      const heading = line.match(HEADING_LINE);
      if (split && heading && heading[1].length >= 2) {
        if (current.lines.some((item) => item.trim())) segments.push(current);
        current = { lang: current.lang, heading: `${docTitle} — ${heading[2].trim()}`, lines: [] };
        continue;
      }
      current.lines.push(line);
    }
    if (current.lines.some((item) => item.trim())) segments.push(current);
    if (!segments.length) continue;

    let part = 0;
    for (const segment of segments) {
      const packed = pack(segment.lines.join("\n").split(/\n{2,}/));
      packed.forEach((text, index) => {
        docs.push({
          id: `${source}#${part}`,
          title: packed.length > 1 ? `${segment.heading} · ${index + 1}` : segment.heading,
          text,
          source,
          lang: segment.lang,
          href: hrefFor(source, segment.lang),
        });
        part += 1;
      });
    }
  }
  return docs;
}

/** Чанки из src/content/*.ts — база не расходится с сайтом (проекты, стек, образование, контакты). */
export async function contentDocs() {
  const { dictionaries, links } = await loadTs("src/content/index.ts", ["dictionaries", "links"]);
  const docs = [];

  for (const lang of ["en", "ru"]) {
    const dict = dictionaries[lang];
    const base = lang === "ru" ? "/ru" : "";
    const counters = new Map();
    const push = (source, title, text, href) => {
      const part = counters.get(source) ?? 0;
      counters.set(source, part + 1);
      docs.push({ id: `${source}#${part}`, title, text: text.trim(), source, lang, href });
    };
    const section = (id) => `${base}/#${id}`;
    const textSource = `content-${lang}`;
    const projectsSource = `content-projects-${lang}`;
    const sectionsSource = `content-sections-${lang}`;

    const hero = dict.hero;
    const about = dict.about;
    push(
      textSource,
      lang === "ru" ? "Профиль" : "Profile",
      [
        `${hero.first} ${hero.last} — ${hero.role.replace(/\n/g, " ")}.`,
        hero.summary,
        ...about.paragraphs,
        `${lang === "ru" ? "Доступность" : "Availability"}: ${hero.available}. ${dict.contact.status}.`,
        `${lang === "ru" ? "Локация" : "Location"}: ${dict.footer.location}.`,
      ].join("\n\n"),
      section("about"),
    );

    push(
      textSource,
      lang === "ru" ? "Стек" : "Stack",
      dict.stack.groups.map((group) => `${group.name}: ${group.items.join(", ")}.`).join("\n\n"),
      section("stack"),
    );

    push(
      textSource,
      lang === "ru" ? "Что я делаю" : "Capabilities",
      dict.capabilities.items.map((item) => `${item.title} — ${item.tags}. ${item.body}`).join("\n\n"),
      section("capabilities"),
    );

    const card = dict.sections.educationCard;
    push(
      textSource,
      lang === "ru" ? "Образование" : "Education",
      [card.school, `${card.program}. ${card.profile}. ${card.period}.`, `${card.chipsTitle}: ${card.chips.join(", ")}.`, card.note].join("\n\n"),
      section("education"),
    );

    push(
      textSource,
      lang === "ru" ? "Контакты" : "Contacts",
      [
        `Email: ${links.email}.`,
        `Telegram: ${links.telegramHandle} (${links.telegram}).`,
        `GitHub: ${links.github}. LinkedIn: ${links.linkedin}.`,
        `${lang === "ru" ? "Резюме" : "Resume"}: ${links.site}${links.resumePdf} · ${links.resumeRepo}.`,
      ].join("\n\n"),
      section("contact"),
    );

    push(
      textSource,
      lang === "ru" ? "Найм" : "Hiring",
      [
        dict.sections.entry.cards[0].title,
        dict.sections.entry.cards[0].body,
        `${dict.contact.status}.`,
        `${dict.experience.role} · ${dict.experience.employment} · ${dict.experience.period}.`,
        dict.experience.tracks.map((track) => `${track.title} — ${track.body}`).join(" "),
      ].join("\n\n"),
      section("contact"),
    );

    push(
      textSource,
      lang === "ru" ? "Фриланс" : "Freelance",
      [
        dict.sections.entry.cards[1].title,
        dict.sections.entry.cards[1].body,
        `${lang === "ru" ? "Локация" : "Location"}: ${dict.footer.location}.`,
      ].join("\n\n"),
      section("contact"),
    );

    const resume = dict.resume;
    push(
      textSource,
      lang === "ru" ? "Резюме" : "Resume",
      [`${resume.name} — ${resume.role}.`, resume.profile, `${resume.skillsTitle}: ${resume.skills.join(", ")}.`, `${links.site}${links.resumePdf}`].join("\n\n"),
      section("resume"),
    );

    for (const project of dict.projects.items) {
      push(
        projectsSource,
        project.name,
        [
          project.statement,
          `${dict.projects.purpose}: ${project.purpose}`,
          `${dict.projects.built}: ${project.built}`,
          `${dict.projects.highlights}: ${project.highlights.join("; ")}.`,
          `${dict.projects.technology}: ${project.stack.join(", ")}.`,
          project.status ? `${dict.projects.active}: ${project.status}.` : "",
          `${dict.projects.github}: ${project.github}`,
          `${lang === "ru" ? "Кейс на сайте" : "Case study"}: ${links.site}${base}/projects/${project.id}/`,
        ]
          .filter(Boolean)
          .join("\n\n"),
        `${base}/projects/${project.id}/`,
      );
    }

    push(
      sectionsSource,
      lang === "ru" ? "Три входа" : "Entry points",
      dict.sections.entry.cards.map((item) => `${item.title} — ${item.body}`).join("\n\n"),
      section("entry"),
    );

    push(
      sectionsSource,
      lang === "ru" ? "Дисциплины" : "Coursework",
      `${card.program}. ${card.profile}. ${card.period}. ${card.chipsTitle}: ${card.chips.join(", ")}.`,
      section("education"),
    );
  }

  return docs.filter((doc) => doc.text.length > 0);
}

export async function collectDocs() {
  const md = markdownDocs();
  let content = [];
  try {
    content = await contentDocs();
  } catch (error) {
    console.warn(`build-kb: контент из TS не собран (${error instanceof Error ? error.message : error})`);
  }
  return [...md, ...content];
}

export function buildIndex(docs) {
  const mini = new MiniSearch({
    fields: ["title", "text"],
    storeFields: ["title", "text", "source", "lang", "href"],
    searchOptions: { boost: { title: 2.2 } },
  });
  mini.addAll(docs.map(({ id, title, text, source, lang, href }) => ({ id, title, text, source, lang, href })));
  return mini;
}

async function main() {
  const docs = await collectDocs();
  if (!docs.length) {
    console.warn(`build-kb: нет данных в ${SRC} — индекс не обновляю`);
    return;
  }
  const mini = buildIndex(docs);
  mkdirSync("public", { recursive: true });
  writeFileSync(OUT, JSON.stringify({ docs, index: mini.toJSON() }));
  const byLang = docs.reduce((acc, doc) => ({ ...acc, [doc.lang]: (acc[doc.lang] ?? 0) + 1 }), {});
  const sources = new Set(docs.map((doc) => doc.source));
  console.log(
    `build-kb: ${docs.length} чанков из ${sources.size} источников (${Object.entries(byLang)
      .map(([lang, count]) => `${lang}:${count}`)
      .join(", ")}) → ${OUT}`,
  );
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await main();
}
