import { lazy, Suspense, useEffect, useState } from "react";
import { useSite } from "../../context/site";
import { EmbeddingFallback } from "./EmbeddingFallback";

const Live = lazy(() => import("./EmbeddingCanvas").then((m) => ({ default: m.EmbeddingCanvas })));

/**
 * Правая часть hero: облако эмбеддингов без рамки, с растворяющимися краями.
 * До загрузки WebGL — SVG-заглушка в той же палитре; canvas проявляется поверх.
 */
export function EmbeddingSpace() {
  const { loaderDone } = useSite();
  const [ready, setReady] = useState(false);
  const [live, setLive] = useState(false);

  useEffect(() => {
    if (!loaderDone) return;
    setReady(true);
  }, [loaderDone]);

  return (
    <div className="hero-field" aria-hidden>
      <div className="hero-field__bleed">
        <EmbeddingFallback className={`emb-fallback ${live ? "is-hidden" : ""}`} />
        {ready && (
          <Suspense fallback={null}>
            <Live onLive={() => setLive(true)} />
          </Suspense>
        )}
      </div>
    </div>
  );
}
