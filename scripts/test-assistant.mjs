// Тест локального режима ассистента: роутер, язык, непустые ответы, безопасные ссылки, SSE.
// Чистая логика собирается esbuild'ом из src/lib/assistant/*.ts и импортируется как ESM.
import { execFileSync } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { collectDocs } from "./build-kb.mjs";

const tmp = mkdtempSync(join(process.env.TMPDIR || tmpdir(), "assistant-test-"));
const bundle = join(tmp, "assistant.mjs");

try {
  execFileSync(
    join("node_modules", ".bin", process.platform === "win32" ? "esbuild.cmd" : "esbuild"),
    ["src/lib/assistant/index.ts", "--bundle", "--format=esm", "--platform=node", "--log-level=error", `--outfile=${bundle}`],
    { stdio: ["ignore", "ignore", "pipe"] },
  );
} catch (error) {
  console.error("не удалось собрать src/lib/assistant:", error?.stderr?.toString?.() ?? error);
  process.exit(1);
}

const { answerLocal, detectIntent, detectLang, searcherFromDocs, parseMarkdown, isSafeHref, createSseParser, parseDelta } =
  await import(pathToFileURL(bundle).href);

const docs = await collectDocs();
const search = await searcherFromDocs(docs);

const cases = [
  // RU
  { q: "Привет", intent: "greeting", lang: "ru" },
  { q: "ку", intent: "greeting", lang: "ru" },
  { q: "хай!", intent: "greeting", lang: "ru" },
  { q: "привет, как дела?", intent: "greeting", lang: "ru" },
  { q: "Спасибо", intent: "thanks", lang: "ru" },
  { q: "Какой у тебя стек?", intent: "stack", lang: "ru" },
  { q: "что в стеке?", intent: "stack", lang: "ru" },
  { q: "привет, какой у тебя стек?", intent: "stack", lang: "ru" },
  { q: "какие проекты на FastAPI?", intent: "tech", lang: "ru" },
  { q: "какие проекты на Python?", intent: "tech", lang: "ru" },
  { q: "Покажи проекты", intent: "projects", lang: "ru" },
  { q: "Расскажи про ngieuapp", intent: "project", lang: "ru" },
  { q: "расскажи про AI Python Mentor", intent: "project", lang: "ru" },
  { q: "что такое TransactionMonitor?", intent: "project", lang: "ru" },
  { q: "расскажи про монитор транзакций", intent: "project", lang: "ru" },
  { q: "что за neural astar?", intent: "project", lang: "ru" },
  { q: "расскажи про k-nearest-neighbors", intent: "project", lang: "ru" },
  { q: "что такое portfolio-analytics?", intent: "project", lang: "ru" },
  { q: "Расскажи про RadarPPI-MTD", intent: "project", lang: "ru" },
  { q: "какие свидетельства и сертификаты есть?", intent: "certificates", lang: "ru" },
  { q: "где учишься?", intent: "education", lang: "ru" },
  { q: "какое у тебя образование?", intent: "education", lang: "ru" },
  { q: "Можно тебя нанять?", intent: "hiring", lang: "ru" },
  { q: "ты открыт к стажировке?", intent: "hiring", lang: "ru" },
  { q: "сколько стоит сайт?", intent: "freelance", lang: "ru" },
  { q: "делаешь на заказ?", intent: "freelance", lang: "ru" },
  { q: "как связаться?", intent: "contacts", lang: "ru" },
  { q: "твой телеграм?", intent: "contacts", lang: "ru" },
  { q: "где ты находишься?", intent: "location", lang: "ru" },
  { q: "какой часовой пояс?", intent: "location", lang: "ru" },
  { q: "дай резюме", intent: "resume", lang: "ru" },
  { q: "что такое pgvector?", intent: "search", lang: "ru" },
  // EN
  { q: "hi", intent: "greeting", lang: "en" },
  { q: "hello there", intent: "greeting", lang: "en" },
  { q: "thanks!", intent: "thanks", lang: "en" },
  { q: "What is your stack?", intent: "stack", lang: "en" },
  { q: "Which projects use Flutter?", intent: "tech", lang: "en" },
  { q: "Show me the projects", intent: "projects", lang: "en" },
  { q: "Tell me about ngieuapp", intent: "project", lang: "en" },
  { q: "Tell me about AI Python Mentor", intent: "project", lang: "en" },
  { q: "Tell me about RadarPPI-MTD", intent: "project", lang: "en" },
  { q: "What certifications do you have?", intent: "certificates", lang: "en" },
  { q: "What's your education?", intent: "education", lang: "en" },
  { q: "Can I hire you?", intent: "hiring", lang: "en" },
  { q: "how much does a site cost?", intent: "freelance", lang: "en" },
  { q: "How do I contact you?", intent: "contacts", lang: "en" },
  { q: "Where are you based?", intent: "location", lang: "en" },
  { q: "resume?", intent: "resume", lang: "en" },
  { q: "What is pgvector used for?", intent: "search", lang: "en" },
  { q: "asdfgh", intent: "search", answer: "fallback", lang: "en" },
];

const failures = [];
let passed = 0;

function fail(label, message) {
  failures.push(`${label}: ${message}`);
  console.log(`  FAIL ${label} — ${message}`);
}

for (const testCase of cases) {
  const label = `${testCase.lang.toUpperCase()} ${testCase.q}`;
  const detected = detectIntent(testCase.q);
  const lang = detectLang(testCase.q);
  const answer = answerLocal(testCase.q, { search });

  const expectedAnswer = testCase.answer ?? testCase.intent;
  if (detected.intent !== testCase.intent) fail(label, `намерение ${detected.intent}, ожидалось ${testCase.intent}`);
  else if (answer.intent !== expectedAnswer) fail(label, `ответ ${answer.intent}, ожидался ${expectedAnswer}`);
  else if (lang !== testCase.lang) fail(label, `язык ${lang}, ожидался ${testCase.lang}`);
  else if (answer.lang !== lang) fail(label, `ответ на ${answer.lang}, вопрос на ${lang}`);
  else if (answer.text.trim().length < 25) fail(label, `слишком короткий ответ (${answer.text.length})`);
  else if (/(?:content|stack|about|faq|generated)[\w-]*#\d/.test(answer.text)) fail(label, "в ответе сырой id чанка");
  else if (answer.chips.length < 2 || answer.chips.length > 3) fail(label, `follow-up чипов ${answer.chips.length}`);
  else {
    const links = [...answer.text.matchAll(/\]\(([^)\s]+)\)/g)].map((match) => match[1]);
    const bad = links.find((href) => !isSafeHref(href));
    if (bad) fail(label, `небезопасная ссылка ${bad}`);
    else {
      passed += 1;
      console.log(`  ok   ${label.padEnd(46)} → ${answer.intent.padEnd(9)} ${String(answer.text.length).padStart(4)} симв.`);
    }
  }
}

// «ку» не должно тянуть «курс»: приветствие решается до поиска.
{
  const answer = answerLocal("ку", { search });
  if (answer.intent !== "greeting" || /курс/i.test(answer.text)) fail("anti-курс", "«ку» ушло в поиск по «курс»");
  else {
    passed += 1;
    console.log("  ok   anti-курс: «ку» → greeting, без слова «курс»");
  }
}

// Чипы из UI и follow-up должны быть роутабельными, а не падать в fallback.
{
  const { assistantUi } = await import(pathToFileURL(bundle).href);
  const chips = new Set();
  for (const lang of ["en", "ru"]) {
    for (const chip of assistantUi[lang].chips) chips.add(chip);
    for (const group of Object.values(assistantUi[lang].answers.followUps)) {
      for (const chip of group) chips.add(chip);
    }
    for (const chip of assistantUi[lang].answers.suggestions) chips.add(chip);
  }
  const intents = new Set();
  for (const chip of chips) {
    const answer = answerLocal(chip, { search });
    intents.add(answer.intent);
    if (answer.intent === "fallback" || answer.intent === "search") fail("chips", `«${chip}» → ${answer.intent}`);
  }
  passed += 1;
  console.log(`  ok   чипы (${chips.size} шт.) роутятся: ${[...intents].sort().join(", ")}`);
}

// Fallback: честный текст + 2–3 подсказки + email.
{
  const answer = answerLocal("asdfgh", { search });
  if (!answer.text.includes("@") || answer.chips.length < 2 || answer.chips.length > 3) fail("fallback", "нет подсказок или email");
  else {
    passed += 1;
    console.log("  ok   fallback: email + подсказки");
  }
}

// SSE: каждая строка ровно один раз, буфер переносит только неполный хвост.
{
  const parser = createSseParser();
  const first = parser.push('data: {"choices":[{"delta":{"content":"Hel');
  const second = parser.push('lo"}}]}\ndata: {"choices":[{"delta":{"content":" world"}}]}\n');
  const tail = parser.flush();
  const deltas = [...first, ...second, ...tail].map(parseDelta).join("");
  if (first.length !== 0 || second.length !== 2 || tail.length !== 0 || deltas !== "Hello world") {
    fail("sse", `разбор потока дал "${deltas}" (кадров ${first.length + second.length + tail.length})`);
  } else {
    passed += 1;
    console.log("  ok   sse: 2 кадра, без дублей и потерь");
  }
}

// Мини-markdown: жирный, список, ссылка; javascript: не превращается в ссылку.
{
  const blocks = parseMarkdown("**Stack** — ok\n\n- [GitHub](https://github.com/coffee1337)\n- [bad](javascript:alert(1))");
  const list = blocks.find((block) => block.type === "list");
  const strong = blocks[0]?.type === "paragraph" && blocks[0].inline.some((node) => node.type === "strong");
  const hasLink = list?.type === "list" && list.items[0]?.some((node) => node.type === "link");
  const unsafe = list?.type === "list" && list.items[1]?.every((node) => node.type !== "link");
  if (!strong || !hasLink || !unsafe) fail("markdown", `strong=${strong} link=${hasLink} unsafe=${unsafe}`);
  else {
    passed += 1;
    console.log("  ok   markdown: bold/список/ссылка, javascript: отклонён");
  }
}

// Языковые пары UI-строк: набор ключей совпадает.
{
  const en = answerLocal("hi", { search });
  const ru = answerLocal("привет", { search });
  if (en.lang !== "en" || ru.lang !== "ru" || !en.chips.length || en.chips.length !== ru.chips.length) fail("i18n", "разъехались чипы RU/EN");
  else {
    passed += 1;
    console.log("  ok   i18n: RU/EN ответы и чипы на месте");
  }
}

// Паритет ключей assistant-ui: en и ru обязаны совпадать рекурсивно.
{
  const { assistantUi } = await import(pathToFileURL(bundle).href);
  const flatten = (value, prefix = "") =>
    Object.entries(value).flatMap(([key, item]) =>
      item && typeof item === "object" && !Array.isArray(item) ? flatten(item, `${prefix}${key}.`) : [`${prefix}${key}`],
    );
  const enKeys = flatten(assistantUi.en).sort();
  const ruKeys = flatten(assistantUi.ru).sort();
  const missing = enKeys.filter((key) => !ruKeys.includes(key));
  const extra = ruKeys.filter((key) => !enKeys.includes(key));
  if (missing.length || extra.length) fail("ui-parity", `лишние ru: ${extra.slice(0, 5)}; нет в ru: ${missing.slice(0, 5)}`);
  else {
    passed += 1;
    console.log(`  ok   ui-parity: ${enKeys.length} ключей совпадают в en и ru`);
  }
}

rmSync(tmp, { recursive: true, force: true });

const total = passed + failures.length;
console.log(`\n${failures.length ? "❌" : "✅"} test:assistant — ${passed}/${total} проверок, чанков ${docs.length}`);
if (failures.length) {
  for (const item of failures.slice(0, 20)) console.log(`  - ${item}`);
  process.exit(1);
}
