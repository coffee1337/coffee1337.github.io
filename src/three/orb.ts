export type OrbMode = "assemble" | "hero" | "exit";

interface Palette {
  node: string;
  nodeDim: string;
  link: string;
  core: string;
  field: string;
  shell: string;
}

function paletteFor(theme: "dark" | "light"): Palette {
  if (theme === "light") {
    return {
      node: "#3a2f28",
      nodeDim: "#6e4fe0",
      link: "#2a241c",
      core: "#b6d234",
      field: "#8ea34a",
      shell: "#6e4fe0",
    };
  }
  return {
    node: "#f3ede4",
    nodeDim: "#b7a6ff",
    link: "#8b6cff",
    core: "#d6f25c",
    field: "#9aaa4a",
    shell: "#8b6cff",
  };
}

function fibonacci(count: number, irregular: boolean) {
  const pts = new Float32Array(count * 3);
  const golden = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < count; i++) {
    const y = 1 - (i / (count - 1)) * 2;
    const r = Math.sqrt(Math.max(0, 1 - y * y));
    const theta = golden * i;
    const wobble = irregular ? 1 + (((i * 37) % 17) - 8) / 220 : 1;
    pts[i * 3] = Math.cos(theta) * r * wobble;
    pts[i * 3 + 1] = y * wobble;
    pts[i * 3 + 2] = Math.sin(theta) * r * wobble;
  }
  return pts;
}

function nearest(base: Float32Array, count: number, keep: number) {
  const pairs: { i: number; j: number; d: number }[] = [];
  for (let i = 0; i < count; i++) {
    let best = 99;
    let second = 99;
    let ja = -1;
    let jb = -1;
    for (let j = i + 1; j < count; j++) {
      const dx = base[i * 3] - base[j * 3];
      const dy = base[i * 3 + 1] - base[j * 3 + 1];
      const dz = base[i * 3 + 2] - base[j * 3 + 2];
      const d = Math.sqrt(dx * dx + dy * dy + dz * dz);
      if (d < best) {
        second = best;
        jb = ja;
        best = d;
        ja = j;
      } else if (d < second) {
        second = d;
        jb = j;
      }
    }
    if (ja >= 0) pairs.push({ i, j: ja, d: best });
    if (jb >= 0 && second < 0.72) pairs.push({ i, j: jb, d: second });
  }
  pairs.sort((a, b) => a.d - b.d);
  return pairs.slice(0, keep);
}

function dustPoints(count: number, radius: number) {
  const pts = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const u = Math.random();
    const v = Math.random();
    const theta = 2 * Math.PI * u;
    const phi = Math.acos(2 * v - 1);
    const r = radius * (0.35 + Math.random() * 0.75);
    pts[i * 3] = r * Math.sin(phi) * Math.cos(theta);
    pts[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
    pts[i * 3 + 2] = r * Math.cos(phi);
  }
  return pts;
}

export interface OrbHandle {
  setMode: (mode: OrbMode) => void;
  setAssemble: (amount: number) => void;
  setTheme: (theme: "dark" | "light") => void;
  setReduced: (v: boolean) => void;
  setActive: (v: boolean) => void;
  resize: () => void;
  dispose: () => void;
}

const VERT = /* glsl */ `
  varying vec3 vNormal;
  varying vec3 vView;
  uniform float uTime;
  uniform float uAmp;
  void main() {
    vec3 p = position;
    float n = sin(p.x * 3.1 + uTime) * sin(p.y * 2.7 - uTime * 0.7) * sin(p.z * 3.4 + uTime * 0.4);
    p += normal * n * uAmp;
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    vNormal = normalize(normalMatrix * normal);
    vView = normalize(-mv.xyz);
    gl_Position = projectionMatrix * mv;
  }
`;

const FIELD_FRAG = /* glsl */ `
  varying vec3 vNormal;
  varying vec3 vView;
  uniform vec3 uColor;
  uniform float uStrength;
  void main() {
    float fres = pow(1.0 - abs(dot(normalize(vNormal), normalize(vView))), 1.8);
    float alpha = (0.035 + fres * 0.22) * uStrength;
    gl_FragColor = vec4(uColor, alpha);
  }
`;

const CORE_VERT = /* glsl */ `
  varying vec3 vNormal;
  varying vec3 vObj;
  varying vec3 vView;
  uniform float uTime;
  uniform float uAmp;
  void main() {
    vObj = position;
    float n = sin(position.y * 9.0 + uTime * 0.6) * sin(position.z * 8.0 - uTime * 0.4);
    vec3 p = position + normal * n * uAmp;
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    vNormal = normalize(normalMatrix * normal);
    vView = normalize(-mv.xyz);
    gl_Position = projectionMatrix * mv;
  }
`;

const CORE_FRAG = /* glsl */ `
  varying vec3 vNormal;
  varying vec3 vObj;
  varying vec3 vView;
  uniform vec3 uHot;
  uniform vec3 uMid;
  uniform vec3 uEdge;
  uniform vec3 uLight;
  uniform float uTime;
  uniform float uPulse;
  float hash(vec3 p) {
    return fract(sin(dot(p, vec3(127.1, 311.7, 74.7))) * 43758.5453);
  }
  float noise(vec3 p) {
    vec3 i = floor(p);
    vec3 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    float n = mix(mix(mix(hash(i), hash(i + vec3(1,0,0)), f.x), mix(hash(i + vec3(0,1,0)), hash(i + vec3(1,1,0)), f.x), f.y),
                  mix(mix(hash(i + vec3(0,0,1)), hash(i + vec3(1,0,1)), f.x), mix(hash(i + vec3(0,1,1)), hash(i + vec3(1,1,1)), f.x), f.y), f.z);
    return n;
  }
  void main() {
    vec3 n = normalize(vNormal);
    vec3 v = normalize(vView);
    float ndv = max(dot(n, v), 0.0);
    float fres = pow(1.0 - ndv, 1.7);
    float radial = clamp(length(vObj) / 0.2, 0.0, 1.0);
    float grain = noise(normalize(vObj) * 3.4 + vec3(uTime * 0.12, uLight.x * 0.4, 0.0));
    float filament = pow(0.5 + 0.5 * sin(vObj.y * 22.0 + grain * 5.0 + uTime * 0.7), 3.0);
    float flow = 0.5 + 0.5 * sin(dot(normalize(vObj), uLight) * 6.0 - uTime * 0.9);
    vec3 col = mix(uHot, uMid, smoothstep(0.05, 0.62, radial));
    col = mix(col, uEdge, smoothstep(0.38, 1.0, radial));
    col = mix(col, uHot, filament * 0.22 * (1.0 - radial));
    col += uHot * flow * 0.08 * (1.0 - radial);
    vec3 l = normalize(uLight);
    float spec = pow(max(dot(reflect(-l, n), v), 0.0), 18.0);
    float wrap = pow(max(dot(n, l), 0.0), 0.55);
    col *= 0.42 + 0.58 * wrap;
    col += uHot * spec * (0.45 + uPulse * 0.4);
    col += uMid * fres * (0.22 + uPulse * 0.2);
    gl_FragColor = vec4(col, 1.0);
  }
`;

const MEMBRANE_FRAG = /* glsl */ `
  varying vec3 vNormal;
  varying vec3 vView;
  uniform vec3 uColor;
  uniform float uAlpha;
  void main() {
    float fres = pow(1.0 - abs(dot(normalize(vNormal), normalize(vView))), 2.1);
    float alpha = fres * 0.5 * uAlpha;
    gl_FragColor = vec4(uColor, alpha);
  }
`;

export async function createOrb(
  canvas: HTMLCanvasElement,
  options: {
    theme: "dark" | "light";
    reduced: boolean;
    mobile: boolean;
    mode: OrbMode;
    getAssemble: () => number;
  },
): Promise<OrbHandle> {
  const THREE = await import("three");
  const count = options.mobile ? 70 : 130;
  const base = fibonacci(count, true);
  const keep = Math.round((options.mobile ? 52 : 96) );
  const pairs = nearest(base, count, keep);
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  const sizes = new Float32Array(count);
  const seeds = new Float32Array(count);
  for (let i = 0; i < count; i++) seeds[i] = ((i * 47) % 100) / 100;

  const linkPositions = new Float32Array(pairs.length * 6);
  const linkColors = new Float32Array(pairs.length * 6);
  const world = new Float32Array(count * 3);

  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: !options.mobile, powerPreference: "high-performance" });
  renderer.setClearColor(0x000000, 0);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, options.mobile ? 1.25 : 1.5));

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 20);
  camera.position.set(0, 0.05, 4.7);

  scene.add(new THREE.AmbientLight(0xffffff, options.theme === "dark" ? 0.35 : 0.6));
  const key = new THREE.DirectionalLight(0xf3ede4, 0.7);
  key.position.set(2.2, 1.6, 3);
  scene.add(key);
  const rim = new THREE.DirectionalLight(0x8b6cff, 0.45);
  rim.position.set(-2.5, -0.4, -1.5);
  scene.add(rim);

  const colorsNow = () => paletteFor(theme);
  let theme = options.theme;

  const pointGeometry = new THREE.BufferGeometry();
  pointGeometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  pointGeometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  pointGeometry.setAttribute("size", new THREE.BufferAttribute(sizes, 1));
  const pointsMat = new THREE.PointsMaterial({
    size: options.mobile ? 0.045 : 0.034,
    vertexColors: true,
    transparent: true,
    opacity: 0.95,
    depthWrite: false,
    sizeAttenuation: true,
  });
  scene.add(new THREE.Points(pointGeometry, pointsMat));

  const linkGeometry = new THREE.BufferGeometry();
  linkGeometry.setAttribute("position", new THREE.BufferAttribute(linkPositions, 3));
  linkGeometry.setAttribute("color", new THREE.BufferAttribute(linkColors, 3));
  const linkMat = new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, opacity: 0.0, depthWrite: false });
  scene.add(new THREE.LineSegments(linkGeometry, linkMat));

  const dustCount = options.mobile ? 36 : 70;
  const dustBase = dustPoints(dustCount, 0.85);
  const dustPositions = new Float32Array(dustCount * 3);
  const dustGeometry = new THREE.BufferGeometry();
  dustGeometry.setAttribute("position", new THREE.BufferAttribute(dustPositions, 3));
  const dustMat = new THREE.PointsMaterial({
    color: new THREE.Color(colorsNow().core),
    size: options.mobile ? 0.012 : 0.016,
    transparent: true,
    opacity: 0.45,
    depthWrite: false,
  });
  scene.add(new THREE.Points(dustGeometry, dustMat));

  const fieldUniforms = {
    uTime: { value: 0 },
    uAmp: { value: options.mobile ? 0.02 : 0.045 },
    uColor: { value: new THREE.Color(colorsNow().field) },
    uStrength: { value: options.theme === "dark" ? 0.28 : 0.16 },
  };
  const field = new THREE.Mesh(
    new THREE.SphereGeometry(0.62, options.mobile ? 28 : 40, options.mobile ? 20 : 28),
    new THREE.ShaderMaterial({
      uniforms: fieldUniforms,
      vertexShader: VERT,
      fragmentShader: FIELD_FRAG,
      transparent: true,
      depthWrite: false,
      side: THREE.FrontSide,
    }),
  );
  scene.add(field);

  const coreUniforms = {
    uTime: { value: 0 },
    uAmp: { value: options.mobile ? 0.004 : 0.008 },
    uHot: { value: new THREE.Color() },
    uMid: { value: new THREE.Color() },
    uEdge: { value: new THREE.Color() },
    uLight: { value: new THREE.Vector3(0.4, 0.5, 1) },
    uPulse: { value: 0 },
  };
  const core = new THREE.Mesh(
    new THREE.SphereGeometry(0.2, options.mobile ? 28 : 40, options.mobile ? 20 : 30),
    new THREE.ShaderMaterial({ uniforms: coreUniforms, vertexShader: CORE_VERT, fragmentShader: CORE_FRAG }),
  );
  scene.add(core);

  const membraneUniforms = {
    uTime: { value: 0 },
    uAmp: { value: options.mobile ? 0.012 : 0.028 },
    uColor: { value: new THREE.Color() },
    uAlpha: { value: 1 },
  };
  const membrane = new THREE.Mesh(
    new THREE.SphereGeometry(0.33, options.mobile ? 28 : 42, options.mobile ? 20 : 32),
    new THREE.ShaderMaterial({
      uniforms: membraneUniforms,
      vertexShader: VERT,
      fragmentShader: MEMBRANE_FRAG,
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
    }),
  );
  scene.add(membrane);

  const halo = new THREE.Mesh(
    new THREE.SphereGeometry(0.46, 20, 14),
    new THREE.MeshBasicMaterial({ color: new THREE.Color(colorsNow().core), transparent: true, opacity: 0.05, depthWrite: false }),
  );
  scene.add(halo);

  const shell = new THREE.Mesh(
    new THREE.SphereGeometry(1.16, options.mobile ? 28 : 40, options.mobile ? 20 : 30),
    new THREE.MeshBasicMaterial({
      color: new THREE.Color(colorsNow().shell),
      transparent: true,
      opacity: options.theme === "dark" ? 0.05 : 0.035,
      wireframe: false,
      depthWrite: false,
      side: THREE.BackSide,
    }),
  );
  scene.add(shell);

  let mode = options.mode;
  let reduced = options.reduced;
  let active = true;
  let pageVisible = true;
  let assemble = mode === "assemble" ? 0.05 : 1;
  let assembleTarget = assemble;
  let exit = mode === "exit" ? 1 : 0;
  let pointerX = 0;
  let pointerY = 0;
  let rotY = 0;
  let rotX = 0;
  let lightX = 0.35;
  let lightY = 0.45;
  let pulse = 0;
  let nextPulse = 9 + Math.random() * 6;
  const clock = new THREE.Clock();
  const linkColor = new THREE.Color();
  const nodeColor = new THREE.Color();
  const ivory = new THREE.Color();
  const violet = new THREE.Color();
  const lime = new THREE.Color();

  const paintPalette = () => {
    const p = colorsNow();
    ivory.set(p.node);
    violet.set(p.nodeDim);
    lime.set(p.core);
    linkColor.set(p.link);
    fieldUniforms.uColor.value.set(p.field);
    fieldUniforms.uStrength.value = theme === "dark" ? 0.28 : 0.16;
    const dark = theme === "dark";
    coreUniforms.uHot.value.set(dark ? "#f7f8c4" : "#d7e45a");
    coreUniforms.uMid.value.set(dark ? "#b6d63a" : "#7c9a1c");
    coreUniforms.uEdge.value.set(dark ? "#4e6820" : "#3f5518");
    membraneUniforms.uColor.value.set(dark ? "#d2e86a" : "#6d8624");
    membraneUniforms.uAlpha.value = dark ? 0.8 : 0.55;
    (halo.material as import("three").MeshBasicMaterial).color.set(dark ? "#d6f25c" : "#8ea83a");
    (halo.material as import("three").MeshBasicMaterial).opacity = dark ? 0.035 : 0.02;
    (shell.material as import("three").MeshBasicMaterial).color.set(p.shell);
    (shell.material as import("three").MeshBasicMaterial).opacity = theme === "dark" ? 0.05 : 0.04;
  };
  paintPalette();

  const resize = () => {
    const parent = canvas.parentElement;
    const w = parent?.clientWidth || canvas.clientWidth || 320;
    const h = parent?.clientHeight || canvas.clientHeight || 320;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, options.mobile ? 1.25 : 1.5));
    renderer.setSize(w, h, false);
    camera.aspect = 1;
    camera.updateProjectionMatrix();
  };
  resize();

  const onVis = () => {
    pageVisible = document.visibilityState === "visible";
  };
  document.addEventListener("visibilitychange", onVis);
  const onMove = (e: PointerEvent) => {
    if (reduced || mode !== "hero") return;
    const r = canvas.getBoundingClientRect();
    pointerX = ((e.clientX - r.left) / Math.max(r.width, 1)) * 2 - 1;
    pointerY = ((e.clientY - r.top) / Math.max(r.height, 1)) * 2 - 1;
  };
  window.addEventListener("pointermove", onMove, { passive: true });

  let raf = 0;
  const tick = () => {
    raf = requestAnimationFrame(tick);
    if (!active || !pageVisible) return;
    const dt = Math.min(clock.getDelta(), 0.05);
    const t = clock.elapsedTime;
    assembleTarget = options.getAssemble();
    const k = reduced ? 1 : Math.min(1, dt * 1.8);
    assemble += (assembleTarget - assemble) * k;
    const exitTarget = mode === "exit" ? 1 : 0;
    exit += (exitTarget - exit) * Math.min(1, dt * 2.2);
    const presence = 1 - exit;

    const targetY = (reduced ? 0 : t * 0.07) + (reduced ? 0 : pointerX * 0.09);
    const targetX = reduced ? 0 : pointerY * 0.06;
    rotY += (targetY - rotY) * (reduced ? 1 : Math.min(1, dt * 1.6));
    rotX += (targetX - rotX) * (reduced ? 1 : Math.min(1, dt * 1.6));

    const spread = 0.78 + assemble * 0.3;
    const scatter = (1 - assemble) * 1.55;
    const cY = Math.cos(rotY);
    const sY = Math.sin(rotY);
    const cX = Math.cos(rotX);
    const sX = Math.sin(rotX);

    let depthSum = 0;
    for (let i = 0; i < count; i++) {
      const drift = reduced ? 0 : Math.sin(t * 0.6 + seeds[i] * 6.2) * 0.012;
      const ang = seeds[i] * Math.PI * 2 + t * (reduced ? 0 : 0.15);
      let x = base[i * 3] * spread + Math.cos(ang) * scatter * (0.55 + seeds[i]) + drift;
      let y = base[i * 3 + 1] * spread + Math.sin(ang * 0.8) * scatter * 0.5;
      let z = base[i * 3 + 2] * spread + drift;
      const y1 = y * cX - z * sX;
      const z1 = y * sX + z * cX;
      const x2 = x * cY + z1 * sY;
      const z2 = -x * sY + z1 * cY;
      x = x2;
      y = y1;
      z = z2;
      const o = i * 3;
      positions[o] = x;
      positions[o + 1] = y;
      positions[o + 2] = z;
      world[o] = x;
      world[o + 1] = y;
      world[o + 2] = z;
      depthSum += z;
    }
    const depthAvg = depthSum / count;

    for (let i = 0; i < count; i++) {
      const z = world[i * 3 + 2];
      const depth = Math.max(0, Math.min(1, (z - depthAvg) / 1.15 + 0.5));
      const rare = seeds[i] > 0.93;
      nodeColor.copy(rare ? lime : seeds[i] > 0.62 ? violet : ivory);
      const dim = 0.28 + depth * 0.72;
      colors[i * 3] = nodeColor.r * dim;
      colors[i * 3 + 1] = nodeColor.g * dim;
      colors[i * 3 + 2] = nodeColor.b * dim;
      sizes[i] = (rare ? 1.7 : 0.7 + depth) * (options.mobile ? 0.8 : 1);
    }
    pointGeometry.attributes.position.needsUpdate = true;
    pointGeometry.attributes.color.needsUpdate = true;

    const linkFade = assemble < 0.55 ? 0 : Math.min(1, (assemble - 0.55) / 0.25);
    let written = 0;
    for (const pair of pairs) {
      const a = pair.i * 3;
      const b = pair.j * 3;
      const z = (world[a + 2] + world[b + 2]) * 0.5;
      const depth = Math.max(0, Math.min(1, (z - depthAvg) / 1.15 + 0.5));
    const shade = (0.08 + depth * 0.92) * linkFade;
      const travel = ((pair.i * 0.17 + t * 0.35) % 1);
      const spark = reduced ? 0 : Math.exp(-Math.pow((travel - 0.5) * 7.0, 2)) * (pair.i % 5 === 0 ? 0.55 : 0);
      const wave = pulse * Math.max(0, 1 - Math.abs(z) * 0.4);
      const boost = 1 + spark + wave;
      const shadeLit = shade * boost;
      const o = written * 6;
      linkPositions[o] = world[a];
      linkPositions[o + 1] = world[a + 1];
      linkPositions[o + 2] = world[a + 2];
      linkPositions[o + 3] = world[b];
      linkPositions[o + 4] = world[b + 1];
      linkPositions[o + 5] = world[b + 2];
      for (let c = 0; c < 6; c += 3) {
        linkColors[o + c] = Math.min(1, linkColor.r * shadeLit + spark * 0.35);
        linkColors[o + c + 1] = Math.min(1, linkColor.g * shadeLit + spark * 0.3);
        linkColors[o + c + 2] = Math.min(1, linkColor.b * shadeLit);
      }
      written++;
    }
    linkGeometry.setDrawRange(0, written * 2);
    linkGeometry.attributes.position.needsUpdate = true;
    linkGeometry.attributes.color.needsUpdate = true;

    field.rotation.y = -rotY * 0.45 + t * (reduced ? 0 : 0.03);
    field.rotation.x = rotX * 0.3;
    field.scale.setScalar(0.96 + assemble * 0.06);
    fieldUniforms.uTime.value = reduced ? 0 : t;
    if (!reduced && t > nextPulse) {
      pulse = 1;
      nextPulse = t + 8 + Math.random() * 7;
    }
    pulse = Math.max(0, pulse - dt * 0.55);
    lightX += ((reduced ? 0.35 : 0.35 + pointerX * 0.55) - lightX) * Math.min(1, dt * 1.4);
    lightY += ((reduced ? 0.45 : 0.45 - pointerY * 0.4) - lightY) * Math.min(1, dt * 1.4);
    coreUniforms.uLight.value.set(lightX, lightY, 1);
    coreUniforms.uPulse.value = pulse;
    coreUniforms.uTime.value = reduced ? 0.4 : t;
    for (let i = 0; i < dustCount; i++) {
      const spin = reduced ? 0 : t * 0.08;
      const cs = Math.cos(spin);
      const sn = Math.sin(spin);
      const x = dustBase[i * 3];
      const z = dustBase[i * 3 + 2];
      dustPositions[i * 3] = x * cs - z * sn;
      dustPositions[i * 3 + 1] = dustBase[i * 3 + 1] + (reduced ? 0 : Math.sin(t * 0.4 + i) * 0.02);
      dustPositions[i * 3 + 2] = x * sn + z * cs;
    }
    dustGeometry.attributes.position.needsUpdate = true;
    dustMat.opacity = (theme === "dark" ? 0.5 : 0.32) * presence * (0.75 + pulse * 0.4);
    membraneUniforms.uTime.value = reduced ? 0 : t;
    const breathe = reduced ? 0 : Math.sin(t * 1.15) * 0.012;
    core.scale.setScalar((0.92 + assemble * 0.1) * (1 + breathe));
    membrane.rotation.y = t * (reduced ? 0 : 0.07);
    membrane.rotation.x = -t * (reduced ? 0 : 0.035);
    membrane.scale.setScalar(1 + (reduced ? 0 : Math.sin(t * 0.7 + 0.5) * 0.03));
    halo.scale.setScalar(1 + breathe);
    shell.rotation.y = rotY * 0.25;

    pointsMat.opacity = 0.95 * presence;
    linkMat.opacity = (theme === "dark" ? 0.85 : 0.7) * presence;
    (field.material as import("three").ShaderMaterial).opacity = presence;
    (membrane.material as import("three").ShaderMaterial).opacity = presence;
    (halo.material as import("three").MeshBasicMaterial).opacity = (theme === "dark" ? 0.035 : 0.02) * assemble * presence;
    (shell.material as import("three").MeshBasicMaterial).opacity = (theme === "dark" ? 0.05 : 0.035) * presence;

    renderer.render(scene, camera);
    if (reduced && Math.abs(assemble - assembleTarget) < 0.01 && Math.abs(exit - exitTarget) < 0.01) {
      cancelAnimationFrame(raf);
      raf = 0;
    }
  };
  raf = requestAnimationFrame(tick);
  const wake = () => {
    if (!raf) raf = requestAnimationFrame(tick);
  };

  return {
    setMode: (next) => {
      mode = next;
      if (next !== "assemble") assembleTarget = 1;
      wake();
    },
    setAssemble: (amount) => {
      assembleTarget = amount;
      wake();
    },
    setTheme: (next) => {
      theme = next;
      paintPalette();
      wake();
    },
    setReduced: (v) => {
      reduced = v;
      fieldUniforms.uAmp.value = v ? 0 : options.mobile ? 0.02 : 0.045;
      membraneUniforms.uAmp.value = v ? 0 : options.mobile ? 0.012 : 0.028;
      coreUniforms.uAmp.value = v ? 0 : options.mobile ? 0.004 : 0.008;
      wake();
    },
    setActive: (v) => {
      active = v;
      if (v) wake();
    },
    resize,
    dispose: () => {
      active = false;
      if (raf) cancelAnimationFrame(raf);
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("pointermove", onMove);
      pointGeometry.dispose();
      linkGeometry.dispose();
      pointsMat.dispose();
      linkMat.dispose();
      dustGeometry.dispose();
      dustMat.dispose();
      field.geometry.dispose();
      (field.material as import("three").Material).dispose();
      core.geometry.dispose();
      (core.material as import("three").Material).dispose();
      membrane.geometry.dispose();
      (membrane.material as import("three").Material).dispose();
      halo.geometry.dispose();
      (halo.material as import("three").Material).dispose();
      shell.geometry.dispose();
      (shell.material as import("three").Material).dispose();
      renderer.dispose();
    },
  };
}
