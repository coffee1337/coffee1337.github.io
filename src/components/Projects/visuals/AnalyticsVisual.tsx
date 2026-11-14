import { Label, Link, Node, VisualFrame } from "./kit";

/** portfolio-analytics: beacon в браузере → FastAPI → SQLAlchemy → дашборд. */
export function AnalyticsVisual() {
  return (
    <VisualFrame label="portfolio-analytics: browser beacon, FastAPI collector, SQLAlchemy and dashboard">
      {(flow) => (
        <>
          <Label x={16} y={16} text="beacon pipeline" accent />

          <Node x={16} y={64} w={96} title="browser" sub="beacon()" />
          <Node x={140} y={64} w={96} title="FastAPI" sub="collector" accent />
          <Node x={264} y={64} w={96} title="SQLAlchemy" sub="models" />
          <Node x={388} y={64} w={76} title="dashboard" sub="reads" strong />

          <Link d="M112 81 H140" animate={flow} />
          <Link d="M236 81 H264" animate={flow} delay={140} />
          <Link d="M360 81 H388" animate={flow} delay={280} />

          {[0, 1, 2, 3].map((i) => (
            <circle
              key={i}
              cx={112 + i * 124}
              cy={81}
              r={2}
              fill="var(--accent)"
              opacity={flow ? 0 : 0}
              className={flow ? "sv-packet" : undefined}
              style={flow ? { animationDelay: `${i * 180}ms` } : undefined}
            />
          ))}

          <Label x={16} y={132} text="events" />
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <rect
              key={i}
              x={16 + i * 22}
              y={140 - (i % 3) * 6}
              width={14}
              height={40 + ((i * 7) % 18)}
              fill="var(--accent-2)"
              opacity={flow ? 0.35 : 0.22}
              className={flow ? "sv-bar" : undefined}
              style={flow ? { animationDelay: `${i * 160}ms` } : undefined}
            />
          ))}
          <line x1={16} y1={186} x2={148} y2={186} stroke="var(--line)" />

          <Label x={176} y={132} text="queue" />
          {[0, 1, 2].map((i) => (
            <rect
              key={i}
              x={176}
              y={142 + i * 16}
              width={120 - i * 26}
              height={10}
              rx={2}
              fill="var(--bg-3)"
              stroke="var(--line-2)"
              className={flow ? "sv-row" : undefined}
              style={flow ? { animationDelay: `${i * 200}ms` } : undefined}
            />
          ))}

          <Label x={330} y={132} text="uptime" />
          <text x={330} y={164} style={{ fontFamily: "var(--font-display)", fontSize: 24, fill: "var(--ink)" }}>24/7</text>
          <Label x={330} y={182} text="collector" />

          <Label x={16} y={268} text="no personal data" />
        </>
      )}
    </VisualFrame>
  );
}
