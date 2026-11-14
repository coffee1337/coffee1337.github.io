import { Label, VisualFrame } from "./kit";

type Pt = { x: number; y: number; k: 0 | 1 };

const CLASS_A: Pt[] = [
  { x: 90, y: 90, k: 0 }, { x: 120, y: 70, k: 0 }, { x: 76, y: 130, k: 0 },
  { x: 140, y: 112, k: 0 }, { x: 108, y: 150, k: 0 }, { x: 62, y: 96, k: 0 },
];
const CLASS_B: Pt[] = [
  { x: 300, y: 120, k: 1 }, { x: 330, y: 96, k: 1 }, { x: 356, y: 140, k: 1 },
  { x: 286, y: 168, k: 1 }, { x: 342, y: 188, k: 1 }, { x: 372, y: 108, k: 1 },
];
const QUERY: Pt = { x: 246, y: 132, k: 0 };
const ALL = [...CLASS_A, ...CLASS_B];

const nearest = [...ALL]
  .map((p, i) => ({ p, i, d: Math.hypot(p.x - QUERY.x, p.y - QUERY.y) }))
  .sort((a, b) => a.d - b.d)
  .slice(0, 5);

/** k-nearest-neighbors: 2D scatter, query-точка, k=5 соседей и класс-победитель. */
export function KnnVisual() {
  return (
    <VisualFrame label="k-nearest-neighbors: 2D class cloud, query point and five nearest neighbours">
      {(flow) => (
        <>
          <Label x={16} y={16} text="k = 5 · cosine / euclid" accent />

          <rect x={16} y={32} width={448} height={196} fill="var(--bg-3)" stroke="var(--line)" opacity={0.5} />
          {[0, 1, 2, 3, 4, 5, 6].map((i) => (
            <line key={`v${i}`} x1={16 + i * 74.6} y1={32} x2={16 + i * 74.6} y2={228} stroke="var(--line-2)" />
          ))}
          {[0, 1, 2].map((i) => (
            <line key={`h${i}`} x1={16} y1={32 + i * 65.3} x2={464} y2={32 + i * 65.3} stroke="var(--line-2)" />
          ))}

          {ALL.map((p, i) => (
            <circle
              key={i}
              cx={p.x}
              cy={p.y}
              r={3.2}
              fill={p.k === 0 ? "var(--accent)" : "var(--accent-2)"}
              opacity={0.85}
            />
          ))}

          {nearest.map(({ p, i }, n) => (
            <line
              key={`n${i}`}
              x1={QUERY.x}
              y1={QUERY.y}
              x2={p.x}
              y2={p.y}
              stroke="var(--ink-faint)"
              strokeWidth={0.8}
              strokeDasharray="2 3"
              opacity={flow ? 0.9 : 0.5}
            >
              {flow && (
                <animate attributeName="stroke-opacity" values="0.25;0.9;0.25" dur="2.4s" begin={`${n * 0.12}s`} repeatCount="indefinite" />
              )}
            </line>
          ))}

          <circle cx={QUERY.x} cy={QUERY.y} r={5.5} fill="none" stroke="var(--ink)" strokeWidth={1.2} />
          <circle cx={QUERY.x} cy={QUERY.y} r={2.2} fill="var(--ink)" />
          <text x={QUERY.x + 10} y={QUERY.y - 8} style={{ fontFamily: "var(--font-mono)", fontSize: 7.5, fill: "var(--ink-dim)" }}>
            query
          </text>

          <Label x={16} y={252} text="class a" />
          <circle cx={74} cy={248} r={3} fill="var(--accent)" />
          <Label x={96} y={252} text="class b" />
          <circle cx={154} cy={248} r={3} fill="var(--accent-2)" />
          <Label x={320} y={252} text="winner: class a (4/5)" accent />
        </>
      )}
    </VisualFrame>
  );
}
