import { Label, Link, Node, VisualFrame } from "./kit";

/** ngieuapp: Flutter UI → SQLite offline cache → расписание → уведомления, плюс виджет на локскрине. */
export function NgieuVisual() {
  return (
    <VisualFrame label="ngieuapp: Flutter app, offline SQLite cache, schedule and notifications">
      {(flow) => (
        <>
          <Label x={16} y={16} text="flutter · offline first" accent />

          <rect x={22} y={40} width={96} height={210} rx={12} fill="var(--bg-2)" stroke="var(--line)" />
          <rect x={30} y={52} width={80} height={186} rx={6} fill="var(--bg-3)" stroke="var(--line-2)" />
          <rect x={52} y={44} width={36} height={4} rx={2} fill="var(--ink-faint)" opacity={0.5} />

          <Node x={38} y={62} w={64} h={26} title="Flutter" sub="ui" accent />
          <Node x={38} y={102} w={64} h={26} title="SQLite" sub="cache" />
          <Node x={38} y={142} w={64} h={26} title="schedule" sub="local" />
          <Node x={38} y={182} w={64} h={26} title="notify" sub="push" />

          <Link d="M70 88 V102" accent animate={flow} />
          <Link d="M70 128 V142" animate={flow} delay={120} />
          <Link d="M70 168 V182" animate={flow} delay={240} />

          <rect x={132} y={62} width={110} height={26} rx={2} fill="var(--bg-2)" stroke="var(--line)" />
          <text x={187} y={79} textAnchor="middle" style={{ fontFamily: "var(--font-mono)", fontSize: 8, fill: "var(--ink-dim)" }}>lock screen widget</text>

          <Node x={132} y={140} w={110} title="Flutter UI" sub="android / ios" />
          <Node x={266} y={140} w={110} title="SQLite" sub="offline cache" accent />
          <Node x={266} y={52} w={110} title="schedule" sub="timetable" />
          <Node x={266} y={228} w={110} title="notifications" sub="local push" />

          <Link d="M262 157 H266" animate={flow} delay={60} />
          <Link d="M321 140 V104" animate={flow} delay={180} />
          <Link d="M321 174 V228" accent animate={flow} delay={300} />
          <Link d="M376 52 C 410 90, 410 130, 376 140" animate={flow} delay={360} />

          <Label x={266} y={216} text="sync: daily" />
        </>
      )}
    </VisualFrame>
  );
}
