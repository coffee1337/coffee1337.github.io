import { useEffect, useRef, useState, type ReactNode } from "react";

/** Общая рамка схемы: одинаковый viewBox, доступность, запуск анимации в зоне видимости. */
export function VisualFrame({
  label,
  children,
  className = "",
}: {
  label: string;
  children: (started: boolean) => ReactNode;
  className?: string;
}) {
  const ref = useRef<SVGSVGElement>(null);
  const [started, setStarted] = useState(false);
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    setReduced(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
    const node = ref.current;
    if (!node) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        setStarted(true);
        io.disconnect();
      },
      { threshold: 0.25 },
    );
    io.observe(node);
    return () => io.disconnect();
  }, []);

  return (
    <svg
      ref={ref}
      viewBox="0 0 480 300"
      preserveAspectRatio="xMidYMid meet"
      role="img"
      aria-label={label}
      className={`w-full ${className}`}
      data-flow={started && !reduced}
    >
      {children(started && !reduced)}
    </svg>
  );
}

type NodeProps = {
  x: number;
  y: number;
  w?: number;
  h?: number;
  title: string;
  sub?: string;
  accent?: boolean;
  strong?: boolean;
};

/** Острый прямоугольник-узел с моно-подписью. */
export function Node({ x, y, w = 84, h = 34, title, sub, accent = false, strong = false }: NodeProps) {
  return (
    <g className="sv-node" tabIndex={-1}>
      <rect
        x={x}
        y={y}
        width={w}
        height={h}
        rx={2}
        fill={accent ? "color-mix(in srgb, var(--accent) 14%, var(--bg-2))" : "var(--bg-2)"}
        stroke={accent || strong ? "var(--accent)" : "var(--line)"}
        strokeWidth={1}
      />
      <text
        x={x + w / 2}
        y={sub ? y + h / 2 - 2 : y + h / 2 + 4}
        textAnchor="middle"
        style={{ fontFamily: "var(--font-mono)", fontSize: 10, fill: "var(--ink)", letterSpacing: "0.04em" }}
      >
        {title}
      </text>
      {sub && (
        <text
          x={x + w / 2}
          y={y + h / 2 + 11}
          textAnchor="middle"
          style={{ fontFamily: "var(--font-mono)", fontSize: 7.5, fill: "var(--ink-faint)" }}
        >
          {sub}
        </text>
      )}
    </g>
  );
}

/** Пунктирная связь; при data-flow=true по ней бегут штрихи. */
export function Link({
  d,
  accent = false,
  animate = true,
  delay = 0,
}: {
  d: string;
  accent?: boolean;
  animate?: boolean;
  delay?: number;
}) {
  return (
    <path
      d={d}
      fill="none"
      stroke={accent ? "var(--accent-2)" : "var(--line)"}
      strokeWidth={1.2}
      strokeDasharray="3 5"
      className={animate ? "sv-flow" : undefined}
      style={animate ? { animationDelay: `${delay}ms` } : undefined}
    />
  );
}

export function Label({ x, y, text, accent = false }: { x: number; y: number; text: string; accent?: boolean }) {
  return (
    <text
      x={x}
      y={y}
      style={{
        fontFamily: "var(--font-mono)",
        fontSize: 7.5,
        fill: accent ? "var(--accent)" : "var(--ink-faint)",
        letterSpacing: "0.08em",
        textTransform: "uppercase",
      }}
    >
      {text}
    </text>
  );
}

export function ArrowheadDefs() {
  return (
    <defs>
      <marker id="sv-arrow" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="6" markerHeight="6" orient="auto">
        <path d="M0,0 L8,4 L0,8 z" fill="var(--ink-faint)" />
      </marker>
    </defs>
  );
}
