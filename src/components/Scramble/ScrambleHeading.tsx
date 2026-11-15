import {
  useEffect,
  useMemo,
  useRef,
  type ElementType,
  type HTMLAttributes,
} from "react";

const GLYPHS = "#/8}~%*01<>_[]=+";

type Props<T extends ElementType = "h2"> = {
  text: string;
  as?: T;
  /** Старт только после лоадера (hero). */
  start?: boolean;
  /** Каретка сразу после последнего символа (только hero). */
  caret?: boolean;
  className?: string;
} & Omit<HTMLAttributes<HTMLElement>, "children">;

const DURATION = 820;
const SPREAD = 0.62;

/**
 * Расшифровка заголовка.
 *
 * Разметка сразу совпадает с финальной (слова → символы), поэтому пререндер,
 * гидрация и layout не меняются. Ширина каждого символа фиксируется по
 * финальному глифу после document.fonts.ready — заголовок не «дышит».
 * Анимация пишет textContent напрямую в rAF, без setState на каждом тике.
 */
export function ScrambleHeading<T extends ElementType = "h2">({
  text,
  as,
  start = true,
  caret = false,
  className = "",
  ...props
}: Props<T>) {
  const Tag = (as ?? "h2") as ElementType;
  const rootRef = useRef<HTMLElement>(null);
  const words = useMemo(() => text.split(" "), [text]);
  const played = useRef(false);

  useEffect(() => {
    played.current = false;
    const root = rootRef.current;
    if (!root || !start) return;

    const chars = Array.from(root.querySelectorAll<HTMLElement>(".scramble-char"));
    if (!chars.length) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      root.classList.add("is-done");
      return;
    }

    let raf = 0;
    let io: IntersectionObserver | null = null;
    let timer = 0;

    const run = () => {
      if (played.current) return;
      played.current = true;

      // 1) фиксируем ширины всех символов (одна пачка чтений)
      const widths = chars.map((el) => el.getBoundingClientRect().width);
      // 2) пишем стили (одна пачка записей) — layout не прыгает
      chars.forEach((el, i) => {
        el.style.width = `${widths[i].toFixed(2)}px`;
        el.classList.add("is-pending");
      });

      const finals = chars.map((el) => el.textContent ?? "");
      // детерминированный «разброс» фиксации, без Math.random в кадре
      const jitter = chars.map((_, i) => ((i * 2654435761) % 1000) / 1000);
      const total = chars.length;
      const startAt = performance.now();
      let frame = 0;

      const step = (now: number) => {
        const t = now - startAt;
        for (let i = 0; i < total; i++) {
          const lockAt = (i / Math.max(1, total)) * DURATION * SPREAD + jitter[i] * 90;
          const el = chars[i];
          if (t >= lockAt) {
            if (el.classList.contains("is-pending")) {
              el.classList.remove("is-pending");
              el.textContent = finals[i];
            }
          } else {
            const glyph = GLYPHS[Math.floor((now / 34 + i * 3) % GLYPHS.length)];
            if (el.textContent !== glyph) el.textContent = glyph;
          }
        }
        if (t < DURATION + 120) {
          frame = requestAnimationFrame(step);
        } else {
          for (let i = 0; i < total; i++) {
            chars[i].classList.remove("is-pending");
            chars[i].textContent = finals[i];
          }
          root.classList.add("is-done");
        }
      };
      frame = requestAnimationFrame(step);
      raf = frame;
    };

    const begin = () => {
      // шрифт нужен для точных ширин; ждём его, но не дольше 400 мс
      let done = false;
      const kick = () => {
        if (done) return;
        done = true;
        run();
      };
      timer = window.setTimeout(kick, 400);
      document.fonts.ready.then(kick).catch(kick);
    };

    const threshold = 0.4;
    io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        io?.disconnect();
        begin();
      },
      { threshold },
    );
    // уже в кадре при загрузке (hero после лоадера) — запускаем без ожидания скролла
    const rect = root.getBoundingClientRect();
    if (rect.top < window.innerHeight * 0.8 && rect.bottom > 0) {
      begin();
    } else {
      io.observe(root);
    }

    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(timer);
      io?.disconnect();
    };
  }, [text, start]);

  let index = 0;

  return (
    <Tag
      ref={rootRef}
      className={`scramble ${className}`}
      aria-label={text}
      {...props}
    >
      <span className="scramble__text" aria-hidden>
        {words.map((word, wi) => (
          <span key={`${word}-${wi}`}>
            {wi > 0 && " "}
            <span className="scramble-word">
              {Array.from(word).map((char) => {
                const i = index;
                index += 1;
                return (
                  <span key={i} className="scramble-char">
                    {char}
                  </span>
                );
              })}
              {caret && wi === words.length - 1 && (
                <span className="hero-caret-inline" data-caret aria-hidden />
              )}
            </span>
          </span>
        ))}
      </span>
    </Tag>
  );
}
