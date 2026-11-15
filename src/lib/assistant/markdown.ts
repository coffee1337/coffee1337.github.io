/** Мини-markdown без зависимостей: **жирный**, `код`, [ссылка](href), списки. */
export type InlineNode =
  | { type: "text"; value: string }
  | { type: "strong"; value: string }
  | { type: "code"; value: string }
  | { type: "link"; value: string; href: string };

export type MdBlock =
  | { type: "paragraph"; inline: InlineNode[] }
  | { type: "list"; items: InlineNode[][] };

const HTML_TAG = /<[^>]*>/g;

/** Ссылки разрешены только на http(s), mailto и внутренние пути сайта. */
export function isSafeHref(href: string): boolean {
  const value = href.trim();
  if (!value || value.startsWith("//")) return false;
  if (/^https?:\/\//i.test(value)) return true;
  if (/^mailto:/i.test(value)) return true;
  return value.startsWith("/") && !value.startsWith("//");
}

const INLINE = /\*\*([^*]+)\*\*|`([^`]+)`|\[([^\]]+)\]\(([^)\s]+)\)/g;

export function parseInline(source: string): InlineNode[] {
  const text = source.replace(HTML_TAG, "");
  const nodes: InlineNode[] = [];
  let last = 0;
  for (const match of text.matchAll(INLINE)) {
    const index = match.index ?? 0;
    if (index > last) nodes.push({ type: "text", value: text.slice(last, index) });
    const [whole, bold, code, label, href] = match;
    if (bold !== undefined) nodes.push({ type: "strong", value: bold });
    else if (code !== undefined) nodes.push({ type: "code", value: code });
    else if (label !== undefined && href !== undefined) {
      if (isSafeHref(href)) nodes.push({ type: "link", value: label, href });
      else nodes.push({ type: "text", value: label });
    } else nodes.push({ type: "text", value: whole });
    last = index + whole.length;
  }
  if (last < text.length) nodes.push({ type: "text", value: text.slice(last) });
  return nodes.length ? nodes : [{ type: "text", value: "" }];
}

/** Разбирает ответ на абзацы и списки (`- `). */
export function parseMarkdown(source: string): MdBlock[] {
  const blocks: MdBlock[] = [];
  const chunks = source.replace(/\r\n/g, "\n").split(/\n{2,}/);

  for (const chunk of chunks) {
    const lines = chunk.split("\n").map((line) => line.trimEnd());
    const listLines = lines.filter((line) => /^[-*]\s+/.test(line));
    if (listLines.length && listLines.length === lines.filter((line) => line.trim().length > 0).length) {
      blocks.push({
        type: "list",
        items: listLines.map((line) => parseInline(line.replace(/^[-*]\s+/, ""))),
      });
      continue;
    }
    const text = lines
      .filter((line) => line.trim().length > 0)
      .map((line) => line.replace(/^#{1,6}\s+/, ""))
      .join(" ")
      .trim();
    if (!text) continue;
    blocks.push({ type: "paragraph", inline: parseInline(text) });
  }

  return blocks;
}
