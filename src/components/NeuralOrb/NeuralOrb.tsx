import { useEffect, useRef, useState } from "react";
import { useSite } from "../../context/site";
import type { OrbHandle } from "../../three/orb";
import { NeuralMark } from "../Brand/NeuralMark";

/** One canvas shared by the loader and the hero. It unmounts once the hero has scrolled away. */
export function NeuralOrb({ stageRef }: { stageRef: React.RefObject<HTMLElement | null> }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const handle = useRef<OrbHandle | null>(null);
  const { theme, reduced, orbMode, assembleRef, lowPower } = useSite();
  const [failed, setFailed] = useState(false);
  const [placed, setPlaced] = useState(false);
  const boot = useRef({ theme, reduced, orbMode, lowPower });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let dead = false;
    const mobile = window.matchMedia("(max-width: 760px)").matches || boot.current.lowPower;
    void import("../../three/orb")
      .then(({ createOrb }) =>
        createOrb(canvas, {
          theme: boot.current.theme,
          reduced: boot.current.reduced,
          mobile,
          mode: boot.current.orbMode,
          getAssemble: () => assembleRef.current,
        }),
      )
      .then((h) => {
        if (dead) {
          h.dispose();
          return;
        }
        handle.current = h;
        h.setTheme(boot.current.theme);
        h.setMode(boot.current.orbMode);
        h.setReduced(boot.current.reduced);
      })
      .catch(() => {
        if (!dead) setFailed(true);
      });

    const ro = new ResizeObserver(() => handle.current?.resize());
    if (stageRef.current) ro.observe(stageRef.current);
    return () => {
      dead = true;
      ro.disconnect();
      handle.current?.dispose();
      handle.current = null;
    };
  }, [stageRef]);

  useEffect(() => {
    const stage = stageRef.current;
    const canvas = canvasRef.current;
    if (!stage || !canvas) return;
    const place = () => {
      const r = stage.getBoundingClientRect();
      const size = Math.min(r.width, r.height);
      const left = r.left + (r.width - size) / 2;
      const top = r.top + (r.height - size) / 2;
      canvas.style.left = `${left}px`;
      canvas.style.top = `${top}px`;
      canvas.style.width = `${size}px`;
      canvas.style.height = `${size}px`;
      setPlaced(true);
      handle.current?.resize();
    };
    place();
    window.addEventListener("scroll", place, { passive: true });
    window.addEventListener("resize", place);
    return () => {
      window.removeEventListener("scroll", place);
      window.removeEventListener("resize", place);
    };
  }, [stageRef]);

  useEffect(() => {
    boot.current.theme = theme;
    handle.current?.setTheme(theme);
  }, [theme]);
  useEffect(() => {
    boot.current.orbMode = orbMode;
    handle.current?.setMode(orbMode);
  }, [orbMode]);
  useEffect(() => {
    boot.current.reduced = reduced;
    handle.current?.setReduced(reduced);
  }, [reduced]);
  useEffect(() => {
    const hero = document.getElementById("top");
    if (!hero) return;
    const io = new IntersectionObserver(
      (entries) => handle.current?.setActive(entries.some((e) => e.isIntersecting)),
      { threshold: 0.05 },
    );
    io.observe(hero);
    return () => io.disconnect();
  }, []);

  if (failed) {
    return (
      <div className="grid h-full place-items-center" aria-hidden>
        <NeuralMark className="h-40 w-40" />
      </div>
    );
  }

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none fixed z-[5]"
      style={{ visibility: placed ? "visible" : "hidden" }}
      aria-hidden
    />
  );
}
