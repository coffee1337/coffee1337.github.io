import { useCallback, useEffect, useRef, useState } from "react";
import { useSite } from "../../context/site";
import { useScrollLock } from "../../hooks/useScrollLock";
import { BRAND, createLoaderScene } from "../../loader/scene";
import { markLoaderDone, trackEvent } from "../../analytics";

const VISIT_KEY = "et-seen";

/** Первый визит: символы → coffee1337 → сайт. */
const FULL_MS = 1100;
/** Повторный визит в сессии: короткий reveal. */
const SHORT_MS = 600;
/** prefers-reduced-motion: статичный ник и fade. */
const REDUCED_MS = 400;

/** Доля сюжета, на которой поднимается шторка (совпадает с фазой OUT сцены). */
const WIPE_AT = 0.8;
/** Доля сюжета, на которой вызывается onDone. */
const DONE_AT = 0.9;

function seenThisSession(): boolean {
  try {
    return sessionStorage.getItem(VISIT_KEY) === "1";
  } catch {
    return false;
  }
}

/** Прогресс-бар привязан к фазам сюжета, а не к «сколько нарисовалось». */
function progressAt(u: number): number {
  if (u <= 0) return 0;
  if (u < 0.2) return 8 * (u / 0.2);
  if (u < 0.55) return 8 + 64 * ((u - 0.2) / 0.35);
  if (u < 0.8) return 72 + 18 * ((u - 0.55) / 0.25);
  return Math.min(100, 90 + 10 * ((u - 0.8) / 0.2));
}

export function Loader({ onDone }: { onDone: () => void }) {
  const { dict, reduced, lowPower } = useSite();
  useScrollLock(true);

  /**
   * Длительность фиксируется на монтировании: finish() пишет et-seen, и без
   * кэша следующий же ре-рендер пересчитал бы сюжет на короткую версию.
   */
  const [duration] = useState(() =>
    reduced ? REDUCED_MS : seenThisSession() ? SHORT_MS : FULL_MS,
  );
  /** Для elapsed_ms в событии loader — фиксируется на монтировании. */
  const [mountedAt] = useState(() => performance.now());

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const barRef = useRef<HTMLDivElement>(null);
  const pctRef = useRef<HTMLSpanElement>(null);
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;

  const [leaving, setLeaving] = useState(false);
  const [logCount, setLogCount] = useState(() => (reduced ? dict.loader.lines.length : 0));
  const [tokensOn, setTokensOn] = useState(reduced);

  /** Идемпотентный финал: снимает оверлей ровно один раз при любом сценарии. */
  const finishedRef = useRef(false);
  const finish = useCallback((instant: boolean) => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    // instant = клик/клавиша/Skip; иначе сюжет дошёл до конца сам.
    trackEvent("loader", {
      action: instant ? "skip" : "complete",
      elapsed_ms: Math.round(performance.now() - mountedAt),
    });
    markLoaderDone();
    setLeaving(true);
    try {
      sessionStorage.setItem(VISIT_KEY, "1");
    } catch {
      /* private mode */
    }
    window.setTimeout(() => onDoneRef.current(), instant ? 120 : 0);
  }, [mountedAt]);

  const lines = dict.loader.lines;
  const tokens = dict.loader.tokens;

  // #boot живёт до первого отрисованного кадра лоадера: два rAF гарантируют,
  // что пререндер уже закрыт, а пользователь не видит мигания страницы.
  useEffect(() => {
    let first = 0;
    let second = 0;
    first = window.requestAnimationFrame(() => {
      second = window.requestAnimationFrame(() => {
        document.documentElement.classList.add("boot-done");
        document.getElementById("boot")?.remove();
      });
    });
    return () => {
      window.cancelAnimationFrame(first);
      window.cancelAnimationFrame(second);
    };
  }, []);

  // Сцена: монтирование/снятие, пауза в скрытой вкладке, смена темы.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const scene = createLoaderScene(canvas, {
      name: BRAND,
      reduced,
      lowPower,
      duration,
    });

    // Первый кадр — сразу, чтобы canvas был непустым ещё до rAF: под #boot
    // не должно быть пустого прямоугольника даже один кадр.
    scene.frame(0);

    const subscribeTheme = () => {
      scene.setTheme();
      // Static (reduced) frame: repaint once the palette fade has landed.
      if (reduced) window.setTimeout(() => scene.frame(0), 420);
    };
    window.addEventListener("themechange", subscribeTheme);

    const onResize = () => scene.resize();
    window.addEventListener("resize", onResize);

    let raf = 0;
    let stopped = false;
    let paused = false;
    let pausedAt = 0;
    let offset = 0;
    let wipeStarted = false;
    let shownLog = -1;
    let latestPct = -1;
    let tokensShown = false;
    const startedAt = performance.now();

    const paintChrome = (u: number) => {
      const pct = progressAt(u);
      if (barRef.current) barRef.current.style.transform = `scaleX(${(pct / 100).toFixed(4)})`;
      const rounded = Math.round(pct);
      if (rounded !== latestPct) {
        latestPct = rounded;
        if (pctRef.current) pctRef.current.textContent = `${rounded}%`;
      }
      const want = Math.min(lines.length, Math.max(0, Math.floor((u - 0.21) / 0.055) + 1));
      if (want !== shownLog) {
        shownLog = want;
        setLogCount(want);
      }
      if (!tokensShown && u > 0.47) {
        tokensShown = true;
        setTokensOn(true);
      }
    };

    const tick = (now: number) => {
      raf = 0;
      if (stopped || finishedRef.current) return;
      const elapsed = now - startedAt - offset;
      const u = Math.min(1, Math.max(0, elapsed / duration));
      scene.frame(elapsed);
      paintChrome(u);
      if (!wipeStarted && u >= WIPE_AT) {
        wipeStarted = true;
        setLeaving(true);
      }
      if (u >= DONE_AT) {
        stopped = true;
        finish(false);
        return;
      }
      raf = window.requestAnimationFrame(tick);
    };

    if (reduced) {
      // Статичный кадр без частиц уже нарисован выше; дальше только таймер.
      const timer = window.setTimeout(() => finish(false), REDUCED_MS);
      return () => {
        window.clearTimeout(timer);
        window.removeEventListener("themechange", subscribeTheme);
        window.removeEventListener("resize", onResize);
        scene.dispose();
      };
    }

    const onVisibility = () => {
      if (stopped || finishedRef.current) return;
      if (document.hidden) {
        if (paused) return;
        paused = true;
        pausedAt = performance.now();
        window.cancelAnimationFrame(raf);
        raf = 0;
        return;
      }
      if (!paused) return;
      paused = false;
      offset += performance.now() - pausedAt;
      raf = window.requestAnimationFrame(tick);
    };
    document.addEventListener("visibilitychange", onVisibility);

    raf = window.requestAnimationFrame(tick);

    return () => {
      stopped = true;
      window.cancelAnimationFrame(raf);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("themechange", subscribeTheme);
      window.removeEventListener("resize", onResize);
      scene.dispose();
    };
  }, [duration, finish, lines, lowPower, reduced]);

  // Пропуск: кнопка и только Esc/Enter/клик мышью — не «любая клавиша».
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.repeat) return;
      if (event.key !== "Escape" && event.key !== "Enter") return;
      event.preventDefault();
      finish(true);
    };
    const onPointer = (event: PointerEvent) => {
      const target = event.target as HTMLElement | null;
      if (target?.closest("[data-loader-skip]")) return;
      finish(true);
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("pointerdown", onPointer, { passive: true });
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("pointerdown", onPointer);
    };
  }, [finish]);

  return (
    <div
      className={`loader-screen loader-shell${leaving ? " is-leaving" : ""}`}
      role="status"
      aria-live="polite"
      aria-label={dict.loader.forming}
    >
      <canvas ref={canvasRef} className="loader-canvas" aria-hidden="true" />
      <div className="loader-hud">
        <div className="loader-log">
          {lines.slice(0, logCount).map((line, index) => (
            <div className="loader-log-line" key={index}>
              {line}
            </div>
          ))}
        </div>
        <div className="loader-meta">
          <div className="loader-tokens" data-on={tokensOn ? "true" : "false"} aria-hidden="true">
            {tokens.map((token, index) => (
              <span key={index}>{token}</span>
            ))}
          </div>
          <div className="loader-bar-row">
            <span className="loader-label">{dict.loader.forming}</span>
            <div className="loader-bar" aria-hidden="true">
              <div
                ref={barRef}
                className="loader-bar-fill"
                style={{ transform: reduced ? "scaleX(1)" : "scaleX(0)" }}
              />
            </div>
            <span ref={pctRef} className="loader-pct">
              {reduced ? "100%" : "0%"}
            </span>
          </div>
        </div>
      </div>
      <button
        type="button"
        data-loader-skip="true"
        className="loader-skip"
        onClick={() => finish(true)}
      >
        {dict.loader.skip}
      </button>
    </div>
  );
}
