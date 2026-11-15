const GLYPHS = ["0", "1", "·", "+", "*", "▪", ":"];
const TOKENS = ["fastapi", "rag", "attention", "vector", "torch", "sql"];

function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type Node = { x: number; y: number; glyph: string; opacity: number; token: boolean };

/** Детерминированное облако: одинаково на сервере и в браузере. */
const NODES: Node[] = (() => {
  const rng = mulberry32(1337);
  const centers = [
    [520, 330],
    [380, 240],
    [250, 340],
    [360, 470],
    [520, 470],
    [300, 200],
  ];
  const list: Node[] = [];
  for (let i = 0; i < 96; i++) {
    const c = centers[i % centers.length];
    const token = rng() < 0.09;
    list.push({
      x: c[0] + (rng() + rng() + rng() - 1.5) * 110,
      y: c[1] + (rng() + rng() + rng() - 1.5) * 110,
      glyph: token ? TOKENS[Math.floor(rng() * TOKENS.length)] : GLYPHS[Math.floor(rng() * GLYPHS.length)],
      opacity: 0.18 + rng() * 0.5,
      token,
    });
  }
  return list;
})();

/**
 * Заглушка «облака» для пререндера и до загрузки WebGL: те же кластеры глифов,
 * карамельные токены и терракотовый запрос со связями. Цвета — из токенов темы.
 */
export function EmbeddingFallback({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 800 800"
      preserveAspectRatio="xMidYMid slice"
      className={`h-full w-full ${className}`}
      aria-hidden
    >
      <g fill="currentColor" style={{ fontFamily: "var(--font-mono)" }}>
        {NODES.map((node, i) => (
          <text
            key={i}
            x={node.x}
            y={node.y}
            opacity={node.opacity}
            fill={node.token ? "var(--accent-2)" : "currentColor"}
            fontSize={node.token ? 10 : 11}
          >
            {node.glyph}
          </text>
        ))}
      </g>
      <g stroke="var(--accent)" strokeOpacity="0.35" fill="none" strokeWidth="1">
        <path d="M400 250 Q 460 300 500 352" />
        <path d="M400 250 Q 360 280 320 318" />
        <path d="M400 250 Q 415 240 440 232" />
      </g>
      <circle cx="400" cy="250" r="3.5" fill="var(--accent)" />
      <text x="412" y="238" fill="var(--accent)" fontSize="10" style={{ fontFamily: "var(--font-mono)" }}>
        query
      </text>
    </svg>
  );
}
