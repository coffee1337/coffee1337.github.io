import { Label, VisualFrame } from "./kit";

const W = 24;
const COLS = 11;
const ROWS = 8;
const OX = 18;
const OY = 46;

const WALLS = new Set([
  "3,0", "3,1", "3,2", "3,3", "7,2", "7,3", "7,4", "7,5", "5,6", "5,7", "9,5", "9,6",
]);

const PATH: Array<[number, number]> = [
  [0, 4], [1, 4], [2, 4], [2, 3], [2, 2], [2, 1], [3, 1], [4, 1], [4, 2], [4, 3],
  [4, 4], [5, 4], [6, 4], [6, 5], [7, 5], [8, 5], [8, 4], [8, 3], [9, 3], [10, 3],
];

const key = (c: number, r: number) => `${c},${r}`;
const pathSet = new Set(PATH.map(([c, r]) => key(c, r)));

export function AstarVisual() {
  return (
    <VisualFrame label="neural-astar-heuristic: maze grid, A* cell expansion, neural heuristic and the found path">
      {(flow) => (
        <>
          <Label x={16} y={16} text="a* search + neural heuristic" accent />
          <rect x={OX - 2} y={OY - 2} width={COLS * W + 4} height={ROWS * W + 4} fill="none" stroke="var(--line)" />

          {Array.from({ length: COLS * ROWS }).map((_, i) => {
            const c = i % COLS;
            const r = Math.floor(i / COLS);
            const wall = WALLS.has(key(c, r));
            const onPath = pathSet.has(key(c, r));
            const heat = !wall && !onPath ? ((c * 7 + r * 13) % 9) / 9 : 0;
            const delay = (c + r) * 60;
            return (
              <rect
                key={i}
                x={OX + c * W}
                y={OY + r * W}
                width={W - 1}
                height={W - 1}
                fill={wall ? "var(--ink-faint)" : onPath ? "var(--accent)" : "var(--bg-3)"}
                opacity={wall ? 0.35 : onPath ? (flow ? 0 : 0.65) : 0.35 + heat * 0.45}
                className={onPath && flow ? "sv-cell" : undefined}
                style={onPath && flow ? { animationDelay: `${delay}ms` } : undefined}
              />
            );
          })}

          <text x={OX + W / 2} y={OY + 4 * W + 4} style={{ fontFamily: "var(--font-mono)", fontSize: 7, fill: "var(--accent-2)" }}>S</text>
          <text x={OX + 10 * W + 6} y={OY + 3 * W + 16} style={{ fontFamily: "var(--font-mono)", fontSize: 7, fill: "var(--accent-2)" }}>G</text>

          <Label x={OX + COLS * W + 16} y={70} text="open set" />
          <rect x={OX + COLS * W + 16} y={78} width={10} height={10} fill="var(--bg-3)" stroke="var(--line)" />
          <Label x={OX + COLS * W + 16} y={110} text="expanded" />
          <rect x={OX + COLS * W + 16} y={118} width={10} height={10} fill="var(--accent-2)" opacity={0.6} />
          <Label x={OX + COLS * W + 16} y={150} text="path" />
          <rect x={OX + COLS * W + 16} y={158} width={10} height={10} fill="var(--accent)" />
          <Label x={OX + COLS * W + 16} y={190} text="wall" />
          <rect x={OX + COLS * W + 16} y={198} width={10} height={10} fill="var(--ink-faint)" opacity={0.35} />
        </>
      )}
    </VisualFrame>
  );
}
