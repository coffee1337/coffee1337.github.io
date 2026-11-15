import {
  useEffect,
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
 * В разметке (и в пререндере) — обычный текст: гидрация без расхождений и без
 * лишних узлов. Символы нарезаются в DOM только в момент старта анимации,
 * ширина каждой ячейки фиксируется по финальному глифу после document.fonts.ready.
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
  const played = useRef(false);

  useEffect(() => {
    played.current = false;
    const root = rootRef.current;
    if (!root || !start) return;
    const holder = root.querySelector<HTMLElement>(".scramble__text");
    if (!holder) return;

    root.classList.remove("is-done");

    /** Финальный вид: обычный текст (резиновый при ресайзе) + каретка. */
    const renderPlain = () => {
      holder.textContent = text;
      if (caret) {
        const sign = document.createElement("span");
        sign.className = "hero-caret-inline";
        sign.setAttribute("data-caret", "");
        holder.appendChild(sign);
      }
    };

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      renderPlain();
      root.classList.add("is-done");
      return;
    }

    let raf = 0;
    let io: IntersectionObserver | null = null;
    let timer = 0;

    const run = () => {
      if (played.current) return;
      played.current = true;

      // Нарезаем текст на слова/символы ровно один раз, в момент старта.
      holder.textContent = "";
      const chars: HTMLElement[] = [];
      const words = text.split(" ");
      words.forEach((word, wi) => {
        if (wi > 0) holder.appendChild(document.createTextNode(" "));
        const wordEl = document.createElement("span");
        wordEl.className = "scramble-word";
        for (const char of Array.from(word)) {
          const cell = document.createElement("span");
          cell.className = "scramble-char";
          cell.textContent = char;
          wordEl.appendChild(cell);
          chars.push(cell);
        }
        if (caret && wi === words.length - 1) {
          const sign = document.createElement("span");
          sign.className = "hero-caret-inline";
          sign.setAttribute("data-caret", "");
          wordEl.appendChild(sign);
        }
        holder.appendChild(wordEl);
      });

      // 1) фиксируем размеры всех символов (одна пачка чтений)
      const boxes = chars.map((el) => {
        const rect = el.getBoundingClientRect();
        return { width: rect.width, height: rect.height };
      });
      // 2) пишем стили и случайные глифы (одна пачка записей) — layout не прыгает
      const finals = chars.map((el) => el.textContent ?? "");
      const jitter = chars.map((_, i) => ((i * 2654435761) % 1000) / 1000);
      chars.forEach((el, i) => {
        el.style.width = `${boxes[i].width.toFixed(2)}px`;
        // Высота фиксируется тоже: overflow:hidden на inline-block меняет baseline
        // и строка «дышит» на несколько пикселей во время анимации.
        el.style.height = `${boxes[i].height.toFixed(2)}px`;
        el.classList.add("is-pending");
        el.textContent = GLYPHS[i % GLYPHS.length];
      });

      const total = chars.length;
      const startAt = performance.now();

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
          raf = requestAnimationFrame(step);
        } else {
          for (let i = 0; i < total; i++) {
            chars[i].classList.remove("is-pending");
            chars[i].textContent = finals[i];
          }
          // Снимаем фиксированные ширины: дальше заголовок живёт как обычный текст
          // и корректно пере-flow'ится при ресайзе, выделяется и копируется.
          renderPlain();
          root.classList.add("is-done");
        }
      };
      raf = requestAnimationFrame(step);
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

    io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        io?.disconnect();
        begin();
      },
      { threshold: 0.4 },
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
      // Если размонтировали/перезапустили посреди анимации — в DOM не должно
      // остаться случайных символов и фиксированных ширин.
      if (played.current) {
        renderPlain();
        root.classList.add("is-done");
      }
    };
  }, [text, start, caret]);

  return (
    <Tag ref={rootRef} className={`scramble ${className}`} {...props}>
      {/* Настоящий текст всегда в DOM: его читают скринридеры, поисковики и AI-парсеры. */}
      <span className="sr-only">{text}</span>
      <span className="scramble__text" aria-hidden>
        {text}
      </span>
    </Tag>
  );
}
