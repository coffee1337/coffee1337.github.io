/**
 * Сцена вступительного экрана: созвездие моно-глифов, которое собирает
 * бренд-ник, держит его под световым импульсом и рассыпается в страницу.
 *
 * Правила фазы 10, зашитые в архитектуру:
 *  — палитра читается из CSS только в layout()/setTheme(), никогда в кадре;
 *  — никакого Math.random: детерминированный mulberry32 с фиксированным seed;
 *  — в frame() не создаются массивы (все буферы аллоцируются в layout());
 *  — ctx.font ставится только в layout(), в кадре строка шрифта не трогается;
 *  — сцена не держит ни rAF, ни слушателей: их жизненным циклом владеет React.
 */

/** Бренд-ник одинаков в обеих локалях, поэтому это не строка словаря. */
export const BRAND = "coffee1337";

export interface SceneOptions {
  /** Текст, который собирают глифы. */
  name: string;
  /** prefers-reduced-motion: статичный кадр без частиц. */
  reduced: boolean;
  /** Слабое железо: меньше глифов. */
  lowPower: boolean;
  /** Полная длительность сюжета в мс (нужна для долей фаз). */
  duration: number;
}

export interface LoaderScene {
  /** Отрисовать кадр; elapsed — мс с запуска сюжета. */
  frame(elapsed: number): void;
  /** Пересчитать размеры и точки-цели (вызывается на resize). */
  resize(): void;
  /** Перечитать палитру после themechange и плавно перейти к ней. */
  setTheme(): void;
  dispose(): void;
}

/* ── Фазы сюжета в долях длительности ─────────────────────────────────────── */
const P_IN = 0.2; // шум: глифы выплывают
const P_FORM = 0.55; // сборка в ник
const P_HOLD = 0.8; // ник держится, идёт импульс
/* 0.8 … 1 — разлёт частиц; шторку в этот момент поднимает компонент. */

/** Индексы палитры внутри Float32Array по три канала на цвет:
 *  0 --bg, 1 --ink, 2 --ink-dim, 3 --ink-faint, 4 --accent, 5 --accent-2. */
const BG = 0;
const INK = 1;
const ACCENT = 4;
const ACCENT2 = 5;
const PALETTE_VARS = ["--bg", "--ink", "--ink-dim", "--ink-faint", "--accent", "--accent-2"] as const;

/** Аварийная палитра, если CSS-переменные недоступны (пререндер/старые браузеры). */
const FALLBACK: ReadonlyArray<readonly [number, number, number]> = [
  [12, 10, 9],
  [243, 239, 232],
  [163, 157, 148],
  [127, 121, 114],
  [196, 86, 42],
  [217, 160, 102],
];

/** Набор моно-знаков: на мелком кегле читаются как плотная матрица. */
const GLYPHS = "·+×·|·:·";

const THEME_FADE = 400;

type Rgb = readonly [number, number, number];

function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), 1 | t);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function clamp(v: number, lo: number, hi: number): number {
  return v < lo ? lo : v > hi ? hi : v;
}

function smoothstep(x: number): number {
  const t = clamp(x, 0, 1);
  return t * t * (3 - 2 * t);
}

function easeOutCubic(x: number): number {
  const t = 1 - clamp(x, 0, 1);
  return 1 - t * t * t;
}

function parseColor(raw: string, fallback: Rgb): Rgb {
  const value = raw.trim();
  if (!value) return fallback;
  if (value.charCodeAt(0) === 35) {
    let hex = value.slice(1);
    if (hex.length === 3 || hex.length === 4) {
      hex =
        hex.charAt(0) + hex.charAt(0) + hex.charAt(1) + hex.charAt(1) + hex.charAt(2) + hex.charAt(2);
    }
    if (hex.length < 6) return fallback;
    const n = Number.parseInt(hex.slice(0, 6), 16);
    if (!Number.isFinite(n)) return fallback;
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }
  const match = /rgba?\(([^)]+)\)/i.exec(value);
  if (match) {
    const parts = match[1].split(/[\s,/]+/);
    if (parts.length >= 3) {
      const r = Number.parseFloat(parts[0]);
      const g = Number.parseFloat(parts[1]);
      const b = Number.parseFloat(parts[2]);
      if (Number.isFinite(r) && Number.isFinite(g) && Number.isFinite(b)) {
        return [r & 255, g & 255, b & 255];
      }
    }
  }
  return fallback;
}

function emptyScene(): LoaderScene {
  return { frame: () => {}, resize: () => {}, setTheme: () => {}, dispose: () => {} };
}

export function createLoaderScene(canvas: HTMLCanvasElement, options: SceneOptions): LoaderScene {
  const maybeCtx = canvas.getContext("2d");
  if (!maybeCtx) return emptyScene();
  const ctx: CanvasRenderingContext2D = maybeCtx;

  const name = options.name;
  const reduced = options.reduced;
  const lowPower = options.lowPower;
  const duration = Math.max(1, options.duration);

  let disposed = false;
  let dpr = 1;
  let vw = 0;
  let vh = 0;

  let monoFamily = "ui-monospace, monospace";
  let wordFont = "";
  let glyphFont = "";
  let fontPx = 96;
  let wordW = 0;
  let wordH = 0;
  let wordX = 0;
  let wordY = 0;
  let lastElapsed = 0;

  /* Глифы: плоские типизированные буферы, пересоздаются только в layout(). */
  let count = 0;
  let tx = new Float32Array(0);
  let ty = new Float32Array(0);
  let sx = new Float32Array(0);
  let sy = new Float32Array(0);
  let phase = new Float32Array(0);
  let vx = new Float32Array(0);
  let vy = new Float32Array(0);
  let charSeed = new Int32Array(0);
  let stable = new Uint8Array(0);
  let tone = new Uint8Array(0);

  const palette = new Float32Array(18);
  const paletteFrom = new Float32Array(18);
  const paletteTo = new Float32Array(18);
  const colors: string[] = new Array(6).fill("rgb(0, 0, 0)");
  let themeAt = 0;
  let theming = false;

  const wordCanvas = document.createElement("canvas");
  const maskCanvas = document.createElement("canvas");

  function buildColors(): void {
    for (let i = 0; i < 6; i++) {
      const r = palette[i * 3] | 0;
      const g = palette[i * 3 + 1] | 0;
      const b = palette[i * 3 + 2] | 0;
      colors[i] = `rgb(${r}, ${g}, ${b})`;
    }
  }

  function readPalette(): void {
    const styles = getComputedStyle(document.documentElement);
    for (let i = 0; i < 6; i++) {
      const rgb = parseColor(styles.getPropertyValue(PALETTE_VARS[i]), FALLBACK[i]);
      paletteTo[i * 3] = rgb[0];
      paletteTo[i * 3 + 1] = rgb[1];
      paletteTo[i * 3 + 2] = rgb[2];
    }
  }

  readPalette();
  palette.set(paletteTo);
  buildColors();

  function stepTheme(now: number): void {
    if (!theming) return;
    const p = clamp((now - themeAt) / THEME_FADE, 0, 1);
    const e = p * p * (3 - 2 * p);
    for (let i = 0; i < 18; i++) palette[i] = paletteFrom[i] + (paletteTo[i] - paletteFrom[i]) * e;
    buildColors();
    if (p >= 1) {
      theming = false;
      drawGhost();
    }
  }

  /** Перерисовать «призрак» слова в текущем цвете чернил (drawImage в кадре). */
  function drawGhost(): void {
    const gctx = wordCanvas.getContext("2d");
    if (!gctx) return;
    gctx.clearRect(0, 0, wordW, wordH);
    gctx.font = wordFont;
    gctx.textAlign = "center";
    gctx.textBaseline = "middle";
    gctx.fillStyle = colors[INK];
    gctx.fillText(name, wordW / 2, wordH / 2);
  }

  /**
   * Рисует слово в маску и сэмплирует пиксели: точки становятся целями глифов.
   * Всё, что здесь аллоцируется, живёт вне кадра — только layout/resize.
   */
  function sampleWord(): void {
    const mctx = maskCanvas.getContext("2d", { willReadFrequently: true });
    if (!mctx) {
      count = 0;
      return;
    }
    maskCanvas.width = wordW;
    maskCanvas.height = wordH;
    mctx.font = wordFont;
    mctx.textAlign = "center";
    mctx.textBaseline = "middle";
    mctx.fillStyle = "#fff";
    mctx.fillText(name, wordW / 2, wordH / 2);

    const data = mctx.getImageData(0, 0, wordW, wordH).data;
    const base = 3;
    let inked = 0;
    for (let y = base; y < wordH; y += base) {
      const row = y * wordW;
      for (let x = base; x < wordW; x += base) {
        if (data[(row + x) * 4 + 3] > 140) inked++;
      }
    }
    if (inked < 24) {
      count = 0;
      return;
    }

    const target = lowPower ? 220 : vw < 720 ? 280 : 380;
    const step = Math.max(3, base * Math.sqrt(inked / target));
    const xs: number[] = [];
    const ys: number[] = [];
    for (let y = step * 0.5; y < wordH; y += step) {
      const row = y * wordW;
      for (let x = step * 0.5; x < wordW; x += step) {
        if (data[(Math.floor(row) + Math.floor(x)) * 4 + 3] > 140) {
          xs.push(x);
          ys.push(y);
        }
      }
    }

    count = xs.length;
    if (count === 0) return;
    tx = new Float32Array(count);
    ty = new Float32Array(count);
    sx = new Float32Array(count);
    sy = new Float32Array(count);
    phase = new Float32Array(count);
    vx = new Float32Array(count);
    vy = new Float32Array(count);
    charSeed = new Int32Array(count);
    stable = new Uint8Array(count);
    tone = new Uint8Array(count);

    const rnd = mulberry32(0x1337c0de);
    const cx = wordX + wordW / 2;
    const cy = wordY + wordH / 2;
    const spread = Math.hypot(vw, vh) * 0.5;
    const glyphSize = clamp(step * 0.92, 4.5, 11);
    glyphFont = `500 ${glyphSize.toFixed(2)}px ${monoFamily}`;

    for (let i = 0; i < count; i++) {
      tx[i] = wordX + xs[i];
      ty[i] = wordY + ys[i];
      const angle = rnd() * Math.PI * 2;
      const radius = (0.16 + rnd() * 0.44) * spread;
      sx[i] = clamp(cx + Math.cos(angle) * radius, 6, vw - 6);
      sy[i] = clamp(cy + Math.sin(angle) * radius * 0.62, 6, vh - 6);
      phase[i] = rnd() * Math.PI * 2;
      charSeed[i] = (rnd() * 1024) | 0;
      stable[i] = (rnd() * GLYPHS.length) | 0;
      const pick = rnd();
      tone[i] = pick > 0.94 ? 2 : pick > 0.84 ? 1 : 0;
      vx[i] = (rnd() - 0.5) * 1.9 * vw * 0.4;
      vy[i] = (rnd() - 0.62) * 1.8 * vh * 0.45;
    }
  }

  function layout(): void {
    if (disposed) return;
    vw = canvas.clientWidth || window.innerWidth;
    vh = canvas.clientHeight || window.innerHeight;
    dpr = Math.min(2, window.devicePixelRatio || 1);
    const pixelW = Math.round(vw * dpr);
    const pixelH = Math.round(vh * dpr);
    if (canvas.width !== pixelW) canvas.width = pixelW;
    if (canvas.height !== pixelH) canvas.height = pixelH;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    monoFamily =
      getComputedStyle(document.documentElement).getPropertyValue("--font-mono").trim() ||
      "ui-monospace, monospace";

    const maxWidth = Math.min(vw * 0.82, 920);
    const probe = 120;
    ctx.font = `700 ${probe}px ${monoFamily}`;
    const measured = ctx.measureText(name).width || probe * name.length * 0.6;
    fontPx = clamp((probe * maxWidth) / measured, 22, 190);
    wordFont = `700 ${fontPx.toFixed(2)}px ${monoFamily}`;
    ctx.font = wordFont;

    const textW = ctx.measureText(name).width;
    const padX = Math.ceil(fontPx * 0.16);
    wordW = Math.ceil(textW) + padX * 2;
    wordH = Math.ceil(fontPx * 1.34);
    wordX = Math.round((vw - wordW) / 2);
    wordY = Math.round(vh * 0.46 - wordH / 2);

    wordCanvas.width = wordW;
    wordCanvas.height = wordH;

    if (reduced) {
      count = 0;
      glyphFont = `500 10px ${monoFamily}`;
      drawGhost();
      return;
    }

    sampleWord();
    drawGhost();
    if (count === 0) {
      glyphFont = `500 10px ${monoFamily}`;
      return;
    }
    // Шрифт глифов ставится один раз здесь: в кадре ctx.font не меняется.
    ctx.font = glyphFont;
  }

  layout();

  // Моно-шрифт может доехать позже первого кадра: тогда сэмплируем заново.
  let fontsRefreshed = false;
  const refreshFromFonts = (): void => {
    if (disposed || fontsRefreshed) return;
    fontsRefreshed = true;
    if (lastElapsed < duration * 0.35) layout();
  };
  if (typeof document !== "undefined" && document.fonts) {
    const family = monoFamily.split(",")[0].trim();
    document.fonts.load(`700 16px ${family}`).then(refreshFromFonts, () => {});
    document.fonts.ready.then(refreshFromFonts, () => {});
  }

  function frame(elapsed: number): void {
    if (disposed) return;
    lastElapsed = elapsed;
    stepTheme(performance.now());

    ctx.clearRect(0, 0, vw, vh);
    ctx.fillStyle = colors[BG];
    ctx.fillRect(0, 0, vw, vh);

    if (wordW <= 0) return;

    if (reduced || count === 0) {
      ctx.globalAlpha = 1;
      ctx.drawImage(wordCanvas, wordX, wordY);
      return;
    }

    const u = clamp(elapsed / duration, 0, 1);
    const formP = clamp((u - P_IN) / (P_FORM - P_IN), 0, 1);
    const holdP = clamp((u - P_FORM) / (P_HOLD - P_FORM), 0, 1);
    const outP = clamp((u - P_HOLD) / (1 - P_HOLD), 0, 1);
    const scatter = outP * outP;

    const ghost = 0.1 * smoothstep((u - 0.34) / 0.22) * (1 - outP);
    if (ghost > 0.004) {
      ctx.globalAlpha = ghost;
      ctx.drawImage(wordCanvas, wordX, wordY);
    }

    const bandX = wordX - 70 + (wordW + 140) * smoothstep(holdP);
    const bandOn = u >= P_FORM && u < P_HOLD;

    if (bandOn) {
      // Тонкая световая линия: импульс виден даже между глифами.
      const edgeP = Math.min(1, holdP / 0.12, (1 - holdP) / 0.12);
      ctx.globalAlpha = 0.14 * edgeP;
      ctx.fillStyle = colors[ACCENT];
      ctx.fillRect(bandX, wordY - 4, 1.5, wordH + 8);
    }

    for (let pass = 0; pass < 3; pass++) {
      ctx.fillStyle = pass === 0 ? colors[INK] : pass === 1 ? colors[ACCENT2] : colors[ACCENT];
      for (let i = 0; i < count; i++) {
        const lit = bandOn && Math.abs(tx[i] - bandX) < 110;
        if ((lit ? 2 : tone[i]) !== pass) continue;

        const e = easeOutCubic(clamp((formP - (phase[i] * 0.12) / Math.PI) / 0.88, 0, 1));
        const inP = clamp((u - ((phase[i] / Math.PI) * 0.055)) / P_IN, 0, 1);
        const drift = (1 - e) * 14;
        const x =
          sx[i] +
          (tx[i] - sx[i]) * e +
          Math.sin(elapsed * 0.0011 + phase[i]) * drift +
          vx[i] * scatter;
        const y =
          sy[i] +
          (ty[i] - sy[i]) * e +
          Math.cos(elapsed * 0.0013 + phase[i]) * drift +
          vy[i] * scatter;

        let alpha = (0.18 + 0.5 * inP + 0.32 * e) * (1 - outP);
        if (lit) alpha = Math.min(1, alpha + 0.45 * (1 - Math.abs(tx[i] - bandX) / 110));
        if (alpha <= 0.01 || x < -80 || x > vw + 80 || y < -80 || y > vh + 80) continue;

        const glyphIndex =
          formP < 0.55
            ? (charSeed[i] + ((elapsed * 0.02) | 0)) % GLYPHS.length
            : stable[i];
        ctx.globalAlpha = alpha;
        ctx.fillText(GLYPHS.charAt(glyphIndex), x, y);
      }
    }

    if (u > 0.46) {
      const lineP = smoothstep((u - 0.46) / 0.28) * (1 - outP);
      const lineW = wordW * 0.62 * lineP;
      ctx.globalAlpha = 0.4 * lineP;
      ctx.fillStyle = colors[ACCENT];
      ctx.fillRect(vw / 2 - lineW / 2, wordY + wordH + 8, lineW, 1);
    }
    ctx.globalAlpha = 1;
  }

  return {
    frame,
    resize(): void {
      if (disposed) return;
      layout();
    },
    setTheme(): void {
      if (disposed) return;
      paletteFrom.set(palette);
      readPalette();
      themeAt = performance.now();
      theming = true;
    },
    dispose(): void {
      disposed = true;
      count = 0;
      tx = ty = sx = sy = vx = vy = new Float32Array(0);
      phase = new Float32Array(0);
      charSeed = new Int32Array(0);
      stable = tone = new Uint8Array(0);
      wordCanvas.width = 0;
      wordCanvas.height = 0;
      maskCanvas.width = 0;
      maskCanvas.height = 0;
    },
  };
}

