import type { AnswerIntent } from "../../content/assistant-ui";
import { matches, normalize, phrase, tokens } from "./lang";

export interface DetectedIntent {
  intent: AnswerIntent;
  /** id проекта из src/content/projects.ts */
  projectId?: string;
  /** Канонический id технологии (нижний регистр, как в стеках проектов). */
  tech?: string;
  /** Вопрос начинался с приветствия — ответ можно начать с «Привет». */
  polite: boolean;
}

const GREETINGS = [
  "привет",
  "приветствую",
  "приветик",
  "прив",
  "здравствуй",
  "здравствуйте",
  "добрый день",
  "добрый вечер",
  "доброе утро",
  "хай",
  "ку",
  "йо",
  "hi",
  "hello",
  "hey",
  "yo",
  "hiya",
  "howdy",
];

const SMALL_TALK = ["как дела", "как ты", "как жизнь", "что нового", "how are you", "how is it going", "what is up", "whats up"];

const FILLER = new Set(["there", "everyone", "all", "guys", "everybody", "всем", "народ", "егор", "egor", "bro", "друг"]);

const THANKS = ["спасибо", "спс", "благодарю", "thanks", "thank you", "thx", "ty", "cheers"];

const EDUCATION = [
  "образован*",
  "учиш*",
  "учит*",
  "учус*",
  "учеб*",
  "вуз",
  "вузе",
  "универ*",
  "студент*",
  "диплом*",
  "специальност*",
  "курс*",
  "education",
  "study",
  "studies",
  "studying",
  "student*",
  "university",
  "college",
  "degree",
  "coursework",
];

const PROJECTS_LIST = ["проект*", "project*", "портфоли*", "portfolio", "кейс*", "case"];

const CERTIFICATES = [
  "сертификат*",
  "аккредитац*",
  "роспатент*",
  "патент*",
  "свидетельств*",
  "certificat*",
  "credential*",
  "accreditation*",
  "rospatent",
  "patent*",
  "snowflake",
];

const STACK = [
  "стек*",
  "stack",
  "технолог*",
  "technology",
  "technologies",
  "инструмент*",
  "tool",
  "tools",
  "навык*",
  "skill*",
  "используеш*",
  "использует",
  "чем работаеш*",
];

const HIRING = [
  "найм*",
  "нанять",
  "нанят*",
  "hire",
  "hiring",
  "стажиров*",
  "интерншип*",
  "internship",
  "internships",
  "ваканс*",
  "vacancy",
  "vacancies",
  "работа",
  "работу",
  "job",
  "jobs",
  "offer",
  "оффер",
  "доступ*",
  "available",
  "availability",
  "открыт*",
  "open to",
];

const FREELANCE = ["фриланс*", "freelance", "заказ*", "стоимост*", "стоит", "стоят", "цена", "цены", "price", "pricing", "cost", "costs", "budget"];

const RESUME = ["резюме", "resume", "cv", "скачать", "download"];

const CONTACTS = [
  "связат*",
  "связь",
  "контакт*",
  "contact*",
  "email",
  "e-mail",
  "почт*",
  "написат*",
  "напиши",
  "telegram",
  "телеграм*",
  "linkedin",
  "reach",
  "write",
  "mail",
];

const LOCATION = [
  "где",
  "where",
  "локац*",
  "location",
  "город*",
  "city",
  "часов*",
  "timezone",
  "time zone",
  "пояс",
  "utc",
  "msk",
  "мск",
  "откуда",
  "based",
  "страна",
  "country",
  "нижн*",
];

/** Алиасы проектов: id → фразы. Порядок не важен, выбирается самое длинное совпадение. */
export const PROJECT_ALIASES: Record<string, string[]> = {
  "ai-python-mentor": [
    "ai-python-mentor",
    "ai python mentor",
    "python mentor",
    "ai mentor",
    "mentor",
    "ментор",
    "ментора",
    "менторе",
    "питон ментор",
    "ментор по python",
  ],
  "radar-ppi-mtd": [
    "radar-ppi-mtd",
    "radarppi-mtd",
    "radarppi",
    "radar ppi",
    "рлс",
    "ико рлс",
    "генератор рлс",
    "детектор целей",
    "yolo11s",
    "yolo11",
  ],
  ngie: ["ngieuapp", "ngie", "ngieu", "нгиэуapp", "приложение нгиэу", "университетское приложение", "uni app"],
  "transaction-monitor": [
    "transactionmonitor",
    "transaction-monitor",
    "transaction monitor",
    "monitor",
    "монитор",
    "монитора",
    "транзакционный монитор",
    "транзакции",
  ],
  "neural-astar": [
    "neural-astar",
    "neural-astar-heuristic",
    "neural astar",
    "astar",
    "a*",
    "a-star",
    "a star",
    "эвристика",
    "нейросетевой астар",
    "нейро астар",
  ],
  knn: [
    "k-nearest-neighbors",
    "k-nearest",
    "k nearest neighbors",
    "knn",
    "k-nn",
    "ближайшие соседи",
    "ближайших соседей",
    "k ближайших соседей",
    "кнн",
  ],
  "portfolio-analytics": [
    "portfolio-analytics",
    "portfolio analytics",
    "portfolioanalytics",
    "аналитика",
    "аналитики",
    "analytics",
    "статистика сайта",
    "site analytics",
  ],
};

/** Технологии: канонический id → отображаемое имя и алиасы вопроса. */
export const TECHS: ReadonlyArray<{ id: string; label: string; aliases: string[] }> = [
  { id: "python", label: "Python", aliases: ["python", "питон", "пайтон", "python3"] },
  { id: "fastapi", label: "FastAPI", aliases: ["fastapi", "фастапи", "фаст апи"] },
  { id: "postgresql", label: "PostgreSQL", aliases: ["postgresql", "postgres", "постгрес", "постгре", "пг"] },
  { id: "sqlalchemy", label: "SQLAlchemy", aliases: ["sqlalchemy", "алхимия"] },
  { id: "alembic", label: "Alembic", aliases: ["alembic", "алембик"] },
  { id: "redis", label: "Redis", aliases: ["redis", "редис"] },
  { id: "docker", label: "Docker", aliases: ["docker", "докер"] },
  { id: "llm", label: "LLM", aliases: ["llm", "llm api", "языковая модель", "языковые модели"] },
  { id: "rag", label: "RAG", aliases: ["rag", "rag pipeline", "retrieval"] },
  { id: "pytorch", label: "PyTorch", aliases: ["pytorch", "пайторч", "torch"] },
  { id: "yolo11s", label: "YOLO11s", aliases: ["yolo11s", "yolo11", "yolo"] },
  { id: "opencv", label: "OpenCV", aliases: ["opencv", "cv2"] },
  { id: "snowflake", label: "Snowflake", aliases: ["snowflake", "сноуфлейк", "snowpark"] },
  { id: "azure", label: "Azure", aliases: ["azure", "microsoft azure", "ажур"] },
  { id: "numpy", label: "NumPy", aliases: ["numpy", "намп", "нумпай"] },
  { id: "pandas", label: "Pandas", aliases: ["pandas", "пандас"] },
  { id: "flutter", label: "Flutter", aliases: ["flutter", "флаттер"] },
  { id: "dart", label: "Dart", aliases: ["dart", "дарт"] },
  { id: "riverpod", label: "Riverpod", aliases: ["riverpod"] },
  { id: "drift", label: "Drift", aliases: ["drift"] },
  { id: "sqlite", label: "SQLite", aliases: ["sqlite", "sq lite"] },
  { id: "swift", label: "Swift", aliases: ["swift", "свифт"] },
  { id: "widgetkit", label: "WidgetKit", aliases: ["widgetkit", "widget kit"] },
  { id: "c#", label: "C#", aliases: ["c#", "c sharp", "си шарп"] },
  { id: ".net", label: ".NET", aliases: [".net", "dotnet", "дотнет"] },
  { id: "winui", label: "WinUI 3", aliases: ["winui", "winui 3"] },
  { id: "sql server", label: "SQL Server", aliases: ["sql server", "mssql"] },
  { id: "c++", label: "C++", aliases: ["c++", "cpp", "си++", "плюсы"] },
  { id: "cmake", label: "CMake", aliases: ["cmake"] },
  { id: "winapi", label: "WinAPI", aliases: ["winapi", "win32"] },
  { id: "next.js", label: "Next.js", aliases: ["next.js", "nextjs", "некст"] },
  { id: "react", label: "React", aliases: ["react", "реакт"] },
  { id: "typescript", label: "TypeScript", aliases: ["typescript"] },
  { id: "javascript", label: "JavaScript", aliases: ["javascript"] },
  { id: "git", label: "Git", aliases: ["git", "гит"] },
  { id: "github actions", label: "GitHub Actions", aliases: ["github actions", "ci/cd"] },
  { id: "linux", label: "Linux", aliases: ["linux", "линукс"] },
];

function stripGreeting(query: string): { greeting: boolean; rest: string } {
  let rest = query;
  let greeting = false;
  for (const item of GREETINGS) {
    const needle = phrase(item);
    if (needle.length > 2 && rest.startsWith(needle)) {
      rest = ` ${rest.slice(needle.length)}`;
      greeting = true;
      break;
    }
  }
  return { greeting, rest };
}

function stripThanks(query: string): { matched: boolean; rest: string } {
  let matched = false;
  const kept = tokens(query).filter((token) => {
    if (THANKS.includes(token)) {
      matched = true;
      return false;
    }
    return true;
  });
  return { matched, rest: kept.length ? ` ${kept.join(" ")} ` : " " };
}

function longestProjectAlias(query: string): string | undefined {
  let best: { id: string; length: number } | undefined;
  for (const [id, aliases] of Object.entries(PROJECT_ALIASES)) {
    for (const alias of aliases) {
      const needle = phrase(alias);
      if (needle.trim().length < 2 || !query.includes(needle)) continue;
      if (!best || needle.length > best.length) best = { id, length: needle.length };
    }
  }
  return best?.id;
}

function findTech(query: string): { id: string; label: string } | undefined {
  let best: { id: string; label: string; length: number } | undefined;
  for (const tech of TECHS) {
    for (const alias of tech.aliases) {
      const needle = phrase(alias);
      if (needle.trim().length < 2 || !query.includes(needle)) continue;
      if (!best || needle.length > best.length) best = { id: tech.id, label: tech.label, length: needle.length };
    }
  }
  return best ? { id: best.id, label: best.label } : undefined;
}

/**
 * Роутер намерений. Работает ДО полнотекстового поиска: приветствие, благодарность,
 * стек, проекты, конкретный проект, проекты по технологии, образование, найм,
 * фриланс, контакты, локация, резюме. Иначе — `search`.
 */
export function detectIntent(question: string): DetectedIntent {
  const query = normalize(question);
  const greeted = stripGreeting(query);
  const thanks = stripThanks(greeted.rest);
  let body = thanks.rest;

  const onlyFiller = tokens(body).every((token) => FILLER.has(token));
  const bodyTokens = tokens(body).filter((token) => !FILLER.has(token));
  const polite = greeted.greeting || thanks.matched;

  if (greeted.greeting && (bodyTokens.length === 0 || onlyFiller)) return { intent: "greeting", polite };
  if (matches(body, SMALL_TALK) && bodyTokens.length <= 6) return { intent: "greeting", polite };
  if (thanks.matched && bodyTokens.length <= 2) return { intent: "thanks", polite };

  if (matches(body, EDUCATION)) return { intent: "education", polite };

  const projectId = longestProjectAlias(body);
  if (projectId) return { intent: "project", projectId, polite };

  if (matches(body, CERTIFICATES)) return { intent: "certificates", polite };

  const tech = findTech(body);
  if (tech) return { intent: "tech", tech: tech.id, polite };

  if (matches(body, STACK)) return { intent: "stack", polite };
  if (matches(body, PROJECTS_LIST)) return { intent: "projects", polite };

  if (matches(body, HIRING)) return { intent: "hiring", polite };
  if (matches(body, FREELANCE)) return { intent: "freelance", polite };
  if (matches(body, RESUME)) return { intent: "resume", polite };
  if (matches(body, CONTACTS)) return { intent: "contacts", polite };
  if (matches(body, LOCATION)) return { intent: "location", polite };

  return { intent: "search", polite };
}
