import type { Lang } from "../../content/types";
import type { AnswerIntent } from "../../content/assistant-ui";

/** Чанк базы знаний: ровно то, что лежит в public/kb-index.json. */
export interface Chunk {
  id: string;
  title: string;
  text: string;
  source: string;
  lang: Lang | "both";
  href?: string;
}

export interface SearchHit extends Chunk {
  score: number;
}

export type Searcher = (question: string, lang?: Lang) => SearchHit[];

/** Ответ локального режима. `text` — безопасный мини-markdown. */
export interface Answer {
  intent: AnswerIntent;
  lang: Lang;
  text: string;
  chips: string[];
  sources: string[];
  hrefs: string[];
}

export interface LocalAnswerOptions {
  search?: Searcher;
}
