import { useEffect, useRef, useState } from "react";
import { useSite } from "../../context/site";
import type { EmbeddingHandle } from "../../three/embedding";

const LEGEND_DIM = 384;
const TOP_K = 5;

/**
 * Canvas «Embedding Space». Палитра читается модулем один раз и перекрашивается
 * по событию themechange; подписи — DOM-оверлей, позиция пишется в rAF.
 */
export function EmbeddingCanvas({ onLive }: { onLive?: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const { dict, reduced, lowPower } = useSite();
  const [failed, setFailed] = useState(false);
  const [ready, setReady] = useState(false);
  const [count, setCount] = useState(0);
  const handle = useRef<EmbeddingHandle | null>(null);
  const clusterWord = useRef(dict.hero.cluster);
  const liveRef = useRef(onLive);
  liveRef.current = onLive;
  clusterWord.current = dict.hero.cluster;

  useEffect(() => {
    const canvas = canvasRef.current;
    const overlay = overlayRef.current;
    if (!canvas || !overlay) return;
    let dead = false;
    const mobile = window.matchMedia("(max-width: 1023px)").matches;
    void import("../../three/embedding")
      .then(({ createEmbedding }) =>
        createEmbedding(canvas, {
          overlay,
          mobile,
          lite: mobile || lowPower,
          reduced,
          getClusterWord: () => clusterWord.current,
          onReady: (n) => {
            if (!dead) {
              setCount(n);
              setReady(true);
              liveRef.current?.();
            }
          },
        }),
      )
      .then((h) => {
        if (dead) {
          h.dispose();
          return;
        }
        handle.current = h;
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
    // сцена пересоздаётся только при смене «мобильного» профиля
  }, [lowPower]);

  useEffect(() => {
    handle.current?.setReduced(reduced);
  }, [reduced]);

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const io = new IntersectionObserver(
      ([entry]) => handle.current?.setActive(entry.isIntersecting),
      { threshold: 0.02 },
    );
    io.observe(stage);
    const ro = new ResizeObserver(() => handle.current?.resize());
    ro.observe(stage);
    return () => {
      io.disconnect();
      ro.disconnect();
    };
  }, []);

  if (failed) return null;

  return (
    <div ref={stageRef} className="emb-wrap">
      <div className="emb-stage">
        <canvas ref={canvasRef} className={`emb-canvas ${ready ? "is-ready" : ""}`} aria-hidden />
        <div ref={overlayRef} className="emb-overlay" aria-hidden />
      </div>
      <p className="emb-hud" aria-hidden>
        dim={LEGEND_DIM} · n={count} · metric=euclidean · top_k={TOP_K}
      </p>
    </div>
  );
}
