import { Label, Link, Node, VisualFrame } from "./kit";

const ROWS = [0, 1, 2, 3, 4, 5];

/** transaction-monitor: поток транзакций → rule engine → risk score → SQL Server. */
export function MonitorVisual() {
  return (
    <VisualFrame label="TransactionMonitor: transaction stream, rule engine, risk gauge and SQL Server">
      {(flow) => (
        <>
          <Label x={16} y={16} text="stream → rules → risk" accent />

          {ROWS.map((i) => (
            <rect
              key={i}
              x={16}
              y={40 + i * 26}
              width={104}
              height={16}
              rx={2}
              fill="var(--bg-3)"
              stroke="var(--line-2)"
              className={flow ? "sv-row" : undefined}
              style={flow ? { animationDelay: `${i * 220}ms` } : undefined}
            />
          ))}
          <Label x={16} y={24 + 6 * 26 + 8} text="transactions" />

          <Node x={150} y={96} w={96} h={44} title="rule engine" sub="py · rules" accent />
          <Link d="M120 108 C 138 108, 138 118, 150 118" animate={flow} />
          <Link d="M120 134 C 138 134, 138 118, 150 118" animate={flow} delay={180} />

          <Node x={284} y={96} w={80} h={44} title="risk score" sub="0..100" strong />
          <Link d="M246 118 H284" accent animate={flow} delay={120} />

          <g transform="translate(288 168)">
            <path d="M0 0 A 36 36 0 0 1 72 0" fill="none" stroke="var(--line)" strokeWidth={1} />
            <path d="M0 0 A 36 36 0 0 1 72 0" fill="none" stroke="var(--ok)" strokeWidth={3} strokeDasharray="0 200" opacity={0.7} />
            <path d="M36 0 A 36 36 0 0 1 68 22" fill="none" stroke="var(--accent-2)" strokeWidth={3} opacity={0.5} />
            <path d="M58 8 A 36 36 0 0 1 71 26" fill="none" stroke="var(--accent)" strokeWidth={3} />
            <line
              x1={36}
              y1={0}
              x2={62}
              y2={-18}
              stroke="var(--ink)"
              strokeWidth={1.5}
              className={flow ? "sv-needle" : undefined}
              style={{ transformOrigin: "36px 0px" }}
            />
          </g>
          <Label x={288} y={214} text="risk 0 → 100" />

          <Node x={392} y={96} w={72} h={44} title="SQL" sub="server" />
          <Link d="M364 118 H392" animate={flow} delay={260} />

          <Label x={16} y={268} text="alert when risk > 80" />
        </>
      )}
    </VisualFrame>
  );
}
