import { useEffect, useRef } from "react";
import { useSite } from "../context/site";

const IDS = ["top", "about", "capabilities", "experience", "projects", "stack", "resume", "contact"];

/** Active section is the one containing a line just below the header. */
export function useScrollSpy() {
  const { setSection, loaderDone } = useSite();
  const lock = useRef(0);

  useEffect(() => {
    if (!loaderDone) return;
    let frame = 0;
    const measure = () => {
      frame = 0;
      if (performance.now() < lock.current) return;
      const line = 88 + window.innerHeight * 0.28;
      let current = IDS[0];
      for (const id of IDS) {
        const el = document.getElementById(id);
        if (!el) continue;
        const rect = el.getBoundingClientRect();
        if (rect.top <= line && rect.bottom > line) {
          current = id;
          break;
        }
        if (rect.top <= line) current = id;
      }
      setSection(current);
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(measure);
    };
    measure();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [loaderDone, setSection]);

  return {
    lockUntilSettled: () => {
      lock.current = performance.now() + 700;
    },
  };
}
