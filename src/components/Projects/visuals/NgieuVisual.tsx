import { useSite } from "../../../context/site";
import { Defs, Label, Link, Node, VisualFrame, bx, connect, useSvgId } from "./kit";

/**
 * ngieuapp: one device, one chain. Flutter UI -> SQLite offline cache ->
 * timetable -> local notifications -> home/lock screen widget.
 */
export function NgieuVisual() {
  const { dict } = useSite();
  const t = dict.visuals.ngieu;
  const uid = useSvgId();

  const ui = bx(33, 84, 116, 48);
  const cache = bx(33, 168, 116, 48);
  const schedule = bx(202, 46, 262, 44);
  const notify = bx(202, 131, 262, 44);
  const widget = bx(202, 216, 262, 56);

  return (
    <VisualFrame label={t.label}>
      {(flow) => (
        <>
          <Defs uid={uid} />
          <Label x={16} y={24} text={t.eyebrow} tone="accent" />

          {/* device shell */}
          <rect x={16} y={36} width={150} height={236} rx={18} fill="var(--bg-2)" stroke="var(--line-strong)" />
          <rect x={25} y={54} width={132} height={198} rx={10} fill="var(--bg-3)" opacity={0.45} />
          <rect x={66} y={40} width={50} height={6} rx={3} fill="var(--ink-faint)" opacity={0.5} />
          <rect x={76} y={260} width={30} height={4} rx={2} fill="var(--ink-faint)" opacity={0.55} />

          <Link uid={uid} d={connect(ui, "b", cache, "t")} flow={flow} packets={1} packetDur={2.6} />
          <Link uid={uid} d={connect(cache, "r", schedule, "l")} flow={flow} delay={140} packets={2} packetDur={3.2} />
          <Link uid={uid} d={connect(schedule, "b", notify, "t")} flow={flow} delay={260} packets={1} packetDur={2.8} />
          <Link uid={uid} d={connect(notify, "b", widget, "t")} flow={flow} delay={360} accent packets={1} packetDur={3} />

          <Node x={ui.x} y={ui.y} w={ui.w} h={ui.h} title={t.flutter} tone="accent" />
          <Node x={cache.x} y={cache.y} w={cache.w} h={cache.h} title={t.cache} />
          <Node x={schedule.x} y={schedule.y} w={schedule.w} h={schedule.h} title={t.schedule} />
          <Node x={notify.x} y={notify.y} w={notify.w} h={notify.h} title={t.notify} />

          {/* lock-screen widget: rounded card with a grabber, not a pipeline box */}
          <g>
            <rect
              x={widget.x}
              y={widget.y}
              width={widget.w}
              height={widget.h}
              rx={12}
              fill="var(--bg-3)"
              stroke="var(--accent)"
              strokeOpacity={0.75}
              strokeDasharray="3 4"
            />
            <rect
              x={widget.x + widget.w / 2 - 14}
              y={widget.y + 11}
              width={28}
              height={3}
              rx={1.5}
              fill="var(--ink-faint)"
              opacity={0.45}
            />
            <text x={widget.x + widget.w / 2} y={widget.y + widget.h / 2 + 8} textAnchor="middle" className="sv-node-title">
              {t.widget}
            </text>
          </g>
        </>
      )}
    </VisualFrame>
  );
}
