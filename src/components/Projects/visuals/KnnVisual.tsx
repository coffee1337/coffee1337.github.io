import { useSite } from "../../../context/site";
import { Label, VisualFrame } from "./kit";

type Pt = { x: number; y: number; k: 0 | 1 };

/** Points live in "data space"; the winner below is computed from them, not typed in. */
const CLASS_A: Pt[] = [
  { x: 90, y: 90, k: 0 },
  { x: 120, y: 70, k: 0 },
  { x: 76, y: 130, k: 0 },
  { x: 140, y: 112, k: 0 },
  { x: 108, y: 150, k: 0 },
  { x: 62, y: 96, k: 0 },
];
const CLASS_B: Pt[] = [
  { x: 300, y: 120, k: 1 },
  { x: 330, y: 96, k: 1 },
  { x: 356, y: 140, k: 1 },
  { x: 286, y: 168, k: 1 },
  { x: 342, y: 188, k: 1 },
  { x: 372, y: 108, k: 1 },
];
const QUERY = { x: 246, y: 132 };
const K = 5;

/** Data space -> plot space (same scale on both axes, distances stay comparable). */
const SCALE = 0.82;
const CX = 232;
const CY = 131;
const plot = (p: { x: number; y: number }): [number, number] => [
  CX + (p.x - QUERY.x) * SCALE,
  CY + (p.y - QUERY.y) * SCALE,
];

const RANKED = [...CLASS_A, ...CLASS_B]
  .map((p) => ({ p, d: Math.hypot(p.x - QUERY.x, p.y - QUERY.y) }))
  .sort((a, b) => a.d - b.d);
const NEIGHBORS = RANKED.slice(0, K);
const TALLY = [0, 1]
  .map((k) => ({ k, n: NEIGHBORS.filter((n) => n.p.k === k).length }))
  .sort((a, b) => b.n - a.n || a.k - b.k);
const WINNER = TALLY[0];
const REACH = NEIGHBORS[NEIGHBORS.length - 1].d * SCALE;

const color = (k: number) => (k === 0 ? "var(--accent)" : "var(--accent-2)");

/**
 * k-nearest-neighbors: the cycle is query -> expanding radius -> neighbours
 * light up one by one -> edges -> majority vote -> pause.
 */
export function KnnVisual() {
  const { dict } = useSite();
  const t = dict.visuals.knn;

  const winnerLabel = WINNER.k === 0 ? t.classA : t.classB;
  const winnerColor = color(WINNER.k);
  const chip = `${t.winner}: ${winnerLabel} · ${WINNER.n}/${K}`;

  return (
    <VisualFrame label={t.label}>
      {(flow) => (
        <>
          <Label x={16} y={24} text={t.eyebrow} tone="accent" />

          <rect x={16} y={36} width={448} height={190} fill="var(--bg-3)" opacity={0.45} />
          {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <line key={`v${i}`} x1={16 + i * 56} y1={36} x2={16 + i * 56} y2={226} className="sv-grid" />
          ))}
          {[0, 1, 2, 3, 4].map((i) => (
            <line key={`h${i}`} x1={16} y1={36 + i * 47.5} x2={464} y2={36 + i * 47.5} className="sv-grid" />
          ))}
          <rect x={16} y={36} width={448} height={190} fill="none" stroke="var(--line)" />

          {/* expanding radius */}
          <circle
            cx={CX}
            cy={CY}
            r={REACH}
            fill="none"
            stroke="var(--accent)"
            strokeWidth={1}
            strokeDasharray="2 4"
            opacity={0.5}
          >
            {flow ? (
              <>
                <animate attributeName="r" values={`6;${REACH.toFixed(2)};${REACH.toFixed(2)}`} keyTimes="0;0.42;1" dur="6s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="0;0.55;0.55;0" keyTimes="0;0.08;0.88;1" dur="6s" repeatCount="indefinite" />
              </>
            ) : null}
          </circle>

          {/* neighbour edges, drawn one after another */}
          {NEIGHBORS.map(({ p }, n) => {
            const [px, py] = plot(p);
            return (
              <line
                key={`e${n}`}
                x1={CX}
                y1={CY}
                x2={px}
                y2={py}
                pathLength={1}
                stroke={color(p.k)}
                strokeWidth={1.2}
                strokeDasharray={1}
                strokeDashoffset={0}
                opacity={0.85}
                className={flow ? "sv-edge" : undefined}
                style={flow ? { animationDelay: `${600 + n * 300}ms` } : undefined}
              />
            );
          })}

          {/* the cloud */}
          {[...CLASS_A, ...CLASS_B].map((p, i) => {
            const [px, py] = plot(p);
            return <circle key={i} cx={px} cy={py} r={3.4} fill={color(p.k)} opacity={0.85} />;
          })}

          {/* neighbours pulse in distance order */}
          {NEIGHBORS.map(({ p }, n) => {
            const [px, py] = plot(p);
            return (
              <circle
                key={`h${n}`}
                cx={px}
                cy={py}
                r={7.5}
                fill="none"
                stroke={color(p.k)}
                strokeWidth={1.2}
                opacity={0}
                className={flow ? "sv-halo" : undefined}
                style={flow ? { animationDelay: `${550 + n * 300}ms` } : undefined}
              />
            );
          })}

          <circle cx={CX} cy={CY} r={5.5} fill="none" stroke="var(--ink)" strokeWidth={1.2} />
          <circle cx={CX} cy={CY} r={2.2} fill="var(--ink)" />
          <Label x={CX - 11} y={CY + 14} text={t.query} tone="ink" anchor="end" />

          <circle cx={18} cy={244} r={3.2} fill="var(--accent)" />
          <Label x={29} y={247} text={t.classA} />
          <circle cx={96} cy={244} r={3.2} fill="var(--accent-2)" />
          <Label x={107} y={247} text={t.classB} />

          <g className={flow ? "sv-chip" : undefined} style={flow ? { animationDelay: "0ms" } : undefined}>
            <rect x={236} y={233} width={228} height={26} rx={2} fill="var(--bg-2)" stroke={winnerColor} strokeOpacity={0.7} />
            <text
              x={350}
              y={249}
              textAnchor="middle"
              className="sv-chip-text"
              fill={winnerColor}
            >
              {chip}
            </text>
          </g>

          <Label x={350} y={276} text={t.metric} anchor="middle" />
        </>
      )}
    </VisualFrame>
  );
}
