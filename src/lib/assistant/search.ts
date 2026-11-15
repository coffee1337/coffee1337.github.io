import type { Lang } from "../../content/types";
import type { Chunk, SearchHit, Searcher } from "./types";
import { tokens } from "./lang";

const STOP = new Set([
  // ru
  "и","в","во","на","не","что","как","это","я","ты","он","она","мы","вы","они","у","с","со","к","по","о","об","для",
  "из","от","до","же","ли","бы","или","а","но","да","нет","так","вот","мне","меня","тебя","мой","твой","свой","весь",
  "есть","был","была","быть","можно","нужно","про","чем","кто","где","когда","почему","зачем","какой","какая","какие",
  "сколько","твоя","твои","его","ее","их","них","нас","вас","себя","там","тут","этот","эта","эти","the",
  // en
  "what","is","are","was","were","the","a","an","of","do","does","did","you","your","i","my","me","it","this","that",
  "and","or","to","in","on","for","with","about","tell","show","please","can","could","would","should","how","who",
  "where","when","why","which","any","some","there","at","by","from","be","been","have","has","had","we","they","he",
  "she","them","us","as","if","so","just","give","know","more","most",
]);

const SYNONYMS: Record<string, string[]> = {
  бэкенд: ["backend", "python", "fastapi"],
  бекенд: ["backend", "python", "fastapi"],
  бэкэнд: ["backend", "python", "fastapi"],
  фронтенд: ["frontend", "react", "next.js"],
  "база данных": ["postgresql", "sqlalchemy"],
  бд: ["postgresql"],
  питон: ["python"],
  докер: ["docker"],
  контейнер: ["docker"],
  ии: ["llm", "ai"],
  нейросеть: ["pytorch", "neural"],
  нейросети: ["pytorch", "neural"],
  нейронка: ["pytorch", "neural"],
  ментор: ["mentor"],
  обучение: ["learning", "mentor"],
  резюме: ["resume", "cv"],
  опыт: ["experience"],
  проекты: ["projects"],
  проектов: ["projects"],
  стоимость: ["price", "cost"],
  цена: ["price", "cost"],
  зарплата: ["price", "cost"],
  фриланс: ["freelance"],
  стажировка: ["internship"],
  найм: ["hiring"],
  контакты: ["contacts", "telegram", "email"],
  связь: ["contacts", "telegram", "email"],
  университет: ["university"],
  образование: ["education"],
  telegram: ["contacts"],
  телеграм: ["contacts", "telegram"],
  backend: ["python", "fastapi"],
  frontend: ["react", "next.js"],
  price: ["cost", "pricing"],
  cost: ["price", "pricing"],
  hire: ["hiring"],
  cv: ["resume"],
  stack: ["technologies", "python"],
};

/** Убирает стоп-слова и добавляет синонимы — так MiniSearch находит «бэкенд» по «backend». */
export function expandQuery(question: string): string {
  const raw = tokens(question).filter((token) => token.length > 1 && !STOP.has(token));
  const expanded: string[] = [];
  for (const token of raw) {
    expanded.push(token);
    const extra = SYNONYMS[token];
    if (extra) expanded.push(...extra);
  }
  return Array.from(new Set(expanded)).join(" ");
}

/** Есть ли в чанке хоть один осмысленный токен вопроса (защита от мусорных fuzzy-совпадений). */
export function hasOverlap(question: string, hit: Chunk): boolean {
  const haystack = `${hit.title} ${hit.text}`.toLowerCase().replace(/ё/g, "е");
  return expandQuery(question)
    .split(" ")
    .filter((token) => token.length >= 3)
    .some((token) => haystack.includes(token.length >= 5 ? token.slice(0, 5) : token));
}

export interface MiniSearchLike {
  search: (query: string, options?: Record<string, unknown>) => Array<Record<string, unknown>>;
}

const SEARCH_OPTIONS = {
  boost: { title: 2.2 },
  combineWith: "OR",
  // префикс — только для терминов от 3 символов, fuzzy — только от 4
  prefix: (term: string) => term.length >= 3,
  fuzzy: (term: string) => (term.length >= 4 ? 0.2 : false),
};

/** Обёртка над загруженным индексом: единая логика поиска для клиента и тестов. */
export function makeSearcher(mini: MiniSearchLike): Searcher {
  return (question: string, lang?: Lang): SearchHit[] => {
    const query = expandQuery(question);
    if (!query) return [];
    const raw = mini.search(query, SEARCH_OPTIONS);
    const hits = raw
      .map((row) => ({
        id: String(row.id ?? ""),
        title: String(row.title ?? ""),
        text: String(row.text ?? ""),
        source: String(row.source ?? ""),
        lang: (row.lang === "ru" || row.lang === "en" ? row.lang : "both") as Lang | "both",
        href: typeof row.href === "string" ? row.href : undefined,
        score: Number(row.score ?? 0),
      }))
      .filter((hit) => hit.text.length > 0 && hasOverlap(question, hit));

    // если есть чанки на языке вопроса — чужой язык в ответ не подмешиваем
    const sameLang = lang ? hits.filter((hit) => hit.lang === lang || hit.lang === "both") : [];
    const pool = sameLang.length ? sameLang : hits;

    return pool
      .sort((a, b) => b.score - a.score)
      .slice(0, 6);
  };
}

/** Собирает MiniSearch из готовых чанков (Node-тесты, SSR). */
export async function searcherFromDocs(docs: Chunk[]): Promise<Searcher> {
  const { default: MiniSearch } = await import("minisearch");
  const mini = new MiniSearch({
    fields: ["title", "text"],
    storeFields: ["title", "text", "source", "lang", "href"],
  });
  mini.addAll(docs);
  return makeSearcher(mini as unknown as MiniSearchLike);
}
