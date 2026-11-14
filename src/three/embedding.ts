import * as THREE from "three";

export const EMBED_DIM = 384;
export const TOP_K = 5;
export const QUERY_TEXTS = [
  "who is egor?",
  "fastapi + pgvector",
  "k-nn cosine",
  "build a rag bot",
];

const CLUSTERS = [
  { id: "backend", center: [1.6, 0.4, 0.2] as const },
  { id: "llm", center: [-0.2, 1.5, 0.8] as const },
  { id: "rag", center: [-1.5, 0.3, 0.4] as const },
  { id: "ml", center: [0.3, -1.4, 0.6] as const },
  { id: "mobile", center: [1.1, -0.6, -1.3] as const },
  { id: "data", center: [-0.9, -0.2, -1.4] as const },
] as const;

const GLYPHS = ["0", "1", "·", "+", "*", "▪", ":"];
const TOKENS = ["fastapi", "rag", "attention", "vector", "torch", "sql"];
const ATLAS_COLS = 8;
const ATLAS_ROWS = 2;
const CELL = 128;

export type ClusterHover = { id: string; n: number } | null;
export type QueryOverlay = {
  text: string;
  query: { x: number; y: number };
  neighbors: { x: number; y: number; score: string }[];
} | null;

export type EmbeddingHandle = {
  dispose: () => void;
  resize: () => void;
  setActive: (on: boolean) => void;
  setTheme: () => void;
  setReduced: (on: boolean) => void;
};

function cssColor(name: string, fallback: string) {
  const raw = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return raw || fallback;
}

function hexToVec(hex: string) {
  const c = new THREE.Color(hex);
  return new THREE.Vector3(c.r, c.g, c.b);
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

function buildAtlas() {
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
    ctx.font = glyph.length > 1 ? `600 ${Math.floor(CELL * 0.22)}px ui-monospace, monospace` : `600 ${Math.floor(CELL * 0.55)}px ui-monospace, monospace`;
    ctx.fillText(glyph, cx, cy);
  });
  return canvas;
}

function readPalette() {
  return {
    ink: cssColor("--ink", "#f3efe8"),
    accent: cssColor("--accent", "#c4562a"),
    accent2: cssColor("--accent-2", "#d9a066"),
    faint: cssColor("--ink-faint", "#7f7972"),
  };
}

const vertexShader = /* glsl */ `
  attribute float aGlyph;
  attribute float aBoost;
  uniform float uSize;
  uniform float uDpr;
  varying float vGlyph;
  varying float vBoost;
  varying float vDepth;
  void main() {
    vGlyph = aGlyph;
    vBoost = aBoost;
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    vDepth = clamp((-mv.z - 2.0) / 6.0, 0.0, 1.0);
    gl_PointSize = uSize * uDpr * mix(0.55, 1.45, 1.0 - vDepth) * mix(1.0, 1.7, vBoost);
    gl_Position = projectionMatrix * mv;
  }
`;

const fragmentShader = /* glsl */ `
  uniform sampler2D uAtlas;
  uniform vec3 uColor;
  uniform vec3 uAccent;
  uniform vec3 uCaramel;
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
    if (glyph.a < 0.12) discard;
    vec3 color = mix(uColor, mix(uCaramel, uAccent, 0.35), vBoost);
    float alpha = glyph.a * mix(0.22, 0.95, 1.0 - vDepth);
    gl_FragColor = vec4(color, alpha);
  }
`;

export function createEmbedding(
  canvas: HTMLCanvasElement,
  opts: {
    mobile: boolean;
    reduced: boolean;
    onCluster: (hover: ClusterHover) => void;
    onQuery: (query: QueryOverlay) => void;
  },
): EmbeddingHandle {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: true, powerPreference: "high-performance" });
  renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 40);
  camera.position.set(0, 0, 6.2);

  const count = opts.mobile ? 760 : 2048;
  const rng = mulberry32(1337);
  const positions = new Float32Array(count * 3);
  const glyphs = new Float32Array(count);
  const boosts = new Float32Array(count);
  const clusterOf = new Uint8Array(count);
  const clusterCounts = CLUSTERS.map(() => 0);

  for (let i = 0; i < count; i++) {
    const cluster = i % CLUSTERS.length;
    clusterOf[i] = cluster;
    clusterCounts[cluster] += 1;
    const c = CLUSTERS[cluster].center;
    const spread = 0.55 + rng() * 0.25;
    positions[i * 3] = c[0] + (rng() - 0.5) * spread * 2.4;
    positions[i * 3 + 1] = c[1] + (rng() - 0.5) * spread * 2.4;
    positions[i * 3 + 2] = c[2] + (rng() - 0.5) * spread * 2.4;
    const token = rng() < 0.08;
    glyphs[i] = token ? 8 + Math.floor(rng() * TOKENS.length) : Math.floor(rng() * GLYPHS.length);
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute("aGlyph", new THREE.BufferAttribute(glyphs, 1));
  const boostAttr = new THREE.BufferAttribute(boosts, 1);
  geometry.setAttribute("aBoost", boostAttr);

  const atlas = new THREE.CanvasTexture(buildAtlas());
  atlas.colorSpace = THREE.SRGBColorSpace;
  atlas.minFilter = THREE.LinearFilter;
  atlas.magFilter = THREE.LinearFilter;
  atlas.needsUpdate = true;

  const palette = readPalette();
  const uniforms = {
    uAtlas: { value: atlas },
    uSize: { value: opts.mobile ? 14 : 18 },
    uDpr: { value: Math.min(2, window.devicePixelRatio || 1) },
    uColor: { value: hexToVec(palette.ink) },
    uAccent: { value: hexToVec(palette.accent) },
    uCaramel: { value: hexToVec(palette.accent2) },
  };

  const material = new THREE.ShaderMaterial({
    uniforms,
    vertexShader,
    fragmentShader,
    transparent: true,
    depthWrite: false,
    blending: THREE.NormalBlending,
  });

  const points = new THREE.Points(geometry, material);
  const queryGeom = new THREE.BufferGeometry();
  queryGeom.setAttribute("position", new THREE.BufferAttribute(new Float32Array(3), 3));
  const queryMat = new THREE.PointsMaterial({
    color: palette.accent,
    size: 18,
    sizeAttenuation: false,
    transparent: true,
    opacity: 0,
  });
  const queryPoint = new THREE.Points(queryGeom, queryMat);
  const linePos = new Float32Array(TOP_K * 6);
  const lineGeom = new THREE.BufferGeometry();
  lineGeom.setAttribute("position", new THREE.BufferAttribute(linePos, 3));
  const lineMat = new THREE.LineBasicMaterial({
    color: palette.accent,
    transparent: true,
    opacity: 0,
  });
  const lines = new THREE.LineSegments(lineGeom, lineMat);
  const group = new THREE.Group();
  group.add(points);
  group.add(queryPoint);
  group.add(lines);
  scene.add(group);

  let width = 1;
  let height = 1;
  let active = true;
  let reduced = opts.reduced;
  let raf = 0;
  let running = false;
  let rotY = 0;
  let rotX = 0.12;
  let velY = 0.0018;
  let velX = 0;
  let dragging = false;
  let lastX = 0;
  let lastY = 0;
  let hover: ClusterHover = null;
  let queryCycle = 0;
  let queryUntil = 0;
  let nextQueryAt = performance.now() + 1600;
  const pointer = new THREE.Vector2(-10, -10);
  const ndc = new THREE.Vector3();

  const toScreen = (x: number, y: number, z: number) => {
    ndc.set(x, y, z).applyMatrix4(group.matrixWorld).project(camera);
    return {
      x: (ndc.x * 0.5 + 0.5) * width,
      y: (-ndc.y * 0.5 + 0.5) * height,
    };
  };

  const applyTheme = () => {
    const next = readPalette();
    uniforms.uColor.value = hexToVec(next.ink);
    uniforms.uAccent.value = hexToVec(next.accent);
    uniforms.uCaramel.value = hexToVec(next.accent2);
    queryMat.color = new THREE.Color(next.accent);
    lineMat.color = new THREE.Color(next.accent);
  };

  const resize = () => {
    const parent = canvas.parentElement ?? canvas;
    width = Math.max(1, parent.clientWidth);
    height = Math.max(1, parent.clientHeight);
    renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
    uniforms.uDpr.value = Math.min(2, window.devicePixelRatio || 1);
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  };

  const clearQuery = () => {
    queryMat.opacity = 0;
    lineMat.opacity = 0;
    boosts.fill(0);
    boostAttr.needsUpdate = true;
    opts.onQuery(null);
  };

  const fireQuery = (now: number) => {
    const text = QUERY_TEXTS[queryCycle % QUERY_TEXTS.length];
    queryCycle += 1;
    const qi = Math.floor(rng() * count);
    const qx = positions[qi * 3];
    const qy = positions[qi * 3 + 1];
    const qz = positions[qi * 3 + 2];
    const qLen = Math.hypot(qx, qy, qz) || 1;
    const scored: { i: number; s: number }[] = [];
    for (let i = 0; i < count; i++) {
      if (i === qi) continue;
      const x = positions[i * 3];
      const y = positions[i * 3 + 1];
      const z = positions[i * 3 + 2];
      const len = Math.hypot(x, y, z) || 1;
      const cosine = (x * qx + y * qy + z * qz) / (len * qLen);
      scored.push({ i, s: cosine });
    }
    scored.sort((a, b) => b.s - a.s);
    const top = scored.slice(0, TOP_K);
    boosts.fill(0);
    queryGeom.setAttribute("position", new THREE.BufferAttribute(new Float32Array([qx, qy, qz]), 3));
    top.forEach((item, k) => {
      boosts[item.i] = 1;
      linePos[k * 6] = qx;
      linePos[k * 6 + 1] = qy;
      linePos[k * 6 + 2] = qz;
      linePos[k * 6 + 3] = positions[item.i * 3];
      linePos[k * 6 + 4] = positions[item.i * 3 + 1];
      linePos[k * 6 + 5] = positions[item.i * 3 + 2];
    });
    boostAttr.needsUpdate = true;
    (lineGeom.getAttribute("position") as THREE.BufferAttribute).needsUpdate = true;
    queryMat.opacity = 1;
    lineMat.opacity = 0.7;
    queryUntil = now + 1500;
    nextQueryAt = now + 4000;
    opts.onQuery({
      text,
      query: toScreen(qx, qy, qz),
      neighbors: top.map((item) => ({
        ...toScreen(positions[item.i * 3], positions[item.i * 3 + 1], positions[item.i * 3 + 2]),
        score: Math.min(0.99, Math.max(0.72, item.s)).toFixed(2),
      })),
    });
  };

  const pickCluster = () => {
    let best = -1;
    let bestD = 46;
    for (let c = 0; c < CLUSTERS.length; c++) {
      const center = CLUSTERS[c].center;
      const p = toScreen(center[0], center[1], center[2]);
      const d = Math.hypot(p.x - pointer.x, p.y - pointer.y);
      if (d < bestD) {
        bestD = d;
        best = c;
      }
    }
    const nextHover = best >= 0 ? { id: CLUSTERS[best].id, n: clusterCounts[best] } : null;
    const same = hover?.id === nextHover?.id && hover?.n === nextHover?.n;
    if (!same) {
      hover = nextHover;
      opts.onCluster(hover);
    }
  };

  const tick = (now: number) => {
    raf = requestAnimationFrame(tick);
    if (!active || !running) return;
    if (!reduced) {
      if (!dragging) {
        rotY += velY;
        rotX += velX;
        velY *= 0.96;
        velX *= 0.96;
        if (Math.abs(velY) < 0.0018) velY = 0.0018;
      }
      group.rotation.y = rotY;
      group.rotation.x = rotX;
      if (now > queryUntil && queryMat.opacity > 0) clearQuery();
      if (now >= nextQueryAt) fireQuery(now);
    }
    renderer.render(scene, camera);
  };

  const onPointerDown = (e: PointerEvent) => {
    dragging = true;
    lastX = e.clientX;
    lastY = e.clientY;
    canvas.style.cursor = "grabbing";
    canvas.setPointerCapture(e.pointerId);
  };
  const onPointerMove = (e: PointerEvent) => {
    const rect = canvas.getBoundingClientRect();
    pointer.x = e.clientX - rect.left;
    pointer.y = e.clientY - rect.top;
    pickCluster();
    if (!dragging) return;
    const dx = e.clientX - lastX;
    const dy = e.clientY - lastY;
    lastX = e.clientX;
    lastY = e.clientY;
    rotY += dx * 0.005;
    rotX += dy * 0.005;
    velY = dx * 0.0009;
    velX = dy * 0.0009;
  };
  const onPointerUp = (e: PointerEvent) => {
    dragging = false;
    canvas.style.cursor = "grab";
    try {
      canvas.releasePointerCapture(e.pointerId);
    } catch {
      /* already released */
    }
  };
  const onPointerLeave = () => {
    pointer.x = -10;
    pointer.y = -10;
    if (hover) {
      hover = null;
      opts.onCluster(null);
    }
  };

  canvas.style.cursor = "grab";
  canvas.addEventListener("pointerdown", onPointerDown);
  canvas.addEventListener("pointermove", onPointerMove);
  canvas.addEventListener("pointerup", onPointerUp);
  canvas.addEventListener("pointerleave", onPointerLeave);
  canvas.addEventListener("pointercancel", onPointerUp);

  const onVis = () => {
    running = document.visibilityState === "visible" && active;
  };
  document.addEventListener("visibilitychange", onVis);

  resize();
  running = document.visibilityState === "visible" && active;
  raf = requestAnimationFrame(tick);

  return {
    dispose: () => {
      cancelAnimationFrame(raf);
      document.removeEventListener("visibilitychange", onVis);
      canvas.removeEventListener("pointerdown", onPointerDown);
      canvas.removeEventListener("pointermove", onPointerMove);
      canvas.removeEventListener("pointerup", onPointerUp);
      canvas.removeEventListener("pointerleave", onPointerLeave);
      canvas.removeEventListener("pointercancel", onPointerUp);
      geometry.dispose();
      material.dispose();
      atlas.dispose();
      queryGeom.dispose();
      queryMat.dispose();
      lineGeom.dispose();
      lineMat.dispose();
      renderer.dispose();
    },
    resize,
    setActive: (on) => {
      active = on;
      running = on && document.visibilityState === "visible";
    },
    setTheme: applyTheme,
    setReduced: (on) => {
      reduced = on;
      if (on) clearQuery();
    },
  };
}
