import { useSite } from "../../../context/site";
import { Defs, Label, Link, Node, VisualFrame, bx, connect, useSvgId } from "./kit";

/**
 * ai-python-mentor: Next.js UI -> FastAPI -> AI Gateway (with RAG) -> LLM,
 * plus PostgreSQL, background workers and the Telegram bot in front of FastAPI.
 */
export function MentorVisual() {
  const { dict } = useSite();
  const t = dict.visuals.mentor;
  const uid = useSvgId();

  const ui = bx(16, 64, 84, 48);
  const api = bx(136, 64, 96, 48);
  const gateway = bx(266, 64, 96, 48);
  const llm = bx(384, 64, 72, 48);
  const telegram = bx(16, 176, 84, 44);
  const postgres = bx(136, 176, 96, 44);
  const worker = bx(266, 176, 96, 44);

  const stream = [86, 62, 34];

  return (
    <VisualFrame label={t.label}>
      {(flow) => (
        <>
          <Defs uid={uid} />
          <Label x={16} y={24} text={t.eyebrow} tone="accent" />

          <Link uid={uid} d={connect(ui, "r", api, "l")} flow={flow} packets={2} packetDur={2.8} />
          <Link
            uid={uid}
            d={connect(api, "r", gateway, "l")}
            flow={flow}
            delay={120}
            packets={2}
            packetDur={2.8}
            packetBegin={0.9}
          />
          <Link
            uid={uid}
            d={connect(gateway, "r", llm, "l")}
            flow={flow}
            delay={240}
            packets={1}
            packetDur={2.8}
            packetBegin={0.45}
          />
          <Link uid={uid} d={connect(api, "b", postgres, "t")} flow={flow} delay={80} accent />
          <Link
            uid={uid}
            d={connect(api, "b", worker, "t", { ta: 0.88, mid: 140 })}
            flow={flow}
            delay={320}
            packets={1}
            packetDur={3.4}
          />
          <Link uid={uid} d={connect(telegram, "r", api, "l", { tb: 0.78 })} flow={flow} delay={200} />

          <Node x={ui.x} y={ui.y} w={ui.w} h={ui.h} title={t.ui} />
          <Node x={api.x} y={api.y} w={api.w} h={api.h} title={t.api} tone="accent" />
          <Node x={gateway.x} y={gateway.y} w={gateway.w} h={gateway.h} title={t.gateway} sub={t.rag} tone="accent" />
          <Node x={llm.x} y={llm.y} w={llm.w} h={llm.h} title={t.llm} tone="strong" />
          <Node x={telegram.x} y={telegram.y} w={telegram.w} h={telegram.h} title={t.telegram} />
          <Node x={postgres.x} y={postgres.y} w={postgres.w} h={postgres.h} title={t.postgres} />
          <Node x={worker.x} y={worker.y} w={worker.w} h={worker.h} title={t.worker} sub={t.queue} />

          <Label x={16} y={258} text={t.caption} tone="ink" />
          {stream.map((w, i) => (
            <rect
              key={i}
              x={16 + stream.slice(0, i).reduce((sum, v) => sum + v + 8, 0)}
              y={270}
              width={w}
              height={4}
              rx={2}
              fill={i === 2 ? "var(--accent-2)" : "var(--accent)"}
              opacity={0.85}
              className={flow ? "sv-stream" : undefined}
              style={flow ? { animationDelay: `${i * 420}ms` } : undefined}
            />
          ))}
        </>
      )}
    </VisualFrame>
  );
}
