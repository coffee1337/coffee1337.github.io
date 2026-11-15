import type { Lang } from "../../content/types";
import type { Chunk, Searcher } from "./types";

const PROFILE_TITLES = ["profile", "профиль"];

/** Профильный чанк (о себе) — он уходит в Worker всегда, независимо от вопроса. */
export function pickProfileChunk(docs: Chunk[], lang: Lang): Chunk | undefined {
  const sameLang = docs.filter((doc) => doc.lang === lang || doc.lang === "both");
  return (
    sameLang.find((doc) => PROFILE_TITLES.some((title) => doc.title.toLowerCase().includes(title))) ??
    sameLang.find((doc) => doc.href?.endsWith("#about"))
  );
}

/** Контекст для Worker: top-k по вопросу + профиль, не больше `limit` чанков. */
export function workerChunks(question: string, lang: Lang, docs: Chunk[], search?: Searcher, limit = 8): Chunk[] {
  const hits = search ? search(question, lang).slice(0, Math.max(1, limit - 1)) : [];
  const profile = pickProfileChunk(docs, lang);
  const seen = new Set<string>();
  const out: Chunk[] = [];
  for (const chunk of [...(profile ? [profile] : []), ...hits]) {
    if (seen.has(chunk.id) || seen.has(chunk.title)) continue;
    seen.add(chunk.id);
    seen.add(chunk.title);
    out.push({
      id: chunk.id,
      title: chunk.title,
      text: chunk.text,
      source: chunk.source,
      lang: chunk.lang,
      href: chunk.href,
    });
  }
  return out.slice(0, limit);
}
