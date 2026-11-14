import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useSite } from "../../context/site";

type Chunk = { id: string; title: string; text: string; source: string; lang: string };
type Msg = { role: "user" | "bot"; text: string; sources?: string[]; streaming?: boolean };

const API_URL = import.meta.env.VITE_CHAT_API_URL as string | undefined;

/** AI-ассистент (§5): локальный поиск по MiniSearch всегда, LLM через Worker — опционально. */
export function Assistant() {
  const { dict, lang } = useSite();
  const a = dict.sections.assistant;
  const [open, setOpen] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [index, setIndex] = useState<{ search: (q: string, opts?: unknown) => Array<{ id: string; title: string; text: string; source: string; lang: string }> } | null>(null);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [value, setValue] = useState("");
  const [busy, setBusy] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onOpen = () => setOpen(true);
    window.addEventListener("open-ai-chat", onOpen);
    return () => window.removeEventListener("open-ai-chat", onOpen);
  }, []);

  useEffect(() => {
    if (!open) return;
    inputRef.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const load = useCallback(async () => {
    if (index || loaded) return;
    setLoaded(true);
    try {
      const [{ default: MiniSearch }] = await Promise.all([import("minisearch")]);
      const response = await fetch("/kb-index.json", { cache: "force-cache" });
      const payload = (await response.json()) as { index: unknown; docs: Chunk[] };
      const mini = MiniSearch.loadJSON(JSON.stringify(payload.index), {
        fields: ["title", "text", "tags"],
        storeFields: ["title", "text", "source", "lang"],
        searchOptions: { boost: { title: 2, tags: 1.5 }, fuzzy: 0.2, prefix: true },
      });
      setIndex(mini as never);
    } catch {
      setIndex(null);
    }
  }, [index, loaded]);

  const ask = async (question: string) => {
    if (!question.trim() || busy) return;
    setBusy(true);
    setValue("");
    setMessages((prev) => [...prev, { role: "user", text: question }]);
    await load();

    const found = index ? (index.search(question) as Chunk[]).slice(0, 5) : [];
    const preferred = found.filter((chunk) => chunk.lang === lang || chunk.lang === "both");
    const context = (preferred.length ? preferred : found).slice(0, 5);

    if (!context.length) {
      setMessages((prev) => [...prev, { role: "bot", text: a.fallback }]);
      setBusy(false);
      return;
    }

    const sources = Array.from(new Set(context.map((chunk) => chunk.source)));

    // локальный режим: собираем ответ из найденных фрагментов, стримим по словам
    const localAnswer = context
      .map((chunk) => chunk.text.split(/\n{2,}/).find((paragraph) => paragraph.length > 40) ?? chunk.text)
      .join(" ")
      .replace(/\s+/g, " ")
      .slice(0, 420);

    setMessages((prev) => [...prev, { role: "bot", text: "", sources, streaming: true }]);

    const stream = async (text: string) => {
      const words = text.split(" ");
      for (let i = 0; i < words.length; i += 1) {
        const partial = words.slice(0, i + 1).join(" ");
        setMessages((prev) => prev.map((message, idx) => (idx === prev.length - 1 ? { ...message, text: partial } : message)));
        await new Promise((resolve) => setTimeout(resolve, 26));
      }
      setMessages((prev) => prev.map((message, idx) => (idx === prev.length - 1 ? { ...message, streaming: false } : message)));
    };

    if (API_URL) {
      try {
        const response = await fetch(API_URL, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ question, chunks: context.map(({ title, text }) => ({ title, text })) }),
        });
        if (!response.ok || !response.body) throw new Error("worker");
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        let answer = "";
        while (true) {
          const { value: chunk, done } = await reader.read();
          if (done) break;
          buffer += decoder.decode(chunk, { stream: true });
          for (const line of buffer.split("\n")) {
            if (!line.startsWith("data:")) continue;
            const data = line.slice(5).trim();
            if (data === "[DONE]") continue;
            try {
              const parsed = JSON.parse(data) as { choices?: Array<{ delta?: { content?: string } }> };
              const delta = parsed.choices?.[0]?.delta?.content;
              if (delta) {
                answer += delta;
                setMessages((prev) => prev.map((message, i) => (i === prev.length - 1 ? { ...message, text: answer } : message)));
              }
            } catch {
              /* частичный кадр — пропускаем */
            }
          }
          buffer = buffer.slice(buffer.lastIndexOf("\n") + 1);
        }
        if (!answer) throw new Error("empty");
        setMessages((prev) => prev.map((message, i) => (i === prev.length - 1 ? { ...message, streaming: false } : message)));
        setBusy(false);
        return;
      } catch {
        setMessages((prev) => prev.slice(0, -1));
        setMessages((prev) => [...prev, { role: "bot", text: "", sources, streaming: true }]);
      }
    }

    await stream(localAnswer);
    setBusy(false);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((state) => !state)}
        aria-label={open ? a.close : a.open}
        aria-expanded={open}
        className="fixed bottom-5 right-5 z-[80] grid h-14 w-14 place-items-center rounded-full border border-[var(--line)] bg-[var(--bg-2)] shadow-lg transition-transform hover:scale-105"
      >
        <svg viewBox="0 0 32 32" className="h-7 w-7" aria-hidden>
          <rect x={7} y={10} width={14} height={13} rx={2} fill="none" stroke="var(--accent)" strokeWidth={1.5} />
          <path d="M21 13h3a3 3 0 0 1 0 6h-3" fill="none" stroke="var(--accent)" strokeWidth={1.5} />
          <path d="M11 22v3M16 22v3" stroke="var(--accent-2)" strokeWidth={1.5} />
          <path d="M12 5c0 2-2 2-2 4M17 4c0 2-2 2-2 4" stroke="var(--accent-2)" strokeWidth={1.2} opacity={0.7} />
        </svg>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.98 }}
            transition={{ duration: 0.22, ease: [0.2, 0.8, 0.2, 1] }}
            className="fixed bottom-24 right-4 z-[80] flex max-h-[70vh] w-[min(420px,calc(100vw-2rem))] flex-col border border-[var(--line)] bg-[var(--bg-2)] shadow-2xl"
            role="dialog"
            aria-modal="false"
            aria-label={a.title}
            onKeyDown={(event) => event.key === "Escape" && setOpen(false)}
          >
            <div className="flex items-center gap-2 border-b border-[var(--line)] px-4 py-3">
              <div>
                <p className="font-mono text-[11px] uppercase tracking-[0.12em]">{a.title}</p>
                <p className="mt-0.5 flex items-center gap-1.5 font-mono text-[9px] text-[var(--ink-faint)]">
                  <span className="h-1.5 w-1.5 rounded-full bg-[var(--ok)]" aria-hidden />
                  {a.online} · {a.note}
                </p>
              </div>
              <button type="button" onClick={() => setOpen(false)} aria-label={a.close} className="ml-auto font-mono text-xs text-[var(--ink-faint)] hover:text-[var(--ink)]">
                ✕
              </button>
            </div>

            <div ref={listRef} className="flex-1 space-y-3 overflow-auto p-4">
              {messages.length === 0 && (
                <div className="flex flex-wrap gap-2">
                  {a.chips.map((chip) => (
                    <button
                      key={chip}
                      type="button"
                      onClick={() => void ask(chip)}
                      className="rounded-full border border-[var(--line)] px-3 py-1 text-left font-mono text-[11px] text-[var(--ink-dim)] hover:border-[var(--accent)] hover:text-[var(--ink)]"
                    >
                      {chip}
                    </button>
                  ))}
                </div>
              )}

              {messages.map((message, i) => (
                <div key={i} className={message.role === "user" ? "text-right" : ""}>
                  <div
                    className={`inline-block max-w-[92%] px-3 py-2 text-sm leading-relaxed ${
                      message.role === "user"
                        ? "bg-[var(--accent)] text-[var(--bg)]"
                        : "border border-[var(--line)] bg-[var(--bg)] text-[var(--ink-dim)]"
                    }`}
                  >
                    {message.text || "…"}
                    {message.streaming && <span className="ml-0.5 inline-block h-3 w-1 animate-pulse bg-[var(--accent)] align-middle" />}
                  </div>
                  {message.sources && message.sources.length > 0 && (
                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                      <span className="font-mono text-[9px] uppercase tracking-[0.1em] text-[var(--ink-faint)]">{a.sources}:</span>
                      {message.sources.map((source) => (
                        <span key={source} className="rounded-full border border-[var(--line)] px-2 py-0.5 font-mono text-[9px] text-[var(--ink-faint)]">
                          {source}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>

            <form
              onSubmit={(event) => {
                event.preventDefault();
                void ask(value);
              }}
              className="flex items-center gap-2 border-t border-[var(--line)] p-3"
            >
              <input
                ref={inputRef}
                value={value}
                onChange={(event) => setValue(event.target.value)}
                placeholder={a.placeholder}
                aria-label={a.placeholder}
                className="w-full bg-transparent font-mono text-sm outline-none placeholder:text-[var(--ink-faint)]"
              />
              <button type="submit" disabled={busy} className="rounded-full bg-[var(--accent)] px-3 py-1 font-mono text-[10px] uppercase text-[var(--bg)] disabled:opacity-50">
                {a.send}
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
