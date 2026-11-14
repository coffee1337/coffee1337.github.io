import { lazy, Suspense, useEffect, useState } from "react";
import { useSite } from "../../context/site";

const Fallback = () => (
  <img src="/embedding-fallback.svg" alt="" className="h-full w-full object-cover" />
);

const Live = lazy(() => import("./EmbeddingCanvas").then((m) => ({ default: m.EmbeddingCanvas })));

export function EmbeddingSpace() {
  const { loaderDone } = useSite();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!loaderDone) return;
    setReady(true);
  }, [loaderDone]);

  if (!ready) {
    return (
      <div className="hero-stage relative overflow-hidden" aria-hidden>
        <Fallback />
      </div>
    );
  }

  return (
    <div className="hero-stage relative overflow-hidden" aria-hidden>
      <Suspense fallback={<Fallback />}>
        <Live />
      </Suspense>
    </div>
  );
}
