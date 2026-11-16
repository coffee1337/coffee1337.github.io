// Автотесты воркера без Cloudflare: контекст, синонимы, /health и /contact.
// Воркер загружается как модуль-строка: заглушки caches/fetch подставляются здесь же.
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const source = readFileSync(join(root, "worker", "index.js"), "utf8").replace("export default {", "const __handler = {");
const api = new Function(`${source}; return { terms, stem, selectContext, __handler };`)();
const { terms, stem, selectContext, __handler } = api;

const kb = JSON.parse(readFileSync(join(root, "public", "kb-index.json"), "utf8"));
let telegramCalls = 0;
let telegramFail = false;

globalThis.caches = { default: { match: async () => null, put: async () => {} } };
globalThis.fetch = async (url, init) => {
  if (String(url).includes("api.telegram.org")) {
    telegramCalls += 1;
    return { ok: !telegramFail, status: telegramFail ? 500 : 200, json: async () => ({ ok: !telegramFail }) };
  }
  return { ok: true, status: 200, json: async () => kb, clone() { return this; } };
};

const results = [];
const check = (name, condition, detail = "") => {
  results.push({ name, ok: Boolean(condition), detail });
  if (!condition) console.error(`FAIL ${name}${detail ? " — " + detail : ""}`);
};

// 1. Токенизация и основы
const t = terms("Tell me about AI, ML and C# — что с CI, TS и проектах?");
check("short terms kept", ["ai", "ml", "c#", "ci", "ts"].every((x) => t.includes(x)), t.join(","));
check("ru stem проектах → проект", stem("проектах") === "проект", stem("проектах"));
check("ru stem бэкендом → бэкенд", stem("бэкендом") === "бэкенд", stem("бэкендом"));
check("en stem projects → project", stem("projects") === "project", stem("projects"));

// 2. Контекст: RU, EN, кросс-язычные README
const sourcesOf = (picked) => picked.map((p) => p.title);
const ruFastapi = await selectContext("какие проекты на FastAPI?", "ru", {});
check(
  "ru fastapi → проекты на FastAPI",
  ruFastapi.some((p) => /AI Python Mentor|portfolio-analytics/.test(p.title)),
  sourcesOf(ruFastapi).join(" | "),
);

const enTelegram = await selectContext("tell me about the telegram bot", "en", {});
check(
  "en telegram → RU README ai-python-mentor",
  enTelegram.some((p) => /AI Python Mentor/.test(p.title)),
  sourcesOf(enTelegram).join(" | "),
);

const ruMonitor = await selectContext("расскажи про TransactionMonitor", "ru", {});
check(
  "ru monitor → EN README TransactionMonitor",
  ruMonitor.some((p) => /TransactionMonitor/.test(p.title)),
  sourcesOf(ruMonitor).join(" | "),
);

const ruNeural = await selectContext("что там с нейросетями и PyTorch?", "ru", {});
check(
  "ru нейросети → neural-astar",
  ruNeural.some((p) => /Neural A\*|neural-astar/i.test(p.title)),
  sourcesOf(ruNeural).join(" | "),
);

const enStack = await selectContext("What is your stack?", "en", {});
check("en stack non-empty", enStack.length > 0, String(enStack.length));
check("en stack starts with profile", /Profile/.test(enStack[0]?.title ?? ""), enStack[0]?.title ?? "");

// 3. /health
const health = await __handler.fetch(new Request("https://worker.test/health"), {});
const healthBody = await health.json();
check("health 200", health.status === 200, String(health.status));
check("health payload", healthBody.ok === true && healthBody.service === "coffee1337-chat", JSON.stringify(healthBody));

// 4. /contact
const contactReq = (body, origin = "https://coffee1337.github.io") =>
  new Request("https://worker.test/contact", {
    method: "POST",
    headers: { "content-type": "application/json", Origin: origin },
    body: JSON.stringify(body),
  });

const invalid = await __handler.fetch(contactReq({ name: "A", email: "nope", message: "short" }), {});
check("contact invalid → 400", invalid.status === 400, String(invalid.status));

const notConfigured = await __handler.fetch(
  contactReq({ name: "Egor", email: "a@b.co", topic: "hire", message: "Hello, I have a project for you." }),
  {},
);
check("contact without secrets → 503", notConfigured.status === 503, String(notConfigured.status));

telegramCalls = 0;
const sent = await __handler.fetch(
  contactReq({ name: "Egor", email: "a@b.co", topic: "project", message: "Hello, I have a project for you." }),
  { TG_BOT_TOKEN: "token", TG_CHAT_ID: "42" },
);
check("contact valid → 200", sent.status === 200, String(sent.status));
check("contact sends one telegram message", telegramCalls === 1, String(telegramCalls));

telegramCalls = 0;
const honeypot = await __handler.fetch(
  contactReq({ name: "Bot", email: "bot@spam.co", message: "buy now buy now", company: "spam" }),
  { TG_BOT_TOKEN: "token", TG_CHAT_ID: "42" },
);
check("honeypot → 200 без отправки", honeypot.status === 200 && telegramCalls === 0, `${honeypot.status}/${telegramCalls}`);

const foreign = await __handler.fetch(
  contactReq({ name: "Egor", email: "a@b.co", message: "Hello, I have a project" }, "https://evil.example"),
  {},
);
check("foreign origin → 403", foreign.status === 403, String(foreign.status));

telegramFail = true;
const failed = await __handler.fetch(
  contactReq({ name: "Egor", email: "a@b.co", message: "Hello, I have a project" }),
  { TG_BOT_TOKEN: "token", TG_CHAT_ID: "42" },
);
check("telegram failure → 502", failed.status === 502, String(failed.status));

const failedCount = results.filter((r) => !r.ok).length;
if (failedCount) {
  console.error(`\n❌ test:worker — ${failedCount}/${results.length} провалено`);
  process.exit(1);
}
console.log(`✅ test:worker — ${results.length}/${results.length} проверок (контекст, синонимы, /health, /contact)`);
