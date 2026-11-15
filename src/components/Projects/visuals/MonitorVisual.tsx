import { useSite } from "../../../context/site";
import { Defs, Label, Link, Node, VisualFrame, bx, connect, useSvgId } from "./kit";

const ROWS = [0, 1, 2, 3, 4, 5];

/** Gauge geometry: upper semicircle, left = low risk, right = high risk. */
const CX = 322;
const CY = 192;
const R = 56;
const NEEDLE = 46;

const rad = (deg: number) => (deg * Math.PI) / 180;
const polar = (deg: number, r: number): [number, number] => [CX + r * Math.cos(rad(deg)), CY - r * Math.sin(rad(deg))];
const arc = (from: number, to: number) => {
  const a = polar(from, R);
  const b = polar(to, R);
  return `M${a[0].toFixed(2)} ${a[1].toFixed(2)} A${R} ${R} 0 0 1 ${b[0].toFixed(2)} ${b[1].toFixed(2)}`;
};

/**
 * transaction-monitor: transaction stream -> rule engine -> risk score grid,
 * with the risk gauge (low / medium / high) and SQL Server behind it.
 */
export function MonitorVisual() {
  const { dict } = useSite();
  const t = dict.visuals.monitor;
  const uid = useSvgId();

  const rows = ROWS.map((i) => bx(14, 56 + i * 24, 104, 16));
  const engine = bx(150, 84, 96, 52);
  const risk = bx(274, 84, 92, 52);
  const sql = bx(388, 84, 76, 52);

  return (
    <VisualFrame label={t.label}>
      {(flow) => (
        <>
          <Defs uid={uid} />
          <Label x={16} y={24} text={t.eyebrow} tone="accent" />

          {rows.map((row, i) => (
            <rect
              key={i}
              x={row.x}
              y={row.y}
              width={row.w}
              height={row.h}
              rx={2}
              fill="var(--bg-3)"
              stroke="var(--line-2)"
              className={flow ? "sv-row" : undefined}
              style={flow ? { animationDelay: `${i * 200}ms` } : undefined}
            />
          ))}
          <Label x={14} y={212} text={t.stream} />

          {rows.map((row, i) => (
            <Link
              key={i}
              uid={uid}
              d={connect(row, "r", engine, "l", { tb: 0.12 + i * 0.152, curve: true, stub: 8, radius: 4 })}
              flow={flow}
              delay={i * 90}
              packets={i === 0 || i === 2 ? 1 : 0}
              packetDur={3.2}
              packetBegin={i * 0.4}
            />
          ))}

          <Link uid={uid} d={connect(engine, "r", risk, "l")} flow={flow} accent delay={120} packets={1} packetDur={2.6} />
          <Link uid={uid} d={connect(risk, "r", sql, "l")} flow={flow} delay={240} packets={1} packetDur={2.8} />

          <Node x={engine.x} y={engine.y} w={engine.w} h={engine.h} title={t.rules} tone="accent" />
          <Node x={risk.x} y={risk.y} w={risk.w} h={risk.h} title={t.risk} tone="strong" />
          <Node x={sql.x} y={sql.y} w={sql.w} h={sql.h} title={t.sql} />

          {/* risk gauge */}
          <path d={arc(178, 122)} fill="none" stroke="var(--ok)" strokeWidth={3} strokeLinecap="round" opacity={0.75} />
          <path d={arc(118, 62)} fill="none" stroke="var(--accent-2)" strokeWidth={3} strokeLinecap="round" opacity={0.75} />
          <path d={arc(58, 2)} fill="none" stroke="var(--accent)" strokeWidth={3} strokeLinecap="round" opacity={0.9} />
          <path d={arc(180, 0)} fill="none" stroke="var(--line-2)" strokeWidth={1} />

          <line
            x1={CX}
            y1={CY}
            x2={CX}
            y2={CY - NEEDLE}
            stroke="var(--ink)"
            strokeWidth={1.6}
            strokeLinecap="round"
          >
            {flow ? (
              <animateTransform
                attributeName="transform"
                type="rotate"
                values={`-74 ${CX} ${CY}; 74 ${CX} ${CY}; -74 ${CX} ${CY}`}
                keyTimes="0;0.5;1"
                calcMode="spline"
                keySplines="0.45 0 0.55 1;0.45 0 0.55 1"
                dur="7s"
                repeatCount="indefinite"
              />
            ) : null}
          </line>
          <circle cx={CX} cy={CY} r={3.2} fill="var(--ink)" />

          <Label x={266} y={210} text={t.low} anchor="middle" />
          <Label x={CX} y={210} text={t.mid} anchor="middle" />
          <Label x={378} y={210} text={t.high} anchor="middle" />

          <path d="M244 232 L250 242 L238 242 Z" fill="none" stroke="var(--accent)" strokeWidth={1} className={flow ? "sv-alert" : undefined} />
          <Label x={256} y={242} text={t.alert} tone="accent" />
        </>
      )}
    </VisualFrame>
  );
}
