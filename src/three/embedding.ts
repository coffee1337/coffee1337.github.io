import * as THREE from "three";
import { Line2 } from "three/examples/jsm/lines/Line2.js";
import { LineGeometry } from "three/examples/jsm/lines/LineGeometry.js";
import { LineMaterial } from "three/examples/jsm/lines/LineMaterial.js";

export const EMBED_DIM = 384;
export const TOP_K = 5;
export const QUERY_TEXTS = [
  "who is egor?",
  "fastapi + pgvector",
  "k-nn cosine",
  "build a rag bot",
];

const CLUSTERS = [
  { id: "backend", center: [1.55, 0.35, 0.1] as const },
  { id: "llm", center: [-0.15, 1.45, 0.7] as const },
  { id: "rag", center: [-1.55, 0.25, 0.35] as const },
  { id: "ml", center: [0.25, -1.35, 0.55] as const },
  { id: "mobile", center: [1.05, -0.65, -1.25] as const },
  { id: "data", center: [-0.9, -0.2, -1.35] as const },
] as const;

const GLYPHS = ["0", "1", "·", "+", "*", "▪", ":"];
const TOKENS = ["fastapi", "rag", "attention", "vector", "torch", "sql"];
const ATLAS_COLS = 8;
const ATLAS_ROWS = 2;
const CELL = 128;

const DRAW_MS = 420;
const STAGGER_MS = 70;
const HOLD_MS = 2500;
const FADE_MS = 400;
const GAP_MS = 1600;
const THEME_MS = 400;
const SEGMENTS = 34;

export type EmbeddingHandle = {
  dispose: () => void;
  resize: () => void;
  setActive: (on: boolean) => void;
  setReduced: (on: boolean) => void;
};

type Palette = {
  ink: THREE.Color;
  accent: THREE.Color;
  caramel: THREE.Color;
  near: number;
  far: number;
  size: number;
};

type LabelSet = { query: HTMLDivElement; scores: HTMLDivElement[]; cluster: HTMLDivElement };

function cssVar(name: string, fallback: string): string {
  const raw = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return raw || fallback;
}

/** sRGB-строка из токена → линейное пространство Three (ColorManagement включён). */
function linear(style: string, fallback: string): THREE.Color {
  const color = new THREE.Color();
  try {
    color.setStyle(style || fallback, THREE.SRGBColorSpace);
  } catch {
    color.setStyle(fallback, THREE.SRGBColorSpace);
  }
  return color;
}

function readPalette(theme: "dark" | "light"): Palette {
  const ink = cssVar("--ink", theme === "dark" ? "#f3efe8" : "#1c1410");
  const accent = cssVar("--accent", theme === "dark" ? "#c4562a" : "#b34a22");
  const caramel = cssVar("--accent-2", theme === "dark" ? "#d9a066" : "#9a6a3a");
  // Светлая тема: глифы эспрессо, плотнее и крупнее — облако должно читаться.
  return {
    ink: linear(ink, "#f3efe8"),
    accent: linear(accent, "#c4562a"),
    caramel: linear(caramel, "#d9a066"),
    near: theme === "dark" ? 0.92 : 0.9,
    far: theme === "dark" ? 0.3 : 0.42,
    size: theme === "dark" ? 17 : 20,
  };
}

function readTheme(): "dark" | "light" {
  return document.documentElement.dataset.theme === "light" ? "light" : "dark";
}

function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function buildAtlas(): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = ATLAS_COLS * CELL;
  canvas.height = ATLAS_ROWS * CELL;
  const ctx = canvas.getContext("2d");
  if (!ctx) return canvas;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = "#ffffff";
  const cells = [...GLYPHS, "", ...TOKENS];
  cells.forEach((glyph, i) => {
    if (!glyph) return;
    const col = i % ATLAS_COLS;
    const row = Math.floor(i / ATLAS_COLS);
    const cx = col * CELL + CELL / 2;
    const cy = row * CELL + CELL / 2;
    ctx.font =
      glyph.length > 1
        ? `600 ${Math.floor(CELL * 0.22)}px ui-monospace, "JetBrains Mono", monospace`
        : `600 ${Math.floor(CELL * 0.55)}px ui-monospace, "JetBrains Mono", monospace`;
    ctx.fillText(glyph, cx, cy);
  });
  return canvas;
}

const vertexShader = /* glsl */ `
  attribute float aGlyph;
  attribute float aBoost;
  uniform float uSize;
  uniform float uDpr;
  uniform float uPixelRatioScale;
  uniform float uNear;
  uniform float uFar;
  varying float vGlyph;
  varying float vBoost;
  varying float vDepth;
  void main() {
    vGlyph = aGlyph;
    vBoost = aBoost;
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    vDepth = clamp((-mv.z - uNear) / max(uFar - uNear, 0.001), 0.0, 1.0);
    gl_PointSize = uSize * uDpr * uPixelRatioScale * mix(1.35, 0.6, vDepth) * mix(1.0, 1.6, vBoost);
    gl_Position = projectionMatrix * mv;
  }
`;

const fragmentShader = /* glsl */ `
  uniform sampler2D uAtlas;
  uniform vec3 uColor;
  uniform vec3 uAccent;
  uniform vec3 uCaramel;
  uniform float uAlphaNear;
  uniform float uAlphaFar;
  uniform float uDpr;
  varying float vGlyph;
  varying float vBoost;
  varying float vDepth;
  void main() {
    float cols = 8.0;
    float rows = 2.0;
    float idx = floor(vGlyph + 0.5);
    float col = mod(idx, cols);
    float row = floor(idx / cols);
    vec2 uv = vec2((col + gl_PointCoord.x) / cols, (row + gl_PointCoord.y) / rows);
    vec4 glyph = texture2D(uAtlas, uv);
    if (glyph.a < 0.08) discard;
    // дальние глифы — приглушённые, ближние — плотные; премультиплицируем альфу
    float depthAlpha = mix(uAlphaNear, uAlphaFar, vDepth);
    float alpha = glyph.a * depthAlpha;
    vec3 boosted = mix(uCaramel, uAccent, 0.42);
    vec3 color = mix(uColor, boosted, clamp(vBoost, 0.0, 1.0));
    gl_FragColor = vec4(color * alpha, alpha);
    #include <colorspace_fragment>
  }
`;

type Link = {
  line: Line2;
  glow: Line2;
  geometry: LineGeometry;
  material: LineMaterial;
  glowMaterial: LineMaterial;
  points: Float32Array;
  start: number;
  drawn: number;
};

export function createEmbedding(
  canvas: HTMLCanvasElement,
  opts: {
    overlay: HTMLElement;
    mobile: boolean;
    lite: boolean;
    reduced: boolean;
    getClusterWord: () => string;
    onReady: (count: number) => void;
  },
): EmbeddingHandle {
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: true,
    premultipliedAlpha: true,
    powerPreference: opts.mobile ? "low-power" : "high-performance",
  });
  const dpr = () => Math.min(2, window.devicePixelRatio || 1);
  renderer.setPixelRatio(dpr());
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 100);
  camera.position.set(0, 0, 6);

  const count = opts.lite ? 900 : 2048;
  const rng = mulberry32(1337);
  const raw = new Float32Array(count * 3);
  const positions = new Float32Array(count * 3);
  const glyphs = new Float32Array(count);
  const boosts = new Float32Array(count);
  const clusterCounts = CLUSTERS.map(() => 0);
  const clusterOf = new Uint8Array(count);
  const local = new Float32Array(count * 3);

  for (let i = 0; i < count; i++) {
    const cluster = i % CLUSTERS.length;
    clusterOf[i] = cluster;
    clusterCounts[cluster] += 1;
    const c = CLUSTERS[cluster].center;
    // гауссово облако вокруг центра кластера
    const g1 = (rng() + rng() + rng() - 1.5) * 0.62;
    const g2 = (rng() + rng() + rng() - 1.5) * 0.62;
    const g3 = (rng() + rng() + rng() - 1.5) * 0.62;
    raw[i * 3] = c[0] + g1;
    raw[i * 3 + 1] = c[1] + g2;
    raw[i * 3 + 2] = c[2] + g3;
    const token = rng() < 0.07;
    glyphs[i] = token ? 8 + Math.floor(rng() * TOKENS.length) : Math.floor(rng() * GLYPHS.length);
  }

  // Центр масс → начало координат: вращение не выводит облако из кадра.
  let cx = 0;
  let cy = 0;
  let cz = 0;
  for (let i = 0; i < count; i++) {
    cx += raw[i * 3];
    cy += raw[i * 3 + 1];
    cz += raw[i * 3 + 2];
  }
  cx /= count;
  cy /= count;
  cz /= count;

  let radius = 0;
  for (let i = 0; i < count; i++) {
    const x = raw[i * 3] - cx;
    const y = raw[i * 3 + 1] - cy;
    const z = raw[i * 3 + 2] - cz;
    local[i * 3] = x;
    local[i * 3 + 1] = y;
    local[i * 3 + 2] = z;
    positions[i * 3] = x;
    positions[i * 3 + 1] = y;
    positions[i * 3 + 2] = z;
    radius = Math.max(radius, Math.hypot(x, y, z));
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute("aGlyph", new THREE.BufferAttribute(glyphs, 1));
  const boostAttr = new THREE.BufferAttribute(boosts, 1);
  geometry.setAttribute("aBoost", boostAttr);

  const atlasCanvas = buildAtlas();
  const atlas = new THREE.CanvasTexture(atlasCanvas);
  atlas.colorSpace = THREE.NoColorSpace;
  atlas.minFilter = THREE.LinearFilter;
  atlas.magFilter = THREE.LinearFilter;
  atlas.needsUpdate = true;

  let palette = readPalette(readTheme());
  const uniforms = {
    uAtlas: { value: atlas },
    uSize: { value: palette.size },
    uDpr: { value: dpr() },
    uPixelRatioScale: { value: 1 },
    uColor: { value: palette.ink.clone() },
    uAccent: { value: palette.accent.clone() },
    uCaramel: { value: palette.caramel.clone() },
    uAlphaNear: { value: palette.near },
    uAlphaFar: { value: palette.far },
    uNear: { value: 2 },
    uFar: { value: 9 },
  };

  const material = new THREE.ShaderMaterial({
    uniforms,
    vertexShader,
    fragmentShader,
    transparent: true,
    depthWrite: false,
    depthTest: false,
    blending: THREE.CustomBlending,
    blendSrc: THREE.OneFactor,
    blendDst: THREE.OneMinusSrcAlphaFactor,
    blendSrcAlpha: THREE.OneFactor,
    blendDstAlpha: THREE.OneMinusSrcAlphaFactor,
  });

  const points = new THREE.Points(geometry, material);
  const group = new THREE.Group();
  group.add(points);
  scene.add(group);

  // ── Связи: Line2 с толщиной в пикселях, квадратичная кривая на каждую пару.
  const links: Link[] = [];
  for (let k = 0; k < TOP_K; k++) {
    const geom = new LineGeometry();
    const flat = new Float32Array((SEGMENTS + 1) * 3);
    geom.setPositions(flat as unknown as number[]);
    const mat = new LineMaterial({
      color: palette.accent.clone(),
      linewidth: 1.8,
      transparent: true,
      opacity: 0,
      depthTest: false,
      depthWrite: false,
      resolution: new THREE.Vector2(1, 1),
      worldUnits: false,
      premultipliedAlpha: true,
    });
    const glowMat = new LineMaterial({
      color: palette.accent.clone(),
      linewidth: 7,
      transparent: true,
      opacity: 0,
      depthTest: false,
      depthWrite: false,
      resolution: new THREE.Vector2(1, 1),
      worldUnits: false,
      premultipliedAlpha: true,
      blending: THREE.AdditiveBlending,
    });
    const line = new Line2(geom, mat);
    const glow = new Line2(geom, glowMat);
    line.frustumCulled = false;
    glow.frustumCulled = false;
    line.renderOrder = 2;
    glow.renderOrder = 1;
    group.add(glow, line);
    links.push({ line, glow, geometry: geom, material: mat, glowMaterial: glowMat, points: flat, start: 0, drawn: 0 });
  }

  // Точка запроса.
  const queryGeom = new THREE.BufferGeometry();
  queryGeom.setAttribute("position", new THREE.BufferAttribute(new Float32Array(3), 3));
  const queryMat = new THREE.PointsMaterial({
    color: palette.accent.clone(),
    size: 9,
    sizeAttenuation: false,
    transparent: true,
    opacity: 0,
    depthTest: false,
    depthWrite: false,
  });
  const queryPoint = new THREE.Points(queryGeom, queryMat);
  queryPoint.frustumCulled = false;
  group.add(queryPoint);

  // Импульс, бегущий по линии.
  const pulseGeom = new THREE.BufferGeometry();
  pulseGeom.setAttribute("position", new THREE.BufferAttribute(new Float32Array(3), 3));
  const pulseMat = new THREE.PointsMaterial({
    color: palette.caramel.clone(),
    size: 7,
    sizeAttenuation: false,
    transparent: true,
    opacity: 0,
    depthTest: false,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  const pulse = new THREE.Points(pulseGeom, pulseMat);
  pulse.frustumCulled = false;
  group.add(pulse);

  // ── HTML-подписи: создаются один раз, позиция пишется каждый кадр.
  const labels: LabelSet = {
    query: document.createElement("div"),
    scores: [],
    cluster: document.createElement("div"),
  };
  labels.query.className = "emb-label emb-label--query";
  labels.cluster.className = "emb-label emb-label--cluster";
  opts.overlay.appendChild(labels.query);
  opts.overlay.appendChild(labels.cluster);
  for (let k = 0; k < TOP_K; k++) {
    const el = document.createElement("div");
    el.className = "emb-label emb-label--score";
    opts.overlay.appendChild(el);
    labels.scores.push(el);
  }

  let width = 1;
  let height = 1;
  let active = true;
  let running = false;
  let reduced = opts.reduced;
  let raf = 0;
  let rotY = 0;
  let rotX = 0.14;
  let velY = 0.0016;
  let velX = 0;
  let dragging = false;
  let lastX = 0;
  let lastY = 0;
  let rotScale = 1;
  let rotTarget = 1;
  let queryCycle = 0;
  let queryIndex = -1;
  let nextQueryAt = performance.now() + 1800;
  let phase: "idle" | "draw" | "hold" | "fade" = "idle";
  let phaseStart = 0;
  let hoveredCluster = -1;
  let themeFrom = palette;
  let themeTo = palette;
  let themeMix = 1;
  let themeStart = 0;
  let pointerX = -999;
  let pointerY = -999;

  const neighborIdx = new Int32Array(TOP_K);
  const neighborScore = new Float32Array(TOP_K);
  const labelOrder = new Int32Array(TOP_K);
  const labelX = new Float32Array(TOP_K);
  const labelY = new Float32Array(TOP_K);
  const labelVisible = new Uint8Array(TOP_K);
  const cursor = new THREE.Vector3();
  const projected = new THREE.Vector3();
  const bezierScratch = new THREE.Vector3();

  const setResolution = () => {
    for (const link of links) {
      link.material.resolution.set(width, height);
      link.glowMaterial.resolution.set(width, height);
    }
  };

  /** Мир (после вращения группы) → пиксели canvas. */
  const toScreenX = (v: THREE.Vector3) => (v.x * 0.5 + 0.5) * width;
  const toScreenY = (v: THREE.Vector3) => (-v.y * 0.5 + 0.5) * height;

  const projectLocal = (x: number, y: number, z: number) => {
    cursor.set(x, y, z).applyMatrix4(group.matrixWorld).project(camera);
    projected.copy(cursor);
    return cursor;
  };

  const applyPalette = (next: Palette) => {
    themeFrom = {
      ink: uniforms.uColor.value.clone(),
      accent: uniforms.uAccent.value.clone(),
      caramel: uniforms.uCaramel.value.clone(),
      near: uniforms.uAlphaNear.value,
      far: uniforms.uAlphaFar.value,
      size: uniforms.uSize.value,
    };
    themeTo = next;
    themeMix = 0;
    themeStart = performance.now();
    palette = next;
    const additive = readTheme() === "dark";
    for (const link of links) {
      link.glowMaterial.blending = additive ? THREE.AdditiveBlending : THREE.NormalBlending;
      link.glowMaterial.needsUpdate = true;
    }
    pulseMat.blending = additive ? THREE.AdditiveBlending : THREE.NormalBlending;
    pulseMat.needsUpdate = true;
  };

  const stepTheme = (now: number) => {
    if (themeMix >= 1) return;
    const p = Math.min(1, (now - themeStart) / THEME_MS);
    const ease = p * p * (3 - 2 * p);
    themeMix = p;
    uniforms.uColor.value.copy(themeFrom.ink).lerp(themeTo.ink, ease);
    uniforms.uAccent.value.copy(themeFrom.accent).lerp(themeTo.accent, ease);
    uniforms.uCaramel.value.copy(themeFrom.caramel).lerp(themeTo.caramel, ease);
    uniforms.uAlphaNear.value = themeFrom.near + (themeTo.near - themeFrom.near) * ease;
    uniforms.uAlphaFar.value = themeFrom.far + (themeTo.far - themeFrom.far) * ease;
    uniforms.uSize.value = themeFrom.size + (themeTo.size - themeFrom.size) * ease;
    queryMat.color.copy(uniforms.uAccent.value);
    pulseMat.color.copy(uniforms.uCaramel.value);
    for (const link of links) {
      link.material.color.copy(uniforms.uAccent.value);
      link.glowMaterial.color.copy(uniforms.uAccent.value);
    }
    if (themeMix >= 1) uniforms.uColor.value.copy(themeTo.ink);
  };

  const hideLabels = () => {
    labels.query.style.opacity = "0";
    labels.cluster.style.opacity = "0";
    for (const el of labels.scores) el.style.opacity = "0";
  };

  const clearQuery = () => {
    phase = "idle";
    queryIndex = -1;
    rotTarget = 1;
    boosts.fill(0);
    boostAttr.needsUpdate = true;
    for (const link of links) {
      link.material.opacity = 0;
      link.glowMaterial.opacity = 0;
      link.geometry.instanceCount = 0;
      link.drawn = 0;
    }
    queryMat.opacity = 0;
    pulseMat.opacity = 0;
    hideLabels();
  };

  const pickQuery = () => {
    // запрос — реальная точка облака внутри случайного кластера
    const cluster = Math.floor(rng() * CLUSTERS.length);
    let candidate = cluster;
    for (let tries = 0; tries < 64; tries++) {
      const i = Math.floor(rng() * count);
      if (clusterOf[i] === cluster) {
        candidate = i;
        break;
      }
    }
    return candidate;
  };

  const fireQuery = (now: number) => {
    queryIndex = pickQuery();
    const qx = positions[queryIndex * 3];
    const qy = positions[queryIndex * 3 + 1];
    const qz = positions[queryIndex * 3 + 2];
    const qAttr = queryGeom.getAttribute("position") as THREE.BufferAttribute;
    qAttr.setXYZ(0, qx, qy, qz);
    qAttr.needsUpdate = true;
    labels.query.textContent = `query: "${QUERY_TEXTS[queryCycle % QUERY_TEXTS.length]}"`;

    // настоящий kNN: евклидово расстояние в 3D, top-k
    const bestD = new Float32Array(TOP_K).fill(Infinity);
    const bestI = new Int32Array(TOP_K).fill(-1);
    for (let i = 0; i < count; i++) {
      if (i === queryIndex) continue;
      const dx = positions[i * 3] - qx;
      const dy = positions[i * 3 + 1] - qy;
      const dz = positions[i * 3 + 2] - qz;
      const d = Math.sqrt(dx * dx + dy * dy + dz * dz);
      if (d >= bestD[TOP_K - 1]) continue;
      let slot = TOP_K - 1;
      while (slot > 0 && bestD[slot - 1] > d) {
        bestD[slot] = bestD[slot - 1];
        bestI[slot] = bestI[slot - 1];
        slot -= 1;
      }
      bestD[slot] = d;
      bestI[slot] = i;
    }

    boosts.fill(0);
    for (let k = 0; k < TOP_K; k++) {
      const i = bestI[k];
      neighborIdx[k] = i;
      // честная близость: 1 / (1 + d) — не «зажимаем» в 0.72…0.99
      neighborScore[k] = i >= 0 ? 1 / (1 + bestD[k]) : 0;
      if (i >= 0) boosts[i] = 1;
      const link = links[k];
      link.start = now + k * STAGGER_MS;
      link.drawn = 0;
      link.geometry.instanceCount = 0;
      if (i < 0) {
        link.material.opacity = 0;
        link.glowMaterial.opacity = 0;
        continue;
      }
      const x = positions[i * 3];
      const y = positions[i * 3 + 1];
      const z = positions[i * 3 + 2];
      // квадратичная кривая: контрольная точка вынесена в сторону от хорды
      const mx = (qx + x) / 2;
      const my = (qy + y) / 2;
      const mz = (qz + z) / 2;
      const dx = x - qx;
      const dy = y - qy;
      const dz = z - qz;
      const len = Math.hypot(dx, dy, dz) || 1;
      const off = 0.22 + 0.08 * k;
      const cxp = mx - (dy / len) * off;
      const cyp = my + (dx / len) * off;
      const czp = mz + (dz / len) * off * 0.6;
      for (let s = 0; s <= SEGMENTS; s++) {
        const t = s / SEGMENTS;
        const it = 1 - t;
        bezierScratch.set(
          it * it * qx + 2 * it * t * cxp + t * t * x,
          it * it * qy + 2 * it * t * cyp + t * t * y,
          it * it * qz + 2 * it * t * czp + t * t * z,
        );
        bezierScratch.toArray(link.points, s * 3);
      }
      link.geometry.setPositions(link.points as unknown as number[]);
      link.geometry.instanceCount = 0;
    }
    boostAttr.needsUpdate = true;
    queryMat.opacity = 1;
    rotTarget = 0.3;
    phase = "draw";
    phaseStart = now;
    queryCycle += 1;
    nextQueryAt = now + (TOP_K - 1) * STAGGER_MS + DRAW_MS + HOLD_MS + FADE_MS + GAP_MS;
  };

  const updateLinks = (now: number) => {
    let complete = 0;
    for (let k = 0; k < TOP_K; k++) {
      const link = links[k];
      if (link.start === 0) continue;
      const p = Math.min(1, Math.max(0, (now - link.start) / DRAW_MS));
      link.drawn = Math.floor(p * SEGMENTS);
      link.geometry.instanceCount = link.drawn;
      link.material.opacity = p;
      link.glowMaterial.opacity = 0.16 * p;
      if (p >= 1) complete += 1;
    }
    return complete === TOP_K;
  };

  const updateLabels = (now: number) => {
    // подпись кластера живёт независимо от цикла запроса
    if (hoveredCluster >= 0) {
      const c = CLUSTERS[hoveredCluster].center;
      const lp = projectLocal(c[0] - cx, c[1] - cy, c[2] - cz);
      if (lp.z < 1 && Math.abs(lp.x) < 1.05 && Math.abs(lp.y) < 1.05) {
        labels.cluster.textContent = `${opts.getClusterWord()} ${CLUSTERS[hoveredCluster].id} · n=${clusterCounts[hoveredCluster]}`;
        labels.cluster.style.opacity = "1";
        labels.cluster.style.transform = `translate3d(${toScreenX(lp).toFixed(1)}px, ${toScreenY(lp).toFixed(1)}px, 0) translate(12px, -8px)`;
      } else {
        labels.cluster.style.opacity = "0";
      }
    } else {
      labels.cluster.style.opacity = "0";
    }

    if (queryIndex < 0 || phase === "idle") return;
    const fade = phase === "fade" ? 1 - Math.min(1, (now - phaseStart) / FADE_MS) : 1;
    const q = projectLocal(positions[queryIndex * 3], positions[queryIndex * 3 + 1], positions[queryIndex * 3 + 2]);
    const qVisible = q.z < 1 && q.x > -1.1 && q.x < 1.1 && q.y > -1.1 && q.y < 1.1;
    const qx = toScreenX(q);
    const qy = toScreenY(q);
    labels.query.style.opacity = qVisible ? String(fade) : "0";
    labels.query.style.transform = `translate3d(${qx.toFixed(1)}px, ${qy.toFixed(1)}px, 0) translate(10px, -14px)`;

    let visibleCount = 0;
    for (let k = 0; k < TOP_K; k++) {
      const el = labels.scores[k];
      const i = neighborIdx[k];
      const link = links[k];
      if (i < 0 || link.drawn < SEGMENTS - 1) {
        el.style.opacity = "0";
        labelVisible[k] = 0;
        continue;
      }
      const p = projectLocal(positions[i * 3], positions[i * 3 + 1], positions[i * 3 + 2]);
      const onScreen = p.z < 1 && p.x > -1 && p.x < 1 && p.y > -1 && p.y < 1;
      if (!onScreen) {
        el.style.opacity = "0";
        labelVisible[k] = 0;
        continue;
      }
      labelVisible[k] = 1;
      labelX[k] = toScreenX(p);
      labelY[k] = toScreenY(p);
      labelOrder[visibleCount] = k;
      visibleCount += 1;
    }

    // разнесение по вертикали: сортируем видимые подписи по y и расталкиваем
    for (let a = 0; a < visibleCount; a++) {
      for (let b = a + 1; b < visibleCount; b++) {
        if (labelY[labelOrder[b]] < labelY[labelOrder[a]]) {
          const tmp = labelOrder[a];
          labelOrder[a] = labelOrder[b];
          labelOrder[b] = tmp;
        }
      }
    }
    let prevY = -Infinity;
    for (let a = 0; a < visibleCount; a++) {
      const k = labelOrder[a];
      if (labelY[k] - prevY < 14) labelY[k] = prevY + 14;
      prevY = labelY[k];
    }

    for (let k = 0; k < TOP_K; k++) {
      const el = labels.scores[k];
      if (!labelVisible[k]) continue;
      el.textContent = neighborScore[k].toFixed(2);
      el.style.opacity = String(0.85 * fade);
      el.style.transform = `translate3d(${labelX[k].toFixed(1)}px, ${labelY[k].toFixed(1)}px, 0) translate(8px, 4px)`;
    }
  };

  const fitCamera = () => {
    const vFov = (camera.fov * Math.PI) / 180;
    const hFov = 2 * Math.atan(Math.tan(vFov / 2) * camera.aspect);
    const fov = Math.min(vFov, hFov);
    const distance = (radius * 1.06) / Math.sin(fov / 2);
    camera.position.set(0, 0, distance);
    camera.near = Math.max(0.1, distance - radius * 3);
    camera.far = distance + radius * 3;
    camera.updateProjectionMatrix();
    uniforms.uNear.value = distance - radius * 0.85;
    uniforms.uFar.value = distance + radius * 0.85;
    // масштаб глифа компенсирует дальность камеры (одинаково на всех экранах)
    uniforms.uPixelRatioScale.value = distance / 6.2;
  };

  const resize = () => {
    const parent = canvas.parentElement ?? canvas;
    width = Math.max(1, parent.clientWidth);
    height = Math.max(1, parent.clientHeight);
    const nextDpr = dpr();
    renderer.setPixelRatio(nextDpr);
    uniforms.uDpr.value = nextDpr;
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    fitCamera();
    setResolution();
  };

  let lastFrame = performance.now();

  const tick = (now: number) => {
    raf = requestAnimationFrame(tick);
    if (!running || !active) return;
    const delta = Math.min(0.05, (now - lastFrame) / 1000 || 0.016);
    lastFrame = now;
    stepTheme(now);

    if (!reduced) {
      if (!dragging) {
        rotScale += (rotTarget - rotScale) * Math.min(1, delta * 3.2);
        rotY += velY * rotScale;
        rotX += velX * rotScale;
        velY *= 0.965;
        velX *= 0.965;
        if (Math.abs(velY) < 0.0016) velY = 0.0016 * Math.sign(velY || 1);
        rotX = Math.max(-0.55, Math.min(0.55, rotX));
      }
      group.rotation.y = rotY;
      group.rotation.x = rotX;

      if (phase === "idle" && now >= nextQueryAt) fireQuery(now);
      if (phase === "draw" || phase === "hold") {
        const done = updateLinks(now);
        if (done && phase === "draw") {
          phase = "hold";
          phaseStart = now;
          // импульс по последней линии
          pulseMat.opacity = 1;
        }
        if (phase === "hold") {
          const t = Math.min(1, Math.max(0, (now - phaseStart - 200) / 950));
          if (t > 0 && t < 1) {
            const link = links[TOP_K - 1];
            const s = Math.floor(t * SEGMENTS);
            const pa = pulseGeom.getAttribute("position") as THREE.BufferAttribute;
            pa.setXYZ(0, link.points[s * 3], link.points[s * 3 + 1], link.points[s * 3 + 2]);
            pa.needsUpdate = true;
            pulseMat.opacity = 1 - Math.max(0, (t - 0.8) / 0.2);
          } else if (t >= 1) {
            pulseMat.opacity = 0;
          }
          if (now - phaseStart >= HOLD_MS) {
            phase = "fade";
            phaseStart = now;
          }
        }
      } else if (phase === "fade") {
        const p = Math.min(1, (now - phaseStart) / FADE_MS);
        for (const link of links) {
          link.material.opacity = 1 - p;
          link.glowMaterial.opacity = 0.16 * (1 - p);
        }
        queryMat.opacity = 1 - p;
        pulseMat.opacity = 0;
        if (p >= 1) clearQuery();
      }
      updateLabels(now);
    }

    renderer.render(scene, camera);
  };

  const onPointerDown = (e: PointerEvent) => {
    if (opts.mobile) return;
    dragging = true;
    lastX = e.clientX;
    lastY = e.clientY;
    canvas.style.cursor = "grabbing";
    canvas.setPointerCapture(e.pointerId);
  };
  const onPointerMove = (e: PointerEvent) => {
    const rect = canvas.getBoundingClientRect();
    pointerX = e.clientX - rect.left;
    pointerY = e.clientY - rect.top;
    if (!opts.mobile) pickClusterHover();
    else if (hoveredCluster !== -1) hoveredCluster = -1;
    if (!dragging) return;
    const dx = e.clientX - lastX;
    const dy = e.clientY - lastY;
    lastX = e.clientX;
    lastY = e.clientY;
    rotY += dx * 0.005;
    rotX = Math.max(-0.55, Math.min(0.55, rotX + dy * 0.005));
    velY = dx * 0.0009;
    velX = dy * 0.0009;
  };
  const onPointerUp = (e: PointerEvent) => {
    dragging = false;
    canvas.style.cursor = opts.mobile ? "default" : "grab";
    try {
      canvas.releasePointerCapture(e.pointerId);
    } catch {
      /* already released */
    }
  };
  const onPointerLeave = () => {
    if (hoveredCluster !== -1) {
      hoveredCluster = -1;
      labels.cluster.style.opacity = "0";
    }
  };

  function pickClusterHover() {
    if (reduced || opts.mobile) return;
    let best = -1;
    let bestD = 130;
    for (let c = 0; c < CLUSTERS.length; c++) {
      const center = CLUSTERS[c].center;
      const p = projectLocal(center[0] - cx, center[1] - cy, center[2] - cz);
      if (p.z >= 1) continue;
      const d = Math.hypot(toScreenX(p) - pointerX, toScreenY(p) - pointerY);
      if (d < bestD) {
        bestD = d;
        best = c;
      }
    }
    hoveredCluster = best;
  }

  const onVisibility = () => {
    running = document.visibilityState === "visible" && active;
    lastFrame = performance.now();
  };

  const onTheme = (event: Event) => {
    const detail = (event as CustomEvent<{ theme?: string }>).detail;
    const theme = detail?.theme === "light" ? "light" : detail?.theme === "dark" ? "dark" : readTheme();
    applyPalette(readPalette(theme));
  };

  if (!opts.mobile) {
    canvas.addEventListener("pointerdown", onPointerDown);
    canvas.addEventListener("pointermove", onPointerMove);
    canvas.addEventListener("pointerup", onPointerUp);
    canvas.addEventListener("pointercancel", onPointerUp);
    canvas.addEventListener("pointerleave", onPointerLeave);
    canvas.style.cursor = "grab";
  }
  window.addEventListener("themechange", onTheme);
  document.addEventListener("visibilitychange", onVisibility);

  resize();
  running = document.visibilityState === "visible" && active;
  raf = requestAnimationFrame(tick);
  opts.onReady(count);

  return {
    dispose: () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("themechange", onTheme);
      document.removeEventListener("visibilitychange", onVisibility);
      canvas.removeEventListener("pointerdown", onPointerDown);
      canvas.removeEventListener("pointermove", onPointerMove);
      canvas.removeEventListener("pointerup", onPointerUp);
      canvas.removeEventListener("pointercancel", onPointerUp);
      canvas.removeEventListener("pointerleave", onPointerLeave);
      for (const link of links) {
        link.geometry.dispose();
        link.material.dispose();
        link.glowMaterial.dispose();
      }
      geometry.dispose();
      material.dispose();
      atlas.dispose();
      queryGeom.dispose();
      queryMat.dispose();
      pulseGeom.dispose();
      pulseMat.dispose();
      renderer.dispose();
      labels.query.remove();
      labels.cluster.remove();
      for (const el of labels.scores) el.remove();
    },
    resize,
    setActive: (on) => {
      active = on;
      running = on && document.visibilityState === "visible";
      lastFrame = performance.now();
    },
    setReduced: (on) => {
      reduced = on;
      if (on) {
        clearQuery();
        rotScale = 0;
        rotTarget = 0;
      }
    },
  };
}
