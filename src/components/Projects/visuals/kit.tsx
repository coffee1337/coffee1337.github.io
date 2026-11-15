import { useEffect, useId, useMemo, useRef, useState, type ReactNode } from "react";
import { useSite } from "../../../context/site";

/** Stable, document-unique id prefix for markers and motion paths. */
export function useSvgId(): string {
  const raw = useId();
  return useMemo(() => `sv${raw.replace(/[^a-zA-Z0-9_-]/g, "")}`, [raw]);
}

/**
 * Shared frame for every case diagram: one viewBox, a11y label,
 * and a flow flag that pauses everything while the diagram is off screen.
 */
export function VisualFrame({
  label,
  children,
  className = "",
}: {
  label: string;
  children: (flow: boolean) => ReactNode;
  className?: string;
}) {
  const { reduced } = useSite();
  const ref = useRef<SVGSVGElement>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node || typeof IntersectionObserver === "undefined") {
      setInView(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) setInView(entry.isIntersecting);
      },
      { threshold: 0.15 },
    );
    io.observe(node);
    return () => io.disconnect();
  }, []);

  const flow = inView && !reduced;

  return (
    <svg
      ref={ref}
      viewBox="0 0 480 300"
      preserveAspectRatio="xMidYMid meet"
      role="img"
      aria-label={label}
      focusable="false"
      className={`sv-svg block w-full ${className}`}
      data-flow={flow}
    >
      {children(flow)}
    </svg>
  );
}

/* ── geometry ───────────────────────────────────────────────────────────── */

export type Side = "l" | "r" | "t" | "b";
export type Box = { x: number; y: number; w: number; h: number };
type Pt = readonly [number, number];

export const bx = (x: number, y: number, w: number, h: number): Box => ({ x, y, w, h });

const OUT: Record<Side, Pt> = { l: [-1, 0], r: [1, 0], t: [0, -1], b: [0, 1] };

const round = (n: number) => Math.round(n * 100) / 100;
const fmt = (p: Pt) => `${round(p[0])} ${round(p[1])}`;

/** Exact point on a rectangle border: t = 0..1 along that side. */
export function anchor(b: Box, side: Side, t = 0.5): Pt {
  const k = Math.min(1, Math.max(0, t));
  if (side === "l") return [b.x, b.y + b.h * k];
  if (side === "r") return [b.x + b.w, b.y + b.h * k];
  if (side === "t") return [b.x + b.w * k, b.y];
  return [b.x + b.w * k, b.y + b.h];
}

export type RouteOpts = {
  /** anchor position on the source side */
  ta?: number;
  /** anchor position on the target side */
  tb?: number;
  /** perpendicular stub before turning, keeps the exit readable */
  stub?: number;
  /** corner radius */
  radius?: number;
  /** smooth cubic instead of an orthogonal elbow */
  curve?: boolean;
  /** forced coordinate of the middle segment */
  mid?: number;
};

function polyline(raw: Pt[], radius: number): string {
  const pts: Pt[] = [];
  for (const p of raw) {
    const last = pts[pts.length - 1];
    if (!last || Math.hypot(p[0] - last[0], p[1] - last[1]) > 0.01) pts.push(p);
  }
  if (pts.length < 2) return "";
  let d = `M${fmt(pts[0])}`;
  for (let i = 1; i < pts.length - 1; i += 1) {
    const prev = pts[i - 1];
    const cur = pts[i];
    const next = pts[i + 1];
    const v1: Pt = [prev[0] - cur[0], prev[1] - cur[1]];
    const v2: Pt = [next[0] - cur[0], next[1] - cur[1]];
    const l1 = Math.hypot(v1[0], v1[1]);
    const l2 = Math.hypot(v2[0], v2[1]);
    if (l1 < 0.01 || l2 < 0.01) continue;
    const r = Math.min(radius, l1 / 2, l2 / 2);
    const c1: Pt = [cur[0] + (v1[0] / l1) * r, cur[1] + (v1[1] / l1) * r];
    const c2: Pt = [cur[0] + (v2[0] / l2) * r, cur[1] + (v2[1] / l2) * r];
    d += ` L${fmt(c1)} Q${fmt(cur)} ${fmt(c2)}`;
  }
  d += ` L${fmt(pts[pts.length - 1])}`;
  return d;
}

/**
 * Edge built from the two rectangles it joins: both ends sit exactly on the
 * borders given by the sides, never in the void.
 */
export function connect(a: Box, sa: Side, b: Box, sb: Side, o: RouteOpts = {}): string {
  const { ta = 0.5, tb = 0.5, stub = 12, radius = 5, curve = false, mid } = o;
  const p0 = anchor(a, sa, ta);
  const p1 = anchor(b, sb, tb);
  const oa = OUT[sa];
  const ob = OUT[sb];
  const s0: Pt = [p0[0] + oa[0] * stub, p0[1] + oa[1] * stub];
  const s1: Pt = [p1[0] + ob[0] * stub, p1[1] + ob[1] * stub];
  const hA = oa[0] !== 0;
  const hB = ob[0] !== 0;
  const aligned = hA === hB && (hA ? Math.abs(s0[1] - s1[1]) < 0.5 : Math.abs(s0[0] - s1[0]) < 0.5);

  if (aligned) return polyline([p0, s0, s1, p1], 0);

  if (curve) {
    const cx = (s0[0] + s1[0]) / 2;
    const cy = (s0[1] + s1[1]) / 2;
    const c1: Pt = hA ? [cx, s0[1]] : [s0[0], cy];
    const c2: Pt = hA ? [cx, s1[1]] : [s1[0], cy];
    return `M${fmt(p0)} L${fmt(s0)} C${fmt(c1)} ${fmt(c2)} ${fmt(s1)} L${fmt(p1)}`;
  }

  const pts: Pt[] = [p0, s0];
  if (hA && hB) {
    const mx = mid ?? (s0[0] + s1[0]) / 2;
    pts.push([mx, s0[1]], [mx, s1[1]]);
  } else if (!hA && !hB) {
    const my = mid ?? (s0[1] + s1[1]) / 2;
    pts.push([s0[0], my], [s1[0], my]);
  } else if (hA) {
    pts.push([s1[0], s0[1]]);
  } else {
    pts.push([s0[0], s1[1]]);
  }
  pts.push(s1, p1);
  return polyline(pts, radius);
}

/* ── primitives ─────────────────────────────────────────────────────────── */

export function Defs({ uid }: { uid: string }) {
  const arrow = (id: string, fill: string) => (
    <marker
      id={id}
      viewBox="0 0 8 8"
      refX={7.4}
      refY={4}
      markerWidth={5}
      markerHeight={5}
      markerUnits="strokeWidth"
      orient="auto"
    >
      <path d="M0.8 1 L7.4 4 L0.8 7 Z" fill={fill} />
    </marker>
  );
  return (
    <defs>
      {arrow(`${uid}-a`, "var(--ink-faint)")}
      {arrow(`${uid}-b`, "var(--accent)")}
    </defs>
  );
}

export type NodeTone = "plain" | "accent" | "strong";

export function Node({
  x,
  y,
  w = 88,
  h = 48,
  title,
  sub,
  tone = "plain",
  rx = 2,
}: {
  x: number;
  y: number;
  w?: number;
  h?: number;
  title: string;
  sub?: string;
  tone?: NodeTone;
  rx?: number;
}) {
  const fill =
    tone === "accent"
      ? "color-mix(in srgb, var(--accent) 14%, var(--bg-2))"
      : tone === "strong"
        ? "var(--bg-3)"
        : "var(--bg-2)";
  const stroke = tone === "plain" ? "var(--line)" : "var(--accent)";
  return (
    <g className="sv-node">
      <rect x={x} y={y} width={w} height={h} rx={rx} fill={fill} stroke={stroke} strokeWidth={1} />
      <text x={x + w / 2} y={sub ? y + h / 2 - 2 : y + h / 2 + 3.5} textAnchor="middle" className="sv-node-title">
        {title}
      </text>
      {sub ? (
        <text x={x + w / 2} y={y + h / 2 + 11} textAnchor="middle" className="sv-node-sub">
          {sub}
        </text>
      ) : null}
    </g>
  );
}

export function Label({
  x,
  y,
  text,
  tone = "muted",
  anchor = "start",
}: {
  x: number;
  y: number;
  text: string;
  tone?: "muted" | "accent" | "ink";
  anchor?: "start" | "middle" | "end";
}) {
  const cls = tone === "accent" ? "sv-label sv-label-accent" : tone === "ink" ? "sv-label sv-label-ink" : "sv-label";
  return (
    <text x={x} y={y} textAnchor={anchor} className={cls}>
      {text}
    </text>
  );
}

/**
 * Edge between two nodes: solid faint base with an arrowhead, an animated
 * accent dash on top and packets that travel along the very same path.
 */
export function Link({
  uid,
  d,
  flow,
  accent = false,
  arrow = true,
  delay = 0,
  packets = 0,
  packetDur = 3,
  packetBegin = 0,
}: {
  uid: string;
  d: string;
  flow: boolean;
  accent?: boolean;
  arrow?: boolean;
  delay?: number;
  packets?: number;
  packetDur?: number;
  packetBegin?: number;
}) {
  const rid = useSvgId();
  const stroke = accent ? "var(--accent-2)" : "var(--accent)";
  return (
    <g>
      <path
        id={rid}
        d={d}
        fill="none"
        stroke="var(--ink-faint)"
        strokeOpacity={0.45}
        strokeWidth={1}
        strokeLinecap="round"
        strokeLinejoin="round"
        markerEnd={arrow ? `url(#${uid}-a)` : undefined}
      />
      <path
        d={d}
        fill="none"
        stroke={stroke}
        strokeWidth={1.3}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray="2 6"
        opacity={0.9}
        className={flow ? "sv-flow" : undefined}
        style={flow ? { animationDelay: `${delay}ms` } : undefined}
      />
      {flow && packets > 0
        ? Array.from({ length: packets }, (_, i) => (
            <circle key={i} r={2.1} fill={stroke} className="sv-pkt">
              <animateMotion
                dur={`${packetDur}s`}
                begin={`${round(packetBegin + (i * packetDur) / packets)}s`}
                repeatCount="indefinite"
              >
                <mpath href={`#${rid}`} />
              </animateMotion>
            </circle>
          ))
        : null}
    </g>
  );
}
