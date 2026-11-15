import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";

export interface KeyboardRow {
  name: string;
  keys: { label: string; accent?: boolean }[];
}

export interface KeyboardHandle {
  dispose: () => void;
  setRunning: (running: boolean) => void;
  /** Выделение из доступного списка (клавиатура/скринридер). */
  setSelected: (label: string | null) => void;
  /** Перекраска без пересоздания сцены. */
  refreshTheme: () => void;
}

const KEY_W = 1.55;
const KEY_D = 1.55;
const KEY_H = 0.42;
const GAP = 0.16;
const LABEL_CELL = 256;

type ThemeSkin = {
  board: string;
  cap: string;
  capLabel: string;
  accent: string;
  accentLabel: string;
  ambient: number;
  keyLight: number;
  rim: number;
  emissive: number;
};

function cssVar(name: string, fallback: string): string {
  const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return value || fallback;
}

function readSkin(theme: "dark" | "light"): ThemeSkin {
  const ink = cssVar("--ink", theme === "dark" ? "#f3efe8" : "#1c1410");
  const bg2 = cssVar("--bg-2", theme === "dark" ? "#141110" : "#f0eae0");
  const bg3 = cssVar("--bg-3", theme === "dark" ? "#1c1816" : "#e8e0d3");
  const accent = cssVar("--accent", theme === "dark" ? "#c4562a" : "#b34a22");
  if (theme === "light") {
    return {
      board: bg3,
      cap: "#f6f0e6",
      capLabel: ink,
      accent,
      accentLabel: "#fbf7f0",
      ambient: 1.35,
      keyLight: 1.15,
      rim: 0.35,
      emissive: 0.22,
    };
  }
  return {
    board: "#100d0b",
    cap: bg2,
    capLabel: ink,
    accent,
    accentLabel: "#f8f4ee",
    ambient: 0.9,
    keyLight: 2.1,
    rim: 0.7,
    emissive: 0.34,
  };
}

/** Текстура-наклейка: прозрачный фон, подпись в 1–3 строки, шрифт подгоняется под ширину. */
function drawLabel(canvas: HTMLCanvasElement, text: string, color: string): void {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const w = canvas.width;
  const h = canvas.height;
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = color;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  const maxWidth = w * 0.86;
  const setFont = (size: number) => {
    ctx.font = `600 ${size}px "JetBrains Mono Variable", "JetBrains Mono", ui-monospace, monospace`;
  };
  const measure = (value: string) => ctx.measureText(value).width;

  // Переносим только по пробелам: «PostgreSQL» одной строкой читается лучше, чем «Postg»/«reSQL».
  const words = text.split(/\s+/).filter(Boolean);
  const splitWords = (parts: number): string[] | null => {
    if (words.length < parts) return null;
    return Array.from({ length: parts }, (_, i) =>
      words.slice(Math.round((i * words.length) / parts), Math.round(((i + 1) * words.length) / parts)).join(" "),
    );
  };

  const candidates: string[][] = [[text]];
  for (const parts of [2, 3]) {
    const split = splitWords(parts);
    if (split) candidates.push(split);
  }

  const fitSize = (lines: string[], from: number): number => {
    for (let size = from; size >= 12; size -= 1) {
      setFont(size);
      if (lines.every((line) => measure(line) <= maxWidth)) return size;
    }
    return 12;
  };

  let best = { lines: [text], size: 12 };
  for (const lines of candidates) {
    if (lines.some((line) => !line)) continue;
    const size = fitSize(lines, Math.floor(h * 0.3));
    if (size > best.size) best = { lines, size };
  }

  setFont(best.size);
  const lineHeight = best.size * 1.16;
  const top = h / 2 - ((best.lines.length - 1) * lineHeight) / 2;
  best.lines.forEach((line, i) => ctx.fillText(line, w / 2, top + i * lineHeight));
}

/** Изометрическая клавиатура стека. Возвращает handle: dispose + пауза рендера. */
export function createKeyboardScene(
  canvas: HTMLCanvasElement,
  rows: KeyboardRow[],
  options: {
    reduced?: boolean;
    onHover?: (key: { label: string } | null, x: number, y: number) => void;
    onSelect?: (label: string) => void;
  } = {},
): KeyboardHandle {
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: true,
    powerPreference: "low-power",
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const scene = new THREE.Scene();
  const aspect = canvas.clientWidth / Math.max(canvas.clientHeight, 1);
  const camera = new THREE.OrthographicCamera(-aspect, aspect, 1, -1, 0.1, 200);
  camera.position.set(9, 11, 9);
  camera.lookAt(0, 0, 0);

  const ambient = new THREE.AmbientLight(0xffffff, 1);
  const keyLight = new THREE.DirectionalLight(0xffffff, 1);
  keyLight.position.set(6, 12, 8);
  const rim = new THREE.DirectionalLight(0xffb27a, 0.6);
  rim.position.set(-8, 4, -6);
  scene.add(ambient, keyLight, rim);

  const group = new THREE.Group();
  scene.add(group);

  let skin = readSkin(document.documentElement.dataset.theme === "light" ? "light" : "dark");

  const maxPerRow = Math.max(...rows.map((row) => row.keys.length));
  const boardWidth = maxPerRow * (KEY_W + GAP) + 0.9;
  const boardDepth = rows.length * (KEY_D + GAP) + 0.9;

  const capGeometry = new RoundedBoxGeometry(KEY_W, KEY_H, KEY_D, 3, 0.1);
  const stickerGeometry = new THREE.PlaneGeometry(KEY_W * 0.94, KEY_D * 0.94);

  type Key = {
    mesh: THREE.Mesh;
    sticker: THREE.Mesh;
    label: string;
    row: number;
    texture: THREE.CanvasTexture;
    canvas: HTMLCanvasElement;
    baseY: number;
    lift: number;
    targetLift: number;
    accent: boolean;
  };
  const keys: Key[] = [];
  const disposables: Array<{ dispose: () => void }> = [capGeometry, stickerGeometry];

  rows.forEach((row, rowIndex) => {
    // startX уже центрирует ряд по его длине — дополнительный offset сдвигал короткие ряды вправо.
    const startX = -(row.keys.length * (KEY_W + GAP)) / 2 + KEY_W / 2;
    row.keys.forEach((key, keyIndex) => {
      const material = new THREE.MeshStandardMaterial({
        color: new THREE.Color(key.accent ? skin.accent : skin.cap),
        roughness: key.accent ? 0.5 : 0.62,
        metalness: 0.04,
        emissive: new THREE.Color(0x000000),
      });
      const textCanvas = document.createElement("canvas");
      textCanvas.width = LABEL_CELL;
      textCanvas.height = LABEL_CELL;
      const texture = new THREE.CanvasTexture(textCanvas);
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.anisotropy = 2;
      const stickerMaterial = new THREE.MeshBasicMaterial({
        map: texture,
        transparent: true,
        depthWrite: false,
        toneMapped: false,
      });

      const mesh = new THREE.Mesh(capGeometry, material);
      const x = startX + keyIndex * (KEY_W + GAP);
      const z = (rowIndex - (rows.length - 1) / 2) * (KEY_D + GAP);
      mesh.position.set(x, KEY_H / 2, z);
      const sticker = new THREE.Mesh(stickerGeometry, stickerMaterial);
      sticker.rotation.x = -Math.PI / 2;
      sticker.position.set(x, KEY_H + 0.004, z);
      group.add(mesh, sticker);
      disposables.push(material, stickerMaterial, texture);

      keys.push({
        mesh,
        sticker,
        label: key.label,
        row: rowIndex,
        texture,
        canvas: textCanvas,
        baseY: KEY_H / 2,
        lift: 0,
        targetLift: 0,
        accent: Boolean(key.accent),
      });
    });
  });

  const boardGeometry = new RoundedBoxGeometry(boardWidth, 0.5, boardDepth, 3, 0.14);
  const boardMaterial = new THREE.MeshStandardMaterial({
    color: new THREE.Color(skin.board),
    roughness: 0.8,
    metalness: 0.03,
  });
  const board = new THREE.Mesh(boardGeometry, boardMaterial);
  board.position.y = -0.26;
  group.add(board);
  disposables.push(boardGeometry, boardMaterial);

  /** Перекраска: цвета материалов, свет и подписи. Без пересоздания сцены. */
  const paint = () => {
    ambient.intensity = skin.ambient;
    keyLight.intensity = skin.keyLight;
    rim.intensity = skin.rim;
    boardMaterial.color.set(skin.board);
    for (const key of keys) {
      const material = key.mesh.material as THREE.MeshStandardMaterial;
      material.color.set(key.accent ? skin.accent : skin.cap);
      material.emissive.set(skin.accent);
      material.emissiveIntensity = 0;
      drawLabel(key.canvas, key.label, key.accent ? skin.accentLabel : skin.capLabel);
      key.texture.needsUpdate = true;
    }
  };

  let fontsPainted = false;
  const paintLabels = () => {
    if (fontsPainted) return;
    fontsPainted = true;
    paint();
  };
  paint();
  if (document.fonts?.ready) {
    document.fonts.ready.then(paintLabels).catch(paintLabels);
  } else {
    paintLabels();
  }

  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2(10, 10);
  const meshes = keys.map((key) => key.mesh);
  let hovered = -1;
  let selected = -1;
  let pointerX = 0;
  let pointerY = 0;
  let idleSince = performance.now();
  let idleWave = 0;
  let waveActive = false;

  const clearHover = () => {
    if (hovered >= 0) {
      keys[hovered].targetLift = selected === hovered ? 0.16 : 0;
      hovered = -1;
    }
    options.onHover?.(null, 0, 0);
    canvas.style.cursor = "default";
  };

  /** Raycast только по событию указателя, не в кадре. */
  const pick = (event: PointerEvent) => {
    const rect = canvas.getBoundingClientRect();
    pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    pointerX = event.clientX - rect.left;
    pointerY = event.clientY - rect.top;
    idleSince = performance.now();
    waveActive = false;
    raycaster.setFromCamera(pointer, camera);
    const hit = raycaster.intersectObjects(meshes, false)[0];
    if (!hit) {
      clearHover();
      return -1;
    }
    const index = meshes.indexOf(hit.object as THREE.Mesh);
    if (index < 0) return -1;
    if (index !== hovered) {
      if (hovered >= 0) keys[hovered].targetLift = selected === hovered ? 0.16 : 0;
      hovered = index;
      keys[index].targetLift = 0.24;
      options.onHover?.({ label: keys[index].label }, pointerX, pointerY);
    }
    canvas.style.cursor = "pointer";
    return index;
  };

  const onPointerMove = (event: PointerEvent) => {
    pick(event);
  };
  const onPointerLeave = () => {
    clearHover();
  };
  const onPointerDown = (event: PointerEvent) => {
    const index = pick(event);
    if (index < 0) return;
    options.onSelect?.(keys[index].label);
  };

  canvas.addEventListener("pointermove", onPointerMove);
  canvas.addEventListener("pointerleave", onPointerLeave);
  canvas.addEventListener("pointerdown", onPointerDown);

  const setSelected = (label: string | null) => {
    const previous = selected;
    selected = label ? keys.findIndex((key) => key.label === label) : -1;
    if (previous >= 0 && previous < keys.length) {
      keys[previous].targetLift = 0;
    }
    if (selected >= 0) keys[selected].targetLift = 0.16;
  };

  let running = true;
  let frame = 0;
  let last = performance.now();

  const tick = (now: number) => {
    frame = requestAnimationFrame(tick);
    if (!running) return;
    const delta = Math.min((now - last) / 1000, 0.05);
    last = now;

    // мягкий параллакс за курсором (в reduced motion сцена статична)
    if (!options.reduced) {
      const px = pointerX / Math.max(canvas.clientWidth, 1) - 0.5;
      const py = pointerY / Math.max(canvas.clientHeight, 1) - 0.5;
      group.rotation.y += (px * 0.16 - group.rotation.y) * Math.min(1, delta * 4);
      group.rotation.x += (py * 0.1 - group.rotation.x) * Math.min(1, delta * 4);

      // idle-волна по рядам вместо старой пасхалки COFFEE
      if (!waveActive && now - idleSince > 6000) {
        waveActive = true;
        idleWave = now;
      }
    }
    const waveT = waveActive ? (now - idleWave) / 1000 : -1;

    for (let i = 0; i < keys.length; i++) {
      const key = keys[i];
      let extra = 0;
      if (waveActive && waveT >= 0 && waveT < 1.2) {
        const pulse = Math.sin((waveT - key.row * 0.14) * Math.PI * 2);
        extra = Math.max(0, pulse) * 0.07;
      }
      const wanted = key.targetLift + extra;
      key.lift += (wanted - key.lift) * Math.min(1, delta * 12);
      key.mesh.position.y = key.baseY + key.lift;
      key.sticker.position.y = KEY_H + 0.004 + key.lift;
      const material = key.mesh.material as THREE.MeshStandardMaterial;
      const glow = key.targetLift > 0.01 || extra > 0.005;
      material.emissiveIntensity = glow ? skin.emissive : 0;
    }
    if (waveActive && waveT > 1.4) {
      waveActive = false;
      idleSince = performance.now();
    }

    renderer.render(scene, camera);
  };

  /** Frustum по проекции доски: ни одна клавиша не обрезается вплоть до 360px. */
  const resize = () => {
    const width = Math.max(canvas.clientWidth, 1);
    const height = Math.max(canvas.clientHeight, 1);
    const nextAspect = width / height;
    camera.updateMatrixWorld();
    const inv = camera.matrixWorldInverse;
    let maxX = 1;
    let maxY = 1;
    for (const sx of [-1, 1]) {
      for (const sy of [-0.55, KEY_H]) {
        for (const sz of [-1, 1]) {
          const corner = new THREE.Vector3((sx * boardWidth) / 2, sy, (sz * boardDepth) / 2).applyMatrix4(inv);
          maxX = Math.max(maxX, Math.abs(corner.x));
          maxY = Math.max(maxY, Math.abs(corner.y));
        }
      }
    }
    const half = Math.max(maxY, maxX / nextAspect) * 1.06;
    camera.left = -half * nextAspect;
    camera.right = half * nextAspect;
    camera.top = half;
    camera.bottom = -half;
    camera.updateProjectionMatrix();
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(width, height, false);
  };

  const observer = new ResizeObserver(resize);
  observer.observe(canvas);
  resize();
  frame = requestAnimationFrame(tick);

  return {
    dispose: () => {
      running = false;
      cancelAnimationFrame(frame);
      observer.disconnect();
      canvas.removeEventListener("pointermove", onPointerMove);
      canvas.removeEventListener("pointerleave", onPointerLeave);
      canvas.removeEventListener("pointerdown", onPointerDown);
      for (const item of disposables) item.dispose();
      renderer.dispose();
    },
    setRunning: (value: boolean) => {
      running = value;
      last = performance.now();
    },
    setSelected,
    refreshTheme: () => {
      skin = readSkin(document.documentElement.dataset.theme === "light" ? "light" : "dark");
      fontsPainted = true;
      paint();
    },
  };
}
