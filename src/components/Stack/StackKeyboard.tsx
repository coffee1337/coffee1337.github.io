import { useEffect, useMemo, useRef, useState } from "react";
import { useSite } from "../../context/site";
import type { KeyboardHandle, KeyboardRow } from "../../three/keyboard";

const ROWS: { name: string; keys: string[] }[] = [
  { name: "Backend", keys: ["Python", "FastAPI", "PostgreSQL", "SQLAlchemy", "Alembic", "Redis", "Docker"] },
  { name: "AI / Data", keys: ["LLM API", "RAG", "pgvector", "PyTorch", "Pandas", "NumPy"] },
  { name: "Frontend / Mobile", keys: ["TypeScript", "React", "Next.js", "Flutter", "Dart"] },
  { name: "Systems / Tools", keys: ["C#", ".NET", "C++", "Git", "Linux"] },
];

const ACCENT = new Set(["FastAPI", "RAG", "PyTorch", "TypeScript", "C++", "PostgreSQL", "LLM API"]);

function supportsWebGL(): boolean {
  try {
    const canvas = document.createElement("canvas");
    return Boolean(window.WebGLRenderingContext && (canvas.getContext("webgl2") || canvas.getContext("webgl")));
  } catch {
    return false;
  }
}

export function StackKeyboard() {
  const { dict } = useSite();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const handleRef = useRef<KeyboardHandle | null>(null);
  const [webgl, setWebgl] = useState<boolean | null>(null);
  const [tooltip, setTooltip] = useState<{ label: string; usedIn: string[]; x: number; y: number } | null>(null);
  const [active, setActive] = useState<string | null>(null);

  const rows: KeyboardRow[] = useMemo(
    () =>
      ROWS.map((row) => ({
        name: row.name,
        keys: row.keys.map((label) => ({
          label,
          accent: ACCENT.has(label),
          usedIn: dict.projects.items.filter((project) => project.stack.includes(label)).map((project) => project.name),
        })),
      })),
    [dict],
  );

  const select = (label: string) => {
    setActive(label);
    window.dispatchEvent(new CustomEvent("stack-filter", { detail: label }));
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
          onHover: (key, x, y) => setTooltip(key ? { ...key, x, y } : null),
          onSelect: select,
        });
      });
    };

    observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) boot();
        handleRef.current?.setRunning(entry.isIntersecting);
      },
      { rootMargin: "400px" },
    );
    observer.observe(wrap);

    const onVisibility = () => handleRef.current?.setRunning(!document.hidden);
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      disposed = true;
      observer?.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      handleRef.current?.dispose();
      handleRef.current = null;
    };
    // rows меняются вместе с языком — пересоздавать сцену из-за этого не нужно
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [webgl]);

  return (
    <div ref={wrapRef} className="relative">
      {webgl ? (
        <div className="relative h-[320px] w-full overflow-hidden border border-[var(--line)] bg-[var(--bg-2)] md:h-[420px]">
          <canvas ref={canvasRef} className="h-full w-full" aria-label="3D keyboard of technologies" role="img" />
          {tooltip && (
            <div
              className="pointer-events-none absolute z-10 max-w-[260px] -translate-x-1/2 -translate-y-full border border-[var(--line)] bg-[var(--bg)] px-3 py-2 font-mono text-[10px] text-[var(--ink-dim)] shadow-lg"
              style={{ left: tooltip.x, top: tooltip.y - 12 }}
            >
              <p className="text-[var(--ink)]">{tooltip.label}</p>
              {tooltip.usedIn.length > 0 && <p className="mt-1">used in: {tooltip.usedIn.join(", ")}</p>}
            </div>
          )}
        </div>
      ) : (
        <div className="grid gap-3 border border-[var(--line)] bg-[var(--bg-2)] p-4 md:grid-cols-2" role="list">
          {rows.map((row) => (
            <div key={row.name} role="listitem">
              <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--ink-faint)]">{row.name}</p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {row.keys.map((key) => (
                  <button
                    key={key.label}
                    type="button"
                    onClick={() => select(key.label)}
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

      {active && (
        <p className="mt-2 font-mono text-[10px] text-[var(--ink-faint)]">
          filter: <span className="text-[var(--accent)]">{active}</span>
        </p>
      )}
    </div>
  );
}
