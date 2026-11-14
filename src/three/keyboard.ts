import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";

export interface KeyboardRow {
  name: string;
  keys: { label: string; accent?: boolean; usedIn?: string[] }[];
}

export interface KeyboardHandle {
  dispose: () => void;
  setRunning: (running: boolean) => void;
}

const KEY_W = 1.55;
const KEY_D = 1.55;
const KEY_H = 0.42;
const GAP = 0.16;

function cssVar(name: string, fallback: string): string {
  if (typeof window === "undefined") return fallback;
  const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return value || fallback;
}

function labelTexture(text: string, color: string): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  const size = 256;
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (ctx) {
    ctx.clearRect(0, 0, size, size);
    ctx.fillStyle = color;
    ctx.font = "600 44px ui-monospace, 'JetBrains Mono', monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    const short = text.length > 8 ? text.slice(0, 8) : text;
    ctx.fillText(short, size / 2, size / 2);
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 2;
  return texture;
}

/** Изометрическая клавиатура стека. Возвращает handle: dispose + пауза рендера. */
export function createKeyboardScene(
  canvas: HTMLCanvasElement,
  rows: KeyboardRow[],
  options: { onHover?: (key: { label: string; usedIn: string[] } | null, x: number, y: number) => void; onSelect?: (label: string) => void } = {},
): KeyboardHandle {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: "low-power" });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

  const scene = new THREE.Scene();
  const aspect = canvas.clientWidth / Math.max(canvas.clientHeight, 1);
  const frustum = 9;
  const camera = new THREE.OrthographicCamera(-frustum * aspect, frustum * aspect, frustum, -frustum, 0.1, 100);
  camera.position.set(9, 11, 9);
  camera.lookAt(0, 0, 0);

  scene.add(new THREE.AmbientLight(0xffffff, 1.5));
  const dir = new THREE.DirectionalLight(0xffffff, 2.2);
  dir.position.set(6, 12, 8);
  scene.add(dir);
  const rim = new THREE.DirectionalLight(0xffb27a, 0.7);
  rim.position.set(-8, 4, -6);
  scene.add(rim);

  const group = new THREE.Group();
  scene.add(group);

  const baseColor = new THREE.Color(cssVar("--bg-2", "#141110"));
  const capColor = new THREE.Color(cssVar("--bg-3", "#1c1816"));
  const accentColor = new THREE.Color(cssVar("--accent", "#c4562a"));
  const accent2 = new THREE.Color(cssVar("--accent-2", "#d9a066"));
  const inkColor = cssVar("--ink", "#f3efe8");

  const capGeometry = new RoundedBoxGeometry(KEY_W, KEY_H, KEY_D, 3, 0.1);
  const keys: { mesh: THREE.Mesh; label: string; usedIn: string[]; baseY: number; press: number; target: number; accent: boolean }[] = [];
  const disposables: Array<{ dispose: () => void }> = [capGeometry];

  const maxPerRow = Math.max(...rows.map((row) => row.keys.length));

  rows.forEach((row, rowIndex) => {
    const width = row.keys.length * (KEY_W + GAP);
    const startX = -width / 2 + KEY_W / 2;
    row.keys.forEach((key, keyIndex) => {
      const material = new THREE.MeshStandardMaterial({
        color: key.accent ? accentColor : capColor,
        roughness: 0.55,
        metalness: 0.08,
      });
      const texture = labelTexture(key.label, key.accent ? "#0c0a09" : inkColor);
      material.map = texture;
      material.emissive = new THREE.Color(0x000000);
      disposables.push(material, texture);

      const mesh = new THREE.Mesh(capGeometry, material);
      const x = startX + keyIndex * (KEY_W + GAP) + (maxPerRow - row.keys.length) * (KEY_W + GAP) * 0.5;
      const z = (rowIndex - (rows.length - 1) / 2) * (KEY_D + GAP);
      mesh.position.set(x, KEY_H / 2, z);
      mesh.userData.index = keys.length;
      group.add(mesh);
      keys.push({
        mesh,
        label: key.label,
        usedIn: key.usedIn ?? [],
        baseY: KEY_H / 2,
        press: 0,
        target: 0,
        accent: Boolean(key.accent),
      });
    });
  });

  // корпус-подложка
  const boardWidth = maxPerRow * (KEY_W + GAP) + 0.9;
  const boardDepth = rows.length * (KEY_D + GAP) + 0.9;
  const boardGeometry = new RoundedBoxGeometry(boardWidth, 0.5, boardDepth, 3, 0.14);
  const boardMaterial = new THREE.MeshStandardMaterial({ color: baseColor, roughness: 0.75, metalness: 0.05 });
  const board = new THREE.Mesh(boardGeometry, boardMaterial);
  board.position.y = -0.26;
  group.add(board);
  disposables.push(boardGeometry, boardMaterial);

  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2(10, 10);
  let hovered = -1;
  let pointerX = 0;
  let pointerY = 0;
  let idleSince = performance.now();
  let easterRunning = false;

  const setPointer = (event: PointerEvent | MouseEvent) => {
    const rect = canvas.getBoundingClientRect();
    pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    pointerX = pointer.x;
    pointerY = pointer.y;
    idleSince = performance.now();
  };

  const onMove = (event: PointerEvent) => setPointer(event);
  const onLeave = () => {
    pointer.set(10, 10);
    if (hovered >= 0) {
      keys[hovered].target = 0;
      hovered = -1;
      options.onHover?.(null, 0, 0);
    }
  };
  const onClick = () => {
    if (hovered < 0) return;
    const key = keys[hovered];
    key.press = 1;
    options.onSelect?.(key.label);
    idleSince = performance.now();
  };

  canvas.addEventListener("pointermove", onMove);
  canvas.addEventListener("pointerleave", onLeave);
  canvas.addEventListener("pointerdown", onClick);

  let running = true;
  let frame = 0;
  let last = performance.now();

  const tick = (now: number) => {
    if (!running) return;
    const delta = Math.min((now - last) / 1000, 0.05);
    last = now;

    // параллакс
    group.rotation.y += (pointerX * 0.18 - group.rotation.y) * 0.06;
    group.rotation.x += (-pointerY * 0.12 - group.rotation.x) * 0.06;

    raycaster.setFromCamera(pointer as THREE.Vector2, camera);
    const hit = raycaster.intersectObjects(keys.map((key) => key.mesh), false)[0];
    if (hit) {
      const index = hit.object.userData.index as number;
      if (index !== hovered) {
        if (hovered >= 0) keys[hovered].target = 0;
        hovered = index;
        keys[index].target = 1;
        const rect = canvas.getBoundingClientRect();
        options.onHover?.(
          { label: keys[index].label, usedIn: keys[index].usedIn },
          ((pointer.x + 1) / 2) * rect.width,
          ((1 - pointer.y) / 2) * rect.height,
        );
      }
    }

    // пасхалка: COFFEE после 6 с простоя
    if (!easterRunning && now - idleSince > 6000) {
      easterRunning = true;
      const word = "COFFEE";
      [...word].forEach((letter, i) => {
        window.setTimeout(() => {
          const index = keys.findIndex((key) => key.label.toUpperCase().startsWith(letter));
          if (index >= 0) {
            keys[index].press = 1;
            window.setTimeout(() => {
              keys[index].press = 0;
            }, 140);
          }
        }, i * 170);
      });
      window.setTimeout(() => {
        easterRunning = false;
        idleSince = performance.now();
      }, word.length * 170 + 400);
    }

    for (const key of keys) {
      key.press += (0 - key.press) * Math.min(delta * 9, 1);
      const ease = key.target * 0.22;
      key.mesh.position.y = key.baseY - ease - key.press * 0.18;
      const material = key.mesh.material as THREE.MeshStandardMaterial;
      const wanted = key.target > 0.5 ? new THREE.Color(cssVar("--accent-glow", "#3a1a0e")) : new THREE.Color(0x000000);
      material.emissive.lerp(wanted, 0.15);
      if (key.accent) material.color.lerp(accent2, 0.02);
    }

    renderer.render(scene, camera);
    frame = requestAnimationFrame(tick);
  };

  const resize = () => {
    const width = canvas.clientWidth;
    const height = Math.max(canvas.clientHeight, 1);
    const nextAspect = width / height;
    camera.left = -frustum * nextAspect;
    camera.right = frustum * nextAspect;
    camera.top = frustum;
    camera.bottom = -frustum;
    camera.updateProjectionMatrix();
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
      canvas.removeEventListener("pointermove", onMove);
      canvas.removeEventListener("pointerleave", onLeave);
      canvas.removeEventListener("pointerdown", onClick);
      for (const item of disposables) item.dispose();
      renderer.dispose();
    },
    setRunning: (value: boolean) => {
      if (value === running) return;
      running = value;
      if (running) {
        last = performance.now();
        frame = requestAnimationFrame(tick);
      } else {
        cancelAnimationFrame(frame);
      }
    },
  };
}
