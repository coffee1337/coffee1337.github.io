import { useEffect, useRef, useState, type ElementType, type HTMLAttributes } from "react";

const GLYPHS = "#/8}~%*01<>_[]=+";

type Props<T extends ElementType = "h2"> = {
  text: string;
  as?: T;
  speed?: number;
  stagger?: number;
} & Omit<HTMLAttributes<HTMLElement>, "children">;

export function ScrambleHeading<T extends ElementType = "h2">({
  text,
  as,
  speed = 35,
  stagger = 25,
  className = "",
  ...props
}: Props<T>) {
  const Tag = (as ?? "h2") as ElementType;
  const rootRef = useRef<HTMLElement>(null);
  const [display, setDisplay] = useState(text);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    const node = rootRef.current;
    if (!node || started) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      setStarted(true);
      setDisplay(text);
      return;
    }
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      observer.disconnect();
      setStarted(true);
      const chars = Array.from(text);
      let tick = 0;
      const totalTicks = Math.max(18, Math.ceil((600 + chars.length * stagger) / speed));
      const timer = window.setInterval(() => {
        tick += 1;
        setDisplay(chars.map((char, index) => {
          const lockAt = Math.floor(index * (stagger / speed)) + Math.floor(totalTicks * 0.45);
          return tick >= lockAt ? char : GLYPHS[(tick + index * 3) % GLYPHS.length];
        }).join(""));
        if (tick >= totalTicks) {
          window.clearInterval(timer);
          setDisplay(text);
        }
      }, speed);
    }, { threshold: 0.4 });
    observer.observe(node);
    return () => observer.disconnect();
  }, [started, text, speed, stagger]);

  useEffect(() => {
    if (!started) return;
    setDisplay(text);
  }, [text, started]);

  return (
    <Tag ref={rootRef} className={`relative ${className}`} aria-label={text} {...props}>
      <span aria-hidden="true" className="invisible">{text}</span>
      <span aria-hidden="true" className="absolute inset-0">{display}</span>
    </Tag>
  );
}
