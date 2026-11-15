import { useSite } from "../../../context/site";
import { Label, VisualFrame } from "./kit";

const W = 24;
const COLS = 11;
const ROWS = 8;
const OX = 18;
const OY = 44;
const LX = OX + COLS * W + 16;

type Cell = readonly [number, number];

const WALLS = new Set([
  "3,0",
  "3,1",
  "3,2",
  "3,3",
  "7,2",
  "7,3",
  "7,4",
  "7,5",
  "5,6",
  "5,7",
  "9,5",
  "9,6",
]);

const START: Cell = [0, 4];
const GOAL: Cell = [10, 3];

const key = (c: number, r: number) => `${c},${r}`;

type Open = { c: number; r: number; g: number; f: number; seq: number };

/**
 * Real A* on the maze above: 4-connectivity, Manhattan heuristic,
 * deterministic tie-break so the expansion order never changes between renders.
 */
function solve(): { expanded: Cell[]; path: Cell[]; open: Cell[] } {
  const best = new Map<string, number>();
  const cameFrom = new Map<string, Cell>();
  const closed = new Set<string>();
  const queued = new Set<string>();
  const expanded: Cell[] = [];
  const queue: Open[] = [];
  let seq = 0;

  const h = (c: number, r: number) => Math.abs(c - GOAL[0]) + Math.abs(r - GOAL[1]);
  const push = (c: number, r: number, g: number) => {
    queue.push({ c, r, g, f: g + h(c, r), seq: seq + 1 });
    seq += 1;
  };

  best.set(key(START[0], START[1]), 0);
  queued.add(key(START[0], START[1]));
  push(START[0], START[1], 0);

  while (queue.length > 0) {
    queue.sort((a, b) => a.f - b.f || a.g - b.g || a.seq - b.seq);
    const cur = queue.shift();
    if (!cur) break;
    const id = key(cur.c, cur.r);
    if (closed.has(id)) continue;
    closed.add(id);
    expanded.push([cur.c, cur.r]);
    if (cur.c === GOAL[0] && cur.r === GOAL[1]) break;

    const steps: Cell[] = [
      [0, -1],
      [1, 0],
      [0, 1],
      [-1, 0],
    ];
    for (const [dc, dr] of steps) {
      const nc = cur.c + dc;
      const nr = cur.r + dr;
      if (nc < 0 || nc >= COLS || nr < 0 || nr >= ROWS) continue;
      if (WALLS.has(key(nc, nr))) continue;
      const nid = key(nc, nr);
      if (closed.has(nid)) continue;
      const g = cur.g + 1;
      if ((best.get(nid) ?? Number.POSITIVE_INFINITY) <= g) continue;
      best.set(nid, g);
      cameFrom.set(nid, [cur.c, cur.r]);
      queued.add(nid);
      push(nc, nr, g);
    }
  }

  const path: Cell[] = [];
  if (closed.has(key(GOAL[0], GOAL[1]))) {
    let cursor: Cell | undefined = GOAL;
    while (cursor) {
      path.push(cursor);
      cursor = cameFrom.get(key(cursor[0], cursor[1]));
    }
    path.reverse();
  }

  const open: Cell[] = [];
  for (const id of queued) {
    if (closed.has(id)) continue;
    const [c, r] = id.split(",").map(Number);
    open.push([c, r]);
  }

  return { expanded, path, open };
}

const RESULT = solve();

const CELL_MS = 38;
const PATH_MS = 58;
const PATH_START = RESULT.expanded.length * CELL_MS + 240;

const ORDER = new Map(RESULT.expanded.map((c, i) => [key(c[0], c[1]), i]));
const PATH_AT = new Map(RESULT.path.map((c, i) => [key(c[0], c[1]), i]));
const FRONTIER = new Set(RESULT.open.map((c) => key(c[0], c[1])));

const center = (c: number, r: number) => [OX + c * W + (W - 1) / 2, OY + r * W + (W - 1) / 2] as const;

/**
 * neural-astar-heuristic: the grid reveals cells in A* expansion order,
 * then the found path is drawn on top. Legend matches the fills exactly.
 */
export function AstarVisual() {
  const { dict } = useSite();
  const t = dict.visuals.astar;

  const [sx, sy] = center(START[0], START[1]);
  const [gx, gy] = center(GOAL[0], GOAL[1]);

  const legend = [
    { label: t.legendOpen, fill: "var(--bg-3)", opacity: 0.9, stroke: "var(--line)" },
    { label: t.legendExpanded, fill: "var(--accent-2)", opacity: 0.42, stroke: "" },
    { label: t.legendPath, fill: "var(--accent)", opacity: 0.95, stroke: "" },
    { label: t.legendWall, fill: "var(--ink-faint)", opacity: 0.5, stroke: "" },
  ];

  return (
    <VisualFrame label={t.label}>
      {(flow) => (
        <>
          <Label x={16} y={24} text={t.eyebrow} tone="accent" />
          <rect x={OX - 1.5} y={OY - 1.5} width={COLS * W + 3} height={ROWS * W + 3} fill="none" stroke="var(--line)" />

          {Array.from({ length: COLS * ROWS }, (_, i) => {
            const c = i % COLS;
            const r = Math.floor(i / COLS);
            const id = key(c, r);
            const wall = WALLS.has(id);
            const step = ORDER.get(id);
            const open = FRONTIER.has(id);
            const state = wall ? "wall" : step !== undefined ? "expanded" : open ? "open" : "idle";
            const opacity = state === "wall" ? 0.5 : state === "expanded" ? 0.42 : state === "open" ? 0.9 : 0.16;
            return (
              <rect
                key={id}
                x={OX + c * W}
                y={OY + r * W}
                width={W - 1}
                height={W - 1}
                fill={state === "wall" ? "var(--ink-faint)" : state === "expanded" ? "var(--accent-2)" : "var(--bg-3)"}
                stroke={state === "open" ? "var(--line)" : undefined}
                strokeWidth={state === "open" ? 0.8 : undefined}
                opacity={opacity}
                className={flow && step !== undefined ? "sv-exp" : undefined}
                style={flow && step !== undefined ? { animationDelay: `${step * CELL_MS}ms` } : undefined}
              />
            );
          })}

          {RESULT.path.map(([c, r], i) => (
            <rect
              key={`p${i}`}
              x={OX + c * W}
              y={OY + r * W}
              width={W - 1}
              height={W - 1}
              fill="var(--accent)"
              opacity={0.95}
              className={flow ? "sv-pathc" : undefined}
              style={flow ? { animationDelay: `${PATH_START + (PATH_AT.get(key(c, r)) ?? 0) * PATH_MS}ms` } : undefined}
            />
          ))}

          <circle cx={sx} cy={sy} r={3} fill="var(--bg)" opacity={0.85} />
          <circle cx={gx} cy={gy} r={5.5} fill="none" stroke="var(--bg)" strokeWidth={1.3} opacity={0.9} />

          <Label x={sx} y={254} text={t.start} anchor="middle" />
          <Label x={gx} y={254} text={t.goal} anchor="middle" />

          {legend.map((item, i) => (
            <g key={item.label}>
              <rect
                x={LX}
                y={64 + i * 36 - 9}
                width={12}
                height={12}
                fill={item.fill}
                opacity={item.opacity}
                stroke={item.stroke || undefined}
                strokeWidth={item.stroke ? 0.8 : undefined}
              />
              <Label x={LX + 21} y={64 + i * 36} text={item.label} />
            </g>
          ))}

          <Label x={LX} y={212} text={t.caption} tone="accent" />
        </>
      )}
    </VisualFrame>
  );
}
