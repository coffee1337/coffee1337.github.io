/** Потоковый парсер SSE: каждая полная строка обрабатывается ровно один раз. */
export interface SseParser {
  push: (chunk: string) => string[];
  flush: () => string[];
}

export function createSseParser(): SseParser {
  let buffer = "";

  const takeLine = (line: string, out: string[]): void => {
    const clean = line.endsWith("\r") ? line.slice(0, -1) : line;
    if (!clean.startsWith("data:")) return;
    const data = clean.slice(5).trim();
    if (!data) return;
    out.push(data);
  };

  return {
    push(chunk: string): string[] {
      buffer += chunk;
      const out: string[] = [];
      let index = buffer.indexOf("\n");
      while (index !== -1) {
        takeLine(buffer.slice(0, index), out);
        buffer = buffer.slice(index + 1);
        index = buffer.indexOf("\n");
      }
      return out;
    },
    flush(): string[] {
      if (!buffer.trim()) {
        buffer = "";
        return [];
      }
      const out: string[] = [];
      takeLine(buffer, out);
      buffer = "";
      return out;
    },
  };
}

/** Достаёт дельту текста из OpenAI-совместимого chunk. */
export function parseDelta(payload: string): string {
  if (payload === "[DONE]") return "";
  try {
    const parsed = JSON.parse(payload) as { choices?: Array<{ delta?: { content?: string } }> };
    return parsed.choices?.[0]?.delta?.content ?? "";
  } catch {
    return "";
  }
}
