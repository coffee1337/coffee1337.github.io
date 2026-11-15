import { useSite } from "../../../context/site";
import { Defs, Label, Link, Node, VisualFrame, bx, connect, useSvgId } from "./kit";

/** Collected events per period; every column grows from the shared baseline. */
const BARS = [34, 52, 44, 68, 58, 82, 64, 92, 74];
const BASELINE = 244;

/**
 * portfolio-analytics: browser beacon -> FastAPI collector -> SQLAlchemy ->
 * PostgreSQL (Neon), then the dashboard on Render reads it back.
 */
export function AnalyticsVisual() {
  const { dict } = useSite();
  const t = dict.visuals.analytics;
  const uid = useSvgId();

  const browser = bx(16, 54, 84, 44);
  const collector = bx(118, 54, 96, 44);
  const models = bx(232, 54, 92, 44);
  const store = bx(342, 54, 106, 44);
  const dashboard = bx(342, 150, 106, 44);

  return (
    <VisualFrame label={t.label}>
      {(flow) => (
        <>
          <Defs uid={uid} />
          <Label x={16} y={24} text={t.eyebrow} tone="accent" />

          <Link uid={uid} d={connect(browser, "r", collector, "l")} flow={flow} packets={2} packetDur={2.6} />
          <Link uid={uid} d={connect(collector, "r", models, "l")} flow={flow} delay={140} packets={2} packetDur={2.6} packetBegin={0.8} />
          <Link uid={uid} d={connect(models, "r", store, "l")} flow={flow} delay={280} packets={1} packetDur={2.6} packetBegin={0.4} />
          <Link uid={uid} d={connect(store, "b", dashboard, "t")} flow={flow} accent delay={420} packets={1} packetDur={3} />

          <Node x={browser.x} y={browser.y} w={browser.w} h={browser.h} title={t.browser} />
          <Node x={collector.x} y={collector.y} w={collector.w} h={collector.h} title={t.collector} tone="accent" />
          <Node x={models.x} y={models.y} w={models.w} h={models.h} title={t.models} />
          <Node x={store.x} y={store.y} w={store.w} h={store.h} title={t.store} />
          <Node x={dashboard.x} y={dashboard.y} w={dashboard.w} h={dashboard.h} title={t.dashboard} tone="strong" />

          <Label x={16} y={132} text={t.events} />
          {BARS.map((h, i) => (
            <rect
              key={i}
              x={16 + i * 31}
              y={BASELINE - h}
              width={20}
              height={h}
              fill="var(--accent-2)"
              opacity={0.55}
              className={flow ? "sv-bar" : undefined}
              style={flow ? { animationDelay: `${i * 130}ms` } : undefined}
            />
          ))}
          <line x1={16} y1={BASELINE} x2={292} y2={BASELINE} className="sv-axis" />

          <Label x={16} y={274} text={t.footnote} />
        </>
      )}
    </VisualFrame>
  );
}
