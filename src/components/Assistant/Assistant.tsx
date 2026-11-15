import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useSite } from "../../context/site";
import { assistantUi } from "../../content/assistant-ui";
import { useFocusTrap } from "../../hooks/useFocusTrap";
import { useScrollLock } from "../../hooks/useScrollLock";
import { answerLocal, followUpChips } from "../../lib/assistant/answers";
import { workerChunks } from "../../lib/assistant/kb";
import { parseMarkdown, type InlineNode } from "../../lib/assistant/markdown";
import { makeSearcher, type MiniSearchLike } from "../../lib/assistant/search";
import { createSseParser, parseDelta } from "../../lib/assistant/sse";
import type { Answer, Chunk, Searcher } from "../../lib/assistant/types";

const API_URL = (import.meta.env.VITE_CHAT_API_URL as string | undefined)?.trim();
const REQUEST_TIMEOUT = 15_000;
const STORAGE_KEY = "coffee1337:assistant:v1";
const MAX_MESSAGES = 30;

type Source = { title: string; href?: string };

type Message = {
  id: string;
  role: "user" | "bot";
  text: string;
  sources: Source[];
  chips: string[];
  streaming?: boolean;
};

type Kb = { search: Searcher; docs: Chunk[] };

type HistoryTurn = { role: "user" | "assistant"; content: string };

let sequence = 0;
const nextId = (prefix: string): string => {
  sequence += 1;
  return `${prefix}-${Date.now().toString(36)}-${sequence}`;
};

function restore(): Message[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as { version?: number; messages?: Message[] };
    if (parsed.version !== 1 || !Array.isArray(parsed.messages)) return [];
    return parsed.messages
      .filter((item) => item && (item.role === "user" || item.role === "bot") && typeof item.text === "string" && item.text.trim().length > 0)
      .slice(-MAX_MESSAGES)
      .map((item) => ({
        id: item.id || nextId(item.role),
        role: item.role,
        text: item.text,
        sources: Array.isArray(item.sources) ? item.sources.filter((source) => source && typeof source.title === "string") : [],
        chips: Array.isArray(item.chips) ? item.chips.filter((chip) => typeof chip === "string") : [],
      }));
  } catch {
    return [];
  }
}

function Inline({ nodes, onNavigate }: { nodes: InlineNode[]; onNavigate: () => void }) {
  return (
    <>
      {nodes.map((node, index) => {
        if (node.type === "strong") {
          return (
            <strong key={index} className="font-semibold text-[var(--ink)]">
              {node.value}
            </strong>
          );
        }
        if (node.type === "code") {
          return (
            <code key={index} className="border border-[var(--line)] px-1 font-mono text-[11px]">
              {node.value}
            </code>
          );
        }
        if (node.type === "link") {
          const external = /^https?:/i.test(node.href);
          return (
            <a
              key={index}
              href={node.href}
              onClick={() => {
                if (!external) onNavigate();
              }}
              target={external ? "_blank" : undefined}
              rel={external ? "noopener noreferrer" : undefined}
              className="text-[var(--accent)] underline decoration-[var(--line)] underline-offset-2 hover:decoration-[var(--accent)]"
            >
              {node.value}
            </a>
          );
        }
        return <span key={index}>{node.value}</span>;
      })}
    </>
  );
}

function Markdown({ text, onNavigate }: { text: string; onNavigate: () => void }) {
  const blocks = useMemo(() => parseMarkdown(text), [text]);
  return (
    <>
      {blocks.map((block, index) =>
        block.type === "list" ? (
          <ul key={index} className="my-1.5 list-disc space-y-1 pl-4">
            {block.items.map((item, itemIndex) => (
              <li key={itemIndex}>
                <Inline nodes={item} onNavigate={onNavigate} />
              </li>
            ))}
          </ul>
        ) : (
          <p key={index} className={index > 0 ? "mt-1.5" : undefined}>
            <Inline nodes={block.inline} onNavigate={onNavigate} />
          </p>
        ),
      )}
    </>
  );
}

/** AI-ассистент: локальный режим работает всегда, LLM через Worker — если задан VITE_CHAT_API_URL. */
export function Assistant() {
  const { lang, loaderDone } = useSite();
  const ui = assistantUi[lang];
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>(restore);
  const [value, setValue] = useState("");
  const [busy, setBusy] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const panelRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const kbRef = useRef<Promise<Kb | null> | null>(null);
  const busyRef = useRef(false);
  const runRef = useRef(0);
  const typingRef = useRef<(() => void) | null>(null);
  const copiedTimer = useRef<number | null>(null);
  const atBottomRef = useRef(true);

  useScrollLock(open);
  useFocusTrap(panelRef, open);

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
    if (typeof window === "undefined") return;
    try {
      const settled = messages
        .filter((message) => message.text.trim().length > 0)
        .map((message) => ({ id: message.id, role: message.role, text: message.text, sources: message.sources, chips: message.chips }));
      window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ version: 1, messages: settled.slice(-MAX_MESSAGES) }));
    } catch {
      /* storage can be blocked or full */
    }
  }, [messages]);

  useEffect(
    () => () => {
      typingRef.current?.();
      if (copiedTimer.current) window.clearTimeout(copiedTimer.current);
    },
    [],
  );

  // autoscroll only when the reader is already at the bottom
  useEffect(() => {
    const list = listRef.current;
    if (!list || !atBottomRef.current) return;
    list.scrollTop = list.scrollHeight;
  }, [messages]);

  useEffect(() => {
    if (!open) return;
    atBottomRef.current = true;
    const list = listRef.current;
    if (list) list.scrollTop = list.scrollHeight;
  }, [open]);

  const onScroll = () => {
    const list = listRef.current;
    if (!list) return;
    atBottomRef.current = list.scrollHeight - list.scrollTop - list.clientHeight < 40;
  };

  const loadKb = useCallback((): Promise<Kb | null> => {
    if (kbRef.current) return kbRef.current;
    const pending = (async (): Promise<Kb> => {
      const [{ default: MiniSearch }, response] = await Promise.all([
        import("minisearch"),
        fetch(`${import.meta.env.BASE_URL}kb-index.json`, { cache: "force-cache" }),
      ]);
      if (!response.ok) throw new Error(`kb ${response.status}`);
      const payload = (await response.json()) as { index: unknown; docs?: Chunk[] };
      const mini = MiniSearch.loadJSON(JSON.stringify(payload.index), {
        fields: ["title", "text"],
        storeFields: ["title", "text", "source", "lang", "href"],
      });
      return { search: makeSearcher(mini as unknown as MiniSearchLike), docs: payload.docs ?? [] };
    })().catch(() => {
      kbRef.current = null;
      return null;
    });
    kbRef.current = pending;
    return pending;
  }, []);

  const patch = useCallback((id: string, changes: Partial<Message>) => {
    setMessages((prev) => prev.map((message) => (message.id === id ? { ...message, ...changes } : message)));
  }, []);

  const stopTyping = useCallback(() => {
    typingRef.current?.();
    typingRef.current = null;
  }, []);

  const typeOut = useCallback(
    (id: string, text: string) =>
      new Promise<void>((resolve) => {
        stopTyping();
        const parts = text.split(/(\s+)/);
        let index = 0;
        const timer = window.setInterval(() => {
          index = Math.min(parts.length, index + 6);
          patch(id, { text: parts.slice(0, index).join("") });
          if (index >= parts.length) {
            window.clearInterval(timer);
            typingRef.current = null;
            resolve();
          }
        }, 24);
        typingRef.current = () => {
          window.clearInterval(timer);
          resolve();
        };
      }),
    [patch, stopTyping],
  );

  /** Возвращает текст ответа Worker или null, если нужно молча откатиться в локальный режим. */
  const streamRemote = async (payload: {
    question: string;
    lang: string;
    history: HistoryTurn[];
    chunks: Chunk[];
    botId: string;
    run: number;
  }): Promise<string | null> => {
    if (!API_URL) return null;
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT);
    let answer = "";
    let frame = 0;

    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: { "content-type": "application/json" },
        // Контекст собирает Worker из kb-index.json; клиентские чанки он игнорирует.
        body: JSON.stringify({
          question: payload.question,
          lang: payload.lang,
          history: payload.history,
        }),
        signal: controller.signal,
      });
      if (!response.ok || !response.body) return null;

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      const parser = createSseParser();
      const draw = (): void => {
        frame = 0;
        if (runRef.current === payload.run) patch(payload.botId, { text: answer });
      };

      for (;;) {
        const { value: chunk, done } = await reader.read();
        if (done) break;
        for (const data of parser.push(decoder.decode(chunk, { stream: true }))) {
          const delta = parseDelta(data);
          if (!delta) continue;
          answer += delta;
          if (!frame) frame = window.requestAnimationFrame(draw);
        }
      }
      for (const data of parser.flush()) {
        const delta = parseDelta(data);
        if (delta) answer += delta;
      }
      if (frame) {
        window.cancelAnimationFrame(frame);
        frame = 0;
      }
      if (runRef.current !== payload.run) return null;
      patch(payload.botId, { text: answer });
      return answer.trim().length > 0 ? answer : null;
    } catch {
      return null;
    } finally {
      window.clearTimeout(timeout);
      controller.abort();
    }
  };

  const ask = async (question: string) => {
    const text = question.trim();
    if (!text || busyRef.current) return;

    busyRef.current = true;
    setBusy(true);
    setValue("");
    atBottomRef.current = true;

    const run = runRef.current + 1;
    runRef.current = run;
    const botId = nextId("bot");
    const asked = [...messages.filter((message) => message.role === "user").map((message) => message.text), text];
    const history: HistoryTurn[] = messages
      .filter((message) => message.text.trim().length > 0)
      .slice(-6)
      .map((message) => ({ role: message.role === "user" ? "user" : "assistant", content: message.text }));

    setMessages((prev) => [
      ...prev,
      { id: nextId("user"), role: "user", text, sources: [], chips: [] },
      { id: botId, role: "bot", text: "", sources: [], chips: [], streaming: true },
    ]);

    const kb = await loadKb();
    if (runRef.current !== run) return;

    const local: Answer = answerLocal(text, { search: kb?.search });

    const finish = (finalText: string, sourceList: Source[]) => {
      patch(botId, {
        text: finalText,
        sources: sourceList,
        chips: followUpChips(local, asked, 3),
        streaming: false,
      });
      busyRef.current = false;
      setBusy(false);
    };

    if (API_URL && kb) {
      const chunks = workerChunks(text, local.lang, kb.docs, kb.search);
      const remote = await streamRemote({ question: text, lang: local.lang, history, chunks, botId, run });
      if (runRef.current !== run) return;
      if (remote) {
        finish(remote, chunks.slice(0, 4).map((chunk) => ({ title: chunk.title, href: chunk.href })));
        return;
      }
      // fall back into local mode inside the SAME message: no duplicate bubbles
      patch(botId, { text: "", sources: [], streaming: true });
    }

    await typeOut(botId, local.text);
    if (runRef.current !== run) return;
    finish(
      local.text,
      local.sources.map((title, index) => ({ title, href: local.hrefs[index] })),
    );
  };

  const stop = () => {
    runRef.current += 1;
    stopTyping();
    busyRef.current = false;
    setBusy(false);
  };

  const clear = () => {
    stop();
    setMessages([]);
    setCopiedId(null);
    if (typeof window !== "undefined") {
      try {
        window.sessionStorage.removeItem(STORAGE_KEY);
      } catch {
        /* ignore */
      }
    }
    inputRef.current?.focus();
  };

  const copy = (message: Message) => {
    const write = navigator.clipboard?.writeText(message.text);
    if (!write) return;
    void write
      .then(() => {
        setCopiedId(message.id);
        if (copiedTimer.current) window.clearTimeout(copiedTimer.current);
        copiedTimer.current = window.setTimeout(() => setCopiedId(null), 1600);
      })
      .catch(() => setCopiedId(null));
  };

  const last = messages[messages.length - 1];
  const thinking = busy && !!last && last.role === "bot" && !last.text;

  return (
    <>
      {loaderDone && (
      <button
        type="button"
        onClick={() => setOpen((state) => !state)}
        aria-label={open ? ui.close : ui.open}
        aria-expanded={open}
        aria-controls="ai-assistant-panel"
        className="assistant-fab fixed bottom-5 right-5 z-[80] grid h-14 w-14 place-items-center rounded-full border border-[var(--line)] bg-[var(--bg-2)] shadow-lg transition-transform hover:scale-105"
      >
        <svg viewBox="0 0 32 32" className="h-7 w-7" aria-hidden>
          <rect x={7} y={10} width={14} height={13} rx={2} fill="none" stroke="var(--accent)" strokeWidth={1.5} />
          <path d="M21 13h3a3 3 0 0 1 0 6h-3" fill="none" stroke="var(--accent)" strokeWidth={1.5} />
          <path d="M11 22v3M16 22v3" stroke="var(--accent-2)" strokeWidth={1.5} />
          <path d="M12 5c0 2-2 2-2 4M17 4c0 2-2 2-2 4" stroke="var(--accent-2)" strokeWidth={1.2} opacity={0.7} />
        </svg>
      </button>
      )}

      <AnimatePresence>
        {open && (
          <motion.div
            id="ai-assistant-panel"
            ref={panelRef}
            initial={{ opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.98 }}
            transition={{ duration: 0.22, ease: [0.2, 0.8, 0.2, 1] }}
            role="dialog"
            aria-modal="true"
            aria-label={ui.dialogLabel}
            className="fixed bottom-24 right-4 z-[80] flex h-[min(78vh,600px)] max-h-[calc(100vh-7rem)] w-[min(440px,calc(100vw-2rem))] flex-col border border-[var(--line)] bg-[var(--bg-2)] shadow-2xl"
          >
            <div className="flex items-start gap-2 border-b border-[var(--line)] px-4 py-3">
              <div className="min-w-0">
                <p className="font-mono text-[11px] uppercase tracking-[0.12em]">{ui.title}</p>
                <p className="mt-0.5 flex items-center gap-1.5 font-mono text-[9px] text-[var(--ink-faint)]">
                  <span className="h-1.5 w-1.5 rounded-full bg-[var(--ok)]" aria-hidden />
                  {ui.online} · {ui.note}
                </p>
              </div>
              <div className="ml-auto flex items-center gap-3 pt-0.5">
                {messages.length > 0 && (
                  <button
                    type="button"
                    onClick={clear}
                    className="font-mono text-[9px] uppercase tracking-[0.1em] text-[var(--ink-faint)] transition-colors hover:text-[var(--accent)]"
                  >
                    {ui.clear}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  aria-label={ui.close}
                  className="font-mono text-xs text-[var(--ink-faint)] transition-colors hover:text-[var(--ink)]"
                >
                  ✕
                </button>
              </div>
            </div>

            <div
              ref={listRef}
              onScroll={onScroll}
              data-lenis-prevent
              role="log"
              aria-live="polite"
              aria-label={ui.feedLabel}
              className="flex-1 space-y-3 overflow-y-auto overscroll-contain p-4"
            >
              {messages.length === 0 && (
                <div>
                  <p className="font-mono text-[9px] uppercase tracking-[0.1em] text-[var(--ink-faint)]">{ui.tryAsking}</p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {ui.chips.map((chip) => (
                      <button
                        key={chip}
                        type="button"
                        onClick={() => void ask(chip)}
                        className="border border-[var(--line)] px-2.5 py-1 text-left font-mono text-[11px] text-[var(--ink-dim)] transition-colors hover:border-[var(--accent)] hover:text-[var(--ink)]"
                      >
                        {chip}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {messages.map((message, index) => {
                const isLast = index === messages.length - 1;
                if (message.role === "user") {
                  return (
                    <div key={message.id} className="text-right">
                      <div className="inline-block max-w-[92%] bg-[var(--accent)] px-3 py-2 text-left text-sm leading-relaxed text-[var(--bg)]">
                        <span className="sr-only">{ui.you}: </span>
                        {message.text}
                      </div>
                    </div>
                  );
                }

                return (
                  <div key={message.id}>
                    <div className="max-w-[95%] border border-[var(--line)] bg-[var(--bg)] px-3 py-2 text-sm leading-relaxed text-[var(--ink-dim)]">
                      <span className="sr-only">{ui.assistant}: </span>
                      {message.text ? (
                        <Markdown text={message.text} onNavigate={() => setOpen(false)} />
                      ) : (
                        <span className="inline-block h-3 w-1 animate-pulse bg-[var(--accent)]" aria-hidden />
                      )}
                      {message.streaming && message.text && (
                        <span className="ml-0.5 inline-block h-3 w-1 animate-pulse bg-[var(--accent)] align-middle" aria-hidden />
                      )}
                    </div>

                    <div className="mt-1.5 flex flex-wrap items-center gap-2">
                      {!message.streaming && message.text && (
                        <button
                          type="button"
                          onClick={() => copy(message)}
                          className="font-mono text-[9px] uppercase tracking-[0.1em] text-[var(--ink-faint)] transition-colors hover:text-[var(--accent)]"
                        >
                          {copiedId === message.id ? ui.copied : ui.copy}
                        </button>
                      )}
                      {message.sources.length > 0 && (
                        <span className="font-mono text-[9px] uppercase tracking-[0.1em] text-[var(--ink-faint)]">{ui.sources}:</span>
                      )}
                      {message.sources.map((source, sourceIndex) =>
                        source.href ? (
                          <a
                            key={`${message.id}-${sourceIndex}-${source.title}`}
                            href={source.href}
                            onClick={() => setOpen(false)}
                            className="border border-[var(--line)] px-2 py-0.5 font-mono text-[9px] text-[var(--ink-faint)] transition-colors hover:border-[var(--accent)] hover:text-[var(--ink)]"
                          >
                            {source.title}
                          </a>
                        ) : (
                          <span
                            key={`${message.id}-${sourceIndex}-${source.title}`}
                            className="border border-[var(--line)] px-2 py-0.5 font-mono text-[9px] text-[var(--ink-faint)]"
                          >
                            {source.title}
                          </span>
                        ),
                      )}
                    </div>

                    {isLast && !message.streaming && message.chips.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {message.chips.map((chip) => (
                          <button
                            key={`${message.id}-${chip}`}
                            type="button"
                            onClick={() => void ask(chip)}
                            className="border border-[var(--line)] px-2.5 py-1 text-left font-mono text-[11px] text-[var(--ink-dim)] transition-colors hover:border-[var(--accent)] hover:text-[var(--ink)]"
                          >
                            {chip}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}

              {thinking && (
                <p className="font-mono text-[10px] uppercase tracking-[0.1em] text-[var(--ink-faint)]">
                  {ui.thinking}
                  <span className="animate-pulse">…</span>
                </p>
              )}
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
                placeholder={ui.placeholder}
                aria-label={ui.placeholder}
                autoComplete="off"
                className="w-full bg-transparent font-mono text-sm outline-none placeholder:text-[var(--ink-faint)]"
              />
              {busy ? (
                <button
                  type="button"
                  onClick={stop}
                  className="border border-[var(--line)] px-3 py-1 font-mono text-[10px] uppercase text-[var(--ink-dim)] transition-colors hover:border-[var(--accent)] hover:text-[var(--accent)]"
                >
                  {ui.stop}
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={value.trim().length === 0}
                  className="bg-[var(--accent)] px-3 py-1 font-mono text-[10px] uppercase text-[var(--bg)] transition-opacity disabled:opacity-40"
                >
                  {ui.send}
                </button>
              )}
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
