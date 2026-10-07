import { useEffect, useRef } from "react";
import { useSite } from "../context/site";

const COARSE = window.matchMedia("(pointer: coarse)");

export function useReveal<T extends HTMLElement>(options?: { y?: number; delay?: number; stagger?: number }) {
  const ref = useRef<T>(null);
  const { reduced, loaderDone } = useSite();

  useEffect(() => {
    const el = ref.current;
    if (!el || !loaderDone) return;
    const targets = el.querySelectorAll<HTMLElement>("[data-reveal]");
    const nodes = targets.length ? Array.from(targets) : [el];

    if (reduced) {
      nodes.forEach((n) => {
        n.style.opacity = "1";
        n.style.transform = "none";
      });
      return;
    }

    nodes.forEach((n) => {
      n.style.opacity = "0";
      n.style.transform = `translateY(${options?.y ?? 24}px)`;
    });

    let ctx: { revert: () => void } | null = null;
    let dead = false;

    void import("gsap").then(({ default: gsap }) => {
      if (dead) return;
      void import("gsap/ScrollTrigger").then(({ ScrollTrigger }) => {
        if (dead) return;
        gsap.registerPlugin(ScrollTrigger);
        ctx = gsap.context(() => {
          gsap.to(nodes, {
            opacity: 1,
            y: 0,
            duration: 0.85,
            ease: "power3.out",
            stagger: options?.stagger ?? 0.07,
            delay: options?.delay ?? 0,
            scrollTrigger: { trigger: el, start: "top 88%", once: true },
          });
        }, el);
      });
    });

    return () => {
      dead = true;
      ctx?.revert();
    };
  }, [loaderDone, reduced, options?.y, options?.delay, options?.stagger]);

  return ref;
}

export function useMagnetic<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const { reduced } = useSite();

  useEffect(() => {
    const el = ref.current;
    if (!el || reduced || COARSE.matches) return;
    const onMove = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      const x = e.clientX - (r.left + r.width / 2);
      const y = e.clientY - (r.top + r.height / 2);
      el.style.transform = `translate(${x * 0.08}px, ${y * 0.12}px)`;
    };
    const reset = () => {
      el.style.transform = "";
    };
    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerleave", reset);
    return () => {
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerleave", reset);
    };
  }, [reduced]);

  return ref;
}
