import { Label, Link, Node, VisualFrame } from "./kit";

/** ai-python-mentor: Next.js → FastAPI → AI Gateway → LLM, RAG-ветка, очередь и Telegram. */
export function MentorVisual() {
  return (
    <VisualFrame label="ai-python-mentor: Next.js, FastAPI, AI Gateway, LLM, RAG on pgvector, Redis and a Telegram bot">
      {(flow) => (
        <>
          <Label x={16} y={16} text="agent pipeline" accent />
          <Node x={16} y={40} w={92} title="Next.js" sub="ui" />
          <Node x={136} y={40} w={92} title="FastAPI" sub="api" accent />
          <Node x={256} y={40} w={92} title="AI Gateway" sub="routing" />
          <Node x={376} y={40} w={88} title="LLM" sub="stream" strong />

          <Link d="M108 57 H136" animate={flow} />
          <Link d="M228 57 H256" animate={flow} delay={120} />
          <Link d="M348 57 H376" animate={flow} delay={240} />

          <Node x={256} y={110} w={92} title="RAG" sub="pgvector" accent />
          <Node x={376} y={110} w={88} title="PostgreSQL" sub="docs" />
          <Link d="M302 74 V110" accent animate={flow} delay={160} />
          <Link d="M348 127 H376" animate={flow} delay={300} />

          <Node x={136} y={170} w={92} title="Redis" sub="queue" />
          <Node x={256} y={170} w={92} title="worker" sub="ingest" />
          <Link d="M182 74 V170" animate={flow} delay={80} />
          <Link d="M228 187 H256" animate={flow} delay={200} />
          <Link d="M302 170 V144" accent animate={flow} delay={340} />

          <Node x={16} y={170} w={92} title="Telegram" sub="bot" />
          <Link d="M108 187 H136" animate={flow} delay={260} />

          <Label x={16} y={232} text={flow ? "query → retrieval → streaming answer" : "query → retrieval → streaming answer"} />
          <g opacity={flow ? 1 : 0.45}>
            <rect x={16} y={244} width={92} height={4} rx={2} fill="var(--accent)" opacity={0.8} />
            <rect x={116} y={244} width={62} height={4} rx={2} fill="var(--accent)" opacity={0.5} />
            <rect x={186} y={244} width={34} height={4} rx={2} fill="var(--accent-2)" opacity={0.6} />
          </g>
        </>
      )}
    </VisualFrame>
  );
}
