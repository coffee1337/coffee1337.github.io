import { useEffect, useRef, useState } from "react";
import { useSite } from "../../context/site";

type ClusterHover = { id: string; n: number } | null;
type QueryOverlay = {
  text: string;
  query: { x: number; y: number };
  neighbors: { x: number; y: number; score: string }[];
} | null;
type EmbeddingHandle = {
  dispose: () => void;
  resize: () => void;
  setActive: (on: boolean) => void;
  setTheme: () => void;
  setReduced: (on: boolean) => void;
};

const Fallback = () => (
  <img src="/embedding-fallback.svg" alt="" className="h-full w-full object-cover" />
);

export function EmbeddingCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { theme, reduced, lowPower } = useSite();
  const [failed, setFailed] = useState(false);
  const [cluster, setCluster] = useState<ClusterHover>(null);
  const [query, setQuery] = useState<QueryOverlay>(null);
  const handle = useRef<EmbeddingHandle | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let dead = false;
    const mobile = window.matchMedia("(max-width: 760px)").matches || lowPower;
    void import("../../three/embedding")
      .then(({ createEmbedding }) =>
        createEmbedding(canvas, {
          mobile,
          reduced,
          onCluster: (next) => {
            if (!dead) setCluster(next);
          },
          onQuery: (next) => {
            if (!dead) setQuery(next);
          },
        }),
      )
      .then((h) => {
        if (dead) {
          h.dispose();
          return;
        }
        handle.current = h;
        h.setTheme();
        h.setReduced(reduced);
      })
      .catch(() => {
        if (!dead) setFailed(true);
      });
    return () => {
      dead = true;
      handle.current?.dispose();
      handle.current = null;
    };
  }, [lowPower]);

  useEffect(() => {
    handle.current?.setTheme();
  }, [theme]);

  useEffect(() => {
    handle.current?.setReduced(reduced);
  }, [reduced]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const root = canvas.parentElement;
    if (!root) return;
    const io = new IntersectionObserver(
      ([entry]) => handle.current?.setActive(entry.isIntersecting),
      { threshold: 0.05 },
    );
    io.observe(root);
    const ro = new ResizeObserver(() => handle.current?.resize());
    ro.observe(root);
    return () => {
      io.disconnect();
      ro.disconnect();
    };
  }, []);

  if (failed) return <Fallback />;

  return (
    <>
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" aria-hidden />
      {cluster && (
        <p className="pointer-events-none absolute left-3 top-3 font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--ink-dim)]">
          cluster: {cluster.id} · n={cluster.n}
        </p>
      )}
      {query && (
        <>
          <span
            className="pointer-events-none absolute font-mono text-[10px] text-[var(--accent)]"
            style={{ left: query.query.x, top: query.query.y, transform: "translate(8px, -12px)" }}
          >
            query: "{query.text}"
          </span>
          {query.neighbors.map((n) => (
            <span
              key={`${n.x}-${n.y}-${n.score}`}
              className="pointer-events-none absolute font-mono text-[10px] text-[var(--accent-2)]"
              style={{ left: n.x, top: n.y, transform: "translate(6px, 4px)" }}
            >
              {n.score}
            </span>
          ))}
        </>
      )}
      <p className="pointer-events-none absolute bottom-3 right-3 font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--ink-faint)]">
        dim=384 · n=2048 · metric=cosine · top_k=5
      </p>
    </>
  );
}
