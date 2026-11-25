import { useSite } from "../../../context/site";
import { Defs, Label, Link, Node, VisualFrame, bx, connect, useSvgId } from "./kit";

/* Геометрия экрана ИКО РЛС. Все координаты детерминированы: Math.random в рендере
   сломал бы гидрацию пререндера. */
const CX = 120;
const CY = 148;
const R = 86;
const RINGS = [28, 57, 86] as const;
const AZIMUTHS = [0, 45, 90, 135] as const;

/** Пуассоновский шум и клаттер: 12 фиксированных отметок внутри строба. */
const CLUTTER: ReadonlyArray<readonly [number, number]> = [
  [150, 110],
  [95, 105],
  [139, 196],
  [76, 166],
  [168, 168],
  [104, 128],
  [156, 150],
  [86, 118],
  [132, 124],
  [112, 186],
  [146, 178],
  [70, 144],
];

const TARGETS = [
  { x: 98, y: 178, trail: "M 82 191 L 87 187 L 92 183", labelX: 103, labelY: 171 },
  { x: 146, y: 116, trail: "M 160 128 L 155 124 L 150 120", labelX: 152, labelY: 109 },
] as const;

const pt = (angle: number, radius: number): string => {
  const rad = (angle * Math.PI) / 180;
  const round = (value: number) => Math.round(value * 100) / 100;
  return `${round(CX + Math.cos(rad) * radius)} ${round(CY + Math.sin(rad) * radius)}`;
};

/**
 * RadarPPI-MTD: экран индикатора кругового обзора с развёрткой и двумя
 * обнаруженными целями, справа — конвейер PPI Gen → YOLO11s → Pd/FPPI.
 */
export function RadarVisual() {
  const { dict } = useSite();
  const t = dict.visuals.radar;
  const uid = useSvgId();

  const scope = bx(34, 62, 172, 172);
  const generator = bx(266, 58, 196, 44);
  const detector = bx(266, 128, 196, 44);
  const metric = bx(266, 198, 196, 44);

  return (
    <VisualFrame label={t.label}>
      {(flow) => (
        <>
          <Defs uid={uid} />
          <Label x={16} y={24} text={t.eyebrow} tone="accent" />

          <Link uid={uid} d={connect(scope, "r", generator, "l")} flow={flow} packets={2} packetDur={3.2} />
          <Link
            uid={uid}
            d={connect(generator, "b", detector, "t")}
            flow={flow}
            delay={160}
            packets={2}
            packetDur={2.8}
            packetBegin={0.6}
          />
          <Link
            uid={uid}
            d={connect(detector, "b", metric, "t")}
            flow={flow}
            accent
            delay={320}
            packets={2}
            packetDur={2.8}
            packetBegin={1.2}
          />

          {/* Экран ИКО: подложка, кольца дальности, азимуты, перекрестие. */}
          <circle cx={CX} cy={CY} r={R} fill="var(--bg-3)" stroke="var(--line)" />
          {RINGS.map((r) => (
            <circle
              key={`ring-${r}`}
              cx={CX}
              cy={CY}
              r={r}
              fill="none"
              stroke="var(--line)"
              strokeWidth={1}
              strokeDasharray={r === 57 ? "2 4" : undefined}
            />
          ))}
          {AZIMUTHS.map((angle) => {
            const [x1, y1] = pt(angle, R).split(" ").map(Number);
            const [x2, y2] = pt(angle + 180, R).split(" ").map(Number);
            return (
              <line
                key={`az-${angle}`}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke="var(--line-2)"
                strokeWidth={1}
              />
            );
          })}
          <line x1={CX - 6} y1={CY} x2={CX + 6} y2={CY} stroke="var(--line-2)" strokeWidth={1} />
          <line x1={CX} y1={CY - 6} x2={CX} y2={CY + 6} stroke="var(--line-2)" strokeWidth={1} />

          {CLUTTER.map(([x, y], i) => (
            <circle key={`noise-${i}`} cx={x} cy={y} r={1.1} fill="var(--ink-faint)" opacity={0.45} />
          ))}

          {/* Луч развёртки: сектор затухания + радиус. Вращается только при flow. */}
          <g className="sv-sweep">
            <path d={`M ${CX} ${CY} L ${CX} ${CY - R} A ${R} ${R} 0 0 1 ${pt(-30, R)} Z`} fill="var(--accent)" opacity={0.12} />
            <line x1={CX} y1={CY} x2={CX} y2={CY - R} stroke="var(--accent)" strokeWidth={1.2} opacity={0.9} />
          </g>

          {/* Цели: след траектории, рамка детекции 12×12 и уверенность YOLO. */}
          {TARGETS.map((target, i) => (
            <g key={`target-${i}`}>
              <path
                d={target.trail}
                fill="none"
                stroke="var(--ink-faint)"
                strokeWidth={1}
                strokeDasharray="2 3"
                opacity={0.6}
              />
              <rect
                x={target.x - 6}
                y={target.y - 6}
                width={12}
                height={12}
                fill="none"
                stroke={i === 0 ? "var(--ok)" : "var(--accent)"}
                strokeWidth={1.2}
                className={flow ? "sv-blip" : undefined}
                style={flow ? { animationDelay: `${i * 900}ms` } : undefined}
              />
              <text x={target.labelX} y={target.labelY} className="sv-node-sub">
                {i === 0 ? t.targetA : t.targetB}
              </text>
            </g>
          ))}

          <Node x={generator.x} y={generator.y} w={generator.w} h={generator.h} title={t.generator} sub={t.generatorSub} />
          <Node
            x={detector.x}
            y={detector.y}
            w={detector.w}
            h={detector.h}
            title={t.detector}
            sub={t.detectorSub}
            tone="accent"
          />
          <Node
            x={metric.x}
            y={metric.y}
            w={metric.w}
            h={metric.h}
            title={t.metric}
            sub={t.metricSub}
            tone="strong"
          />

          <Label x={16} y={278} text={t.footnote} />
        </>
      )}
    </VisualFrame>
  );
}