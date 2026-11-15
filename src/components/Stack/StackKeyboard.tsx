import { useEffect, useMemo, useRef, useState } from "react";
import { useSite } from "../../context/site";
import { canon, projectsWithTech } from "../../lib/tech";
import type { KeyboardHandle, KeyboardRow } from "../../three/keyboard";

/** Акцентные колпачки: технологии, на которых держатся проекты. */
const ACCENT = new Set([
  "python",
  "fastapi",
  "postgresql",
  "rag",
  "pytorch",
  "typescript",
  "c++",
  "llm api",
  "llm apis",
  "flutter",
]);

function supportsWebGL(): boolean {
  try {
    const canvas = document.createElement("canvas");
    return Boolean(window.WebGLRenderingContext && (canvas.getContext("webgl2") || canvas.getContext("webgl")));
  } catch {
    return false;
  }
}

export function StackKeyboard() {
  const { dict, reduced, pathBase } = useSite();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const handleRef = useRef<KeyboardHandle | null>(null);
  const [webgl, setWebgl] = useState<boolean | null>(null);
  const [tooltip, setTooltip] = useState<{ label: string; x: number; y: number } | null>(null);
  const [active, setActive] = useState<string | null>(null);
  const [narrow, setNarrow] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const sync = () => setNarrow(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  const projects = dict.projects.items;

  /** На узких экранах ряды делятся пополам: клавиши крупнее, подписи читаются. */
  const rows: KeyboardRow[] = useMemo(() => {
    const chunk = (name: string, items: string[]): KeyboardRow[] => {
      if (!narrow || items.length <= 4) {
        return [{ name, keys: items.map((label) => ({ label, accent: ACCENT.has(canon(label)) })) }];
      }
      const parts: string[][] = [];
      const size = Math.ceil(items.length / 2);
      for (let i = 0; i < items.length; i += size) parts.push(items.slice(i, i + size));
      return parts.map((part, index) => ({
        name: `${name} ${index + 1}`,
        keys: part.map((label) => ({ label, accent: ACCENT.has(canon(label)) })),
      }));
    };
    return dict.stack.groups.flatMap((group) => chunk(group.name, group.items));
  }, [dict, narrow]);

  const usedProjects = useMemo(
    () => (active ? projectsWithTech(projects, active) : []),
    [active, projects],
  );

  /** Клик/выбор клавиши: только выделение и панель, без скролла страницы. */
  const select = (label: string) => {
    setActive(label);
    handleRef.current?.setSelected(label);
  };

  const showInProjects = () => {
    if (!active) return;
    window.dispatchEvent(new CustomEvent("stack-filter", { detail: active }));
    document.getElementById("projects")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  useEffect(() => {
    setWebgl(supportsWebGL());
  }, []);

  useEffect(() => {
    if (!webgl) return;
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;

    let disposed = false;
    let observer: IntersectionObserver | null = null;

    const boot = () => {
      if (disposed || handleRef.current) return;
      void import("../../three/keyboard").then(({ createKeyboardScene }) => {
        if (disposed || !canvasRef.current) return;
        handleRef.current = createKeyboardScene(canvasRef.current, rows, {
          reduced,
          onHover: (key, x, y) => setTooltip(key ? { label: key.label, x, y } : null),
          onSelect: select,
        });
      });
    };

    observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) boot();
        handleRef.current?.setRunning(entry.isIntersecting);
      },
      { rootMargin: "300px" },
    );
    observer.observe(wrap);

    const onVisibility = () => handleRef.current?.setRunning(!document.hidden);
    const onTheme = () => handleRef.current?.refreshTheme();
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("themechange", onTheme);

    return () => {
      disposed = true;
      observer?.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("themechange", onTheme);
      handleRef.current?.dispose();
      handleRef.current = null;
    };
    // rows приходят из dict и меняются при смене языка — сцена пересоздаётся вместе со страницей
  }, [webgl, rows, reduced, narrow]);

  return (
    <div ref={wrapRef} className="relative">
      <p className="mb-3 hidden font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--ink-faint)] md:block">
        {dict.stack.hint}
      </p>
      <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--ink-faint)] md:hidden">
        {dict.stack.hintTouch}
      </p>

      <div className={`grid gap-4 ${active ? "lg:grid-cols-[minmax(0,1fr)_300px]" : ""}`}>
        <div>
          {webgl ? (
            <div className="relative h-[360px] w-full border border-[var(--line)] bg-[var(--bg-2)] md:h-[440px]">
              <canvas
                ref={canvasRef}
                className="h-full w-full touch-pan-y"
                aria-hidden
              />
              {tooltip && !reduced && (
                <div
                  className="pointer-events-none absolute z-10 max-w-[220px] -translate-x-1/2 -translate-y-full border border-[var(--line)] bg-[var(--bg)] px-3 py-1.5 font-mono text-[10px] text-[var(--ink)] shadow-lg"
                  style={{ left: tooltip.x, top: tooltip.y - 10 }}
                >
                  {tooltip.label}
                </div>
              )}
            </div>
          ) : (
            <div
              className="grid gap-3 border border-[var(--line)] bg-[var(--bg-2)] p-4 md:grid-cols-2"
              role="list"
              aria-label={dict.stack.keysLabel}
            >
              {rows.map((row) => (
                <div key={row.name} role="listitem">
                  <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--ink-faint)]">{row.name}</p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {row.keys.map((key) => (
                      <button
                        key={key.label}
                        type="button"
                        onClick={() => select(key.label)}
                        aria-pressed={active === key.label}
                        className={`rounded-sm border px-2.5 py-1.5 font-mono text-[11px] transition-transform active:translate-y-0.5 ${
                          key.accent
                            ? "border-[var(--accent)] bg-[color-mix(in_srgb,var(--accent)_16%,var(--bg-2))] text-[var(--ink)]"
                            : "border-[var(--line)] text-[var(--ink-dim)]"
                        }`}
                      >
                        {key.label}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* "Where it's used" panel: desktop — right of the board, mobile — below it */}
        <aside
          aria-live="polite"
          aria-label={dict.stack.panelLabel}
          className={`border border-[var(--line)] bg-[var(--bg)] p-4 ${active ? "block" : "hidden"}`}
        >
          {active && (
            <>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--accent)]">
                    {dict.stack.usedIn}
                  </p>
                  <p className="mt-1 font-display text-lg leading-tight text-[var(--ink)]">{active}</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setActive(null);
                    handleRef.current?.setSelected(null);
                  }}
                  aria-label={dict.a11y.close}
                  className="font-mono text-xs text-[var(--ink-faint)] hover:text-[var(--ink)]"
                >
                  ✕
                </button>
              </div>

              {usedProjects.length > 0 ? (
                <ul className="mt-3 space-y-1">
                  {usedProjects.map((project) => (
                    <li key={project.id}>
                      <a
                        href={`${pathBase}/projects/${project.id}/`}
                        className="flex items-baseline justify-between gap-2 border-t border-[var(--line-2)] py-1.5 text-sm text-[var(--ink-dim)] transition-colors hover:text-[var(--accent)]"
                      >
                        <span>{project.name}</span>
                        <span aria-hidden className="font-mono text-[10px]">→</span>
                      </a>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-3 text-sm leading-relaxed text-[var(--ink-dim)]">{dict.stack.noProject}</p>
              )}

              {usedProjects.length > 0 && (
                <button
                  type="button"
                  onClick={showInProjects}
                  className="mt-4 w-full rounded-full border border-[var(--accent)] px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.1em] text-[var(--accent)] transition-colors hover:bg-[var(--accent)] hover:text-[var(--bg)]"
                >
                  {dict.stack.showInProjects}
                </button>
              )}
            </>
          )}
        </aside>
      </div>

      {/* Accessible list: the same keys for keyboard and screen readers */}
      <ul className="sr-only" aria-label={dict.stack.keysLabel}>
        {rows.flatMap((row) =>
          row.keys.map((key) => (
            <li key={`${row.name}-${key.label}`}>
              <button
                type="button"
                onClick={() => select(key.label)}
                aria-pressed={active === key.label}
                aria-describedby="stack-hint"
              >
                {key.label} — {row.name}
              </button>
            </li>
          )),
        )}
      </ul>
      <p id="stack-hint" className="sr-only">
        {dict.stack.hint}
      </p>
    </div>
  );
}
