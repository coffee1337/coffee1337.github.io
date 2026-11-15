import type { Lang } from "../../content/types";

/** Кириллица в вопросе → русский ответ, иначе английский. */
export function detectLang(question: string): Lang {
  return /[\u0400-\u04FF]/.test(question) ? "ru" : "en";
}

const PUNCT = /[^\p{L}\p{N}+#*.]+/gu;

/**
 * Нормализация для роутера: нижний регистр, ё→е, пунктуация → пробел,
 * пробелы схлопнуты, строка обёрнута в пробелы. `+ # * .` сохраняются,
 * чтобы не потерять c++, c#, .net, a*, next.js.
 */
export function normalize(text: string): string {
  return ` ${text
    .toLowerCase()
    .replace(/ё/g, "е")
    .replace(PUNCT, " ")
    .replace(/\s+/g, " ")
    .trim()} `;
}

export function tokens(text: string): string[] {
  return normalize(text).trim().split(" ").filter(Boolean);
}

export function phrase(term: string): string {
  return ` ${normalize(term).trim()} `;
}

/** Точное совпадение токена/фразы. `item` с `*` на конце — префикс токена. */
export function matches(query: string, list: readonly string[]): boolean {
  return list.some((item) => matchesOne(query, item));
}

function matchesOne(query: string, item: string): boolean {
  if (item.endsWith("*")) {
    const stem = normalize(item.slice(0, -1)).trim();
    if (!stem) return false;
    return tokens(query).some((token) => token.startsWith(stem));
  }
  const needle = phrase(item);
  return needle.trim().length > 0 && query.includes(needle);
}
