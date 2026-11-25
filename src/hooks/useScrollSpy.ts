import { useEffect } from "react";
import { useSite } from "../context/site";

const IDS = ["top", "about", "education", "stack", "capabilities", "projects", "certificates", "resume", "experience", "contact"];

/** Общая блокировка для Header и CommandPalette: якорь из меню не должен сразу перебиваться скроллспаем. */
let sharedLockUntil = 0;

/** Active section is the one containing a line just below the header. */
export function useScrollSpy() {
  const { setSection, loaderDone } = useSite();

  useEffect(() => {
    if (!loaderDone) return;
    let frame = 0;
    const measure = () => {
      frame = 0;
      if (performance.now() < sharedLockUntil) return;
      const line = 88 + window.innerHeight * 0.28;
      // Вложенные блоки (#education в About, #capabilities в Stack, #experience в Resume)
      // начинаются ниже обёртки — побеждает самый нижний старт выше линии.
      let current = IDS[0];
      let bestTop = -Infinity;
      for (const id of IDS) {
        const el = document.getElementById(id);
        if (!el) continue;
        const rect = el.getBoundingClientRect();
        if (rect.top <= line && rect.top >= bestTop) {
          current = id;
          bestTop = rect.top;
        }
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
      sharedLockUntil = performance.now() + 700;
    },
  };
}
