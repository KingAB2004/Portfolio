// Page background: a random geometric graph with a BFS wavefront sweeping
// through it, plus a layer of drifting dust. Per-frame work is all in the
// shaders; the CPU only recomputes BFS when a new source is picked.
// Full speed while the hero is on screen, 30 fps behind the content,
// and it steps down on its own if frames are slow.
import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.min.js";

const canvas = document.getElementById("bg");
const small = innerWidth < 900;
const N = small ? 120 : 190;
const K = 3;

// --- graph -------------------------------------------------------------------
const RX = 4.6, RY = 3.2, RZ = 2.6;
const pos = [];
while (pos.length < N) {
  const p = [(Math.random() * 2 - 1) * RX, (Math.random() * 2 - 1) * RY, (Math.random() * 2 - 1) * RZ];
  if ((p[0] / RX) ** 2 + (p[1] / RY) ** 2 + (p[2] / RZ) ** 2 > 1) continue;
  if (pos.some((q) => (q[0] - p[0]) ** 2 + (q[1] - p[1]) ** 2 + (q[2] - p[2]) ** 2 < 0.26)) continue;
  pos.push(p);
}
const adj = pos.map(() => new Set());
pos.forEach((p, i) => {
  pos
    .map((q, j) => [j, (q[0] - p[0]) ** 2 + (q[1] - p[1]) ** 2 + (q[2] - p[2]) ** 2])
    .filter(([j]) => j !== i)
    .sort((a, b) => a[1] - b[1])
    .slice(0, K)
    .forEach(([j]) => { adj[i].add(j); adj[j].add(i); });
});
const edges = [];
adj.forEach((s, i) => s.forEach((j) => { if (i < j) edges.push([i, j]); }));

const dist = new Float32Array(N);
let maxDist = 0, source = -1;
function bfs(src) {
  dist.fill(1e3);
  dist[src] = 0;
  const q = [src];
  for (let h = 0; h < q.length; h++) {
    const u = q[h];
    adj[u].forEach((v) => { if (dist[v] > dist[u] + 1) { dist[v] = dist[u] + 1; q.push(v); } });
  }
  maxDist = 0;
  dist.forEach((d) => { if (d < 1e3) maxDist = Math.max(maxDist, d); });
}

// --- renderer ----------------------------------------------------------------
const dpr = Math.min(devicePixelRatio || 1, 1.5);
const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: true, powerPreference: "high-performance" });
renderer.setPixelRatio(dpr);
renderer.setSize(innerWidth, innerHeight, false);
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(42, innerWidth / innerHeight, 0.1, 80);
camera.position.set(0, 0, 11);

const uniforms = {
  uFront: { value: -1 },
  uSrc: { value: 0 },
  uPx: { value: dpr },
  uTime: { value: 0 },
  uFade: { value: 1 },
  uBase: { value: new THREE.Color("#8a8276") },
  uHot: { value: new THREE.Color("#ffc95a") },
  uHot2: { value: new THREE.Color("#ff8a5b") },
  uDone: { value: new THREE.Color("#7f95e6") },
};

const shade = /* glsl */ `
  uniform float uFront; uniform vec3 uBase, uHot, uHot2, uDone;
  vec3 shade(float d, out float glow) {
    float x = uFront - d;
    glow = exp(-x * x * 2.0);
    float trail = smoothstep(0.0, 0.8, x) * (1.0 - smoothstep(3.0, 10.0, x));
    vec3 hot = mix(uHot2, uHot, glow);
    return mix(mix(uBase, uDone, trail * 0.85), hot, glow);
  }`;

// nodes: soft glowing sprites, additive
const nodeGeo = new THREE.BufferGeometry();
const nodePos = new Float32Array(N * 3);
pos.forEach((p, i) => nodePos.set(p, i * 3));
const nodeDist = new Float32Array(N);
nodeGeo.setAttribute("position", new THREE.BufferAttribute(nodePos, 3));
nodeGeo.setAttribute("aDist", new THREE.BufferAttribute(nodeDist, 1));
nodeGeo.setAttribute("aIdx", new THREE.BufferAttribute(new Float32Array(N).map((_, i) => i), 1));
const nodes = new THREE.Points(nodeGeo, new THREE.ShaderMaterial({
  uniforms, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
  vertexShader: /* glsl */ `
    attribute float aDist; attribute float aIdx;
    uniform float uPx, uSrc, uFront;
    varying float vDist; varying float vSrc;
    void main() {
      vDist = aDist; vSrc = step(abs(aIdx - uSrc), 0.5);
      float x = uFront - aDist;
      float pulse = exp(-x * x * 2.0);
      vec4 mv = modelViewMatrix * vec4(position, 1.0);
      gl_PointSize = (14.0 + pulse * 16.0 + vSrc * 14.0) * uPx * (10.0 / -mv.z);
      gl_Position = projectionMatrix * mv;
    }`,
  fragmentShader: /* glsl */ `
    uniform float uFade;
    varying float vDist; varying float vSrc;
    ${shade}
    void main() {
      float r = length(gl_PointCoord - 0.5) * 2.0;
      if (r > 1.0) discard;
      float glow; vec3 c = shade(vDist, glow);
      c = mix(c, uHot, vSrc);
      float core = smoothstep(0.42, 0.28, r);
      float halo = pow(1.0 - r, 2.2) * (0.25 + 0.75 * max(glow, vSrc));
      gl_FragColor = vec4(c * (core * 0.9 + halo), 1.0) * uFade;
    }`,
}));

// edges
const edgePos = new Float32Array(edges.length * 6);
const edgeDist = new Float32Array(edges.length * 2);
edges.forEach(([a, b], e) => { edgePos.set(pos[a], e * 6); edgePos.set(pos[b], e * 6 + 3); });
const edgeGeo = new THREE.BufferGeometry();
edgeGeo.setAttribute("position", new THREE.BufferAttribute(edgePos, 3));
edgeGeo.setAttribute("aDist", new THREE.BufferAttribute(edgeDist, 1));
const lines = new THREE.LineSegments(edgeGeo, new THREE.ShaderMaterial({
  uniforms, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
  vertexShader: /* glsl */ `
    attribute float aDist; varying float vDist;
    void main() { vDist = aDist; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
  fragmentShader: /* glsl */ `
    uniform float uFade;
    varying float vDist;
    ${shade}
    void main() { float glow; vec3 c = shade(vDist, glow); gl_FragColor = vec4(c * (0.45 + 0.9 * glow), 1.0) * uFade; }`,
}));

// dust
const DUST = small ? 350 : 700;
const dustPos = new Float32Array(DUST * 3);
const dustRnd = new Float32Array(DUST);
for (let i = 0; i < DUST; i++) {
  dustPos[i * 3] = (Math.random() - 0.5) * 30;
  dustPos[i * 3 + 1] = (Math.random() - 0.5) * 20;
  dustPos[i * 3 + 2] = (Math.random() - 0.5) * 14 - 2;
  dustRnd[i] = Math.random();
}
const dustGeo = new THREE.BufferGeometry();
dustGeo.setAttribute("position", new THREE.BufferAttribute(dustPos, 3));
dustGeo.setAttribute("aRnd", new THREE.BufferAttribute(dustRnd, 1));
const dust = new THREE.Points(dustGeo, new THREE.ShaderMaterial({
  uniforms, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
  vertexShader: /* glsl */ `
    uniform float uTime, uPx;
    attribute float aRnd; varying float vA; varying float vR;
    void main() {
      vec3 p = position;
      p.y += sin(uTime * 0.15 + aRnd * 30.0) * 0.4;
      p.x += cos(uTime * 0.1 + aRnd * 20.0) * 0.4;
      vec4 mv = modelViewMatrix * vec4(p, 1.0);
      vA = 0.35 + 0.65 * (0.5 + 0.5 * sin(uTime * 1.3 + aRnd * 60.0));
      vR = aRnd;
      gl_PointSize = (1.5 + aRnd * 2.5) * uPx * (10.0 / -mv.z);
      gl_Position = projectionMatrix * mv;
    }`,
  fragmentShader: /* glsl */ `
    uniform float uFade; uniform vec3 uHot, uDone, uBase;
    varying float vA; varying float vR;
    void main() {
      float r = length(gl_PointCoord - 0.5) * 2.0;
      if (r > 1.0) discard;
      vec3 c = vR < 0.5 ? uBase : (vR < 0.8 ? uDone : uHot);
      gl_FragColor = vec4(c * (1.0 - r) * vA * 0.55, 1.0) * (0.5 + 0.5 * uFade);
    }`,
}));
scene.add(dust);

const group = new THREE.Group();
group.add(lines, nodes);
scene.add(group);

function newSource() {
  // prefer a node on the outside so the wave has somewhere to travel
  let best = 0, bestR = -1;
  for (let tries = 0; tries < 8; tries++) {
    const i = (Math.random() * N) | 0;
    const r = (pos[i][0] / RX) ** 2 + (pos[i][1] / RY) ** 2;
    if (r > bestR && i !== source) { bestR = r; best = i; }
  }
  source = best;
  bfs(source);
  nodeDist.set(dist);
  edges.forEach(([a, b], e) => { edgeDist[e * 2] = dist[a]; edgeDist[e * 2 + 1] = dist[b]; });
  nodeGeo.attributes.aDist.needsUpdate = true;
  edgeGeo.attributes.aDist.needsUpdate = true;
  uniforms.uSrc.value = source;
  uniforms.uFront.value = -0.8;
}
newSource();

// --- where the graph sits as you scroll: [x, y, scale, fade] ---------------
const pathWide = [[3.4, 0.1, 1.0, 1], [-5, 0.3, 0.8, 0.3], [5.2, -0.2, 0.8, 0.28], [-5.2, 0.1, 0.8, 0.28], [5, 0.2, 0.8, 0.28], [0, 0.2, 0.95, 0.45]];
const pathNarrow = [[0.4, 2.2, 0.62, 0.5], [0, 0, 0.72, 0.3], [0, 0, 0.72, 0.28], [0, 0, 0.72, 0.28], [0, 0, 0.72, 0.28], [0, 0, 0.8, 0.34]];
const lerp = (a, b, t) => a + (b - a) * t;
function sample(path, p) {
  const f = Math.min(Math.max(p, 0), 1) * (path.length - 1);
  const i = Math.min(Math.floor(f), path.length - 2);
  const t = f - i, s = t * t * (3 - 2 * t);
  return path[i].map((v, k) => lerp(v, path[i + 1][k], s));
}

let scrollP = 0, inHero = true;
function readScroll() {
  const max = document.documentElement.scrollHeight - innerHeight;
  scrollP = max > 0 ? scrollY / max : 0;
  inHero = scrollY < innerHeight * 0.8;
}
addEventListener("scroll", readScroll, { passive: true });
readScroll();

function resize() {
  renderer.setSize(innerWidth, innerHeight, false);
  camera.aspect = innerWidth / innerHeight;
  camera.position.z = camera.aspect < 0.9 ? 14 : 11;
  camera.updateProjectionMatrix();
}
addEventListener("resize", resize);
resize();

const mouse = { x: 0, y: 0 };
addEventListener("pointermove", (e) => {
  mouse.x = e.clientX / innerWidth - 0.5;
  mouse.y = e.clientY / innerHeight - 0.5;
}, { passive: true });

// --- adaptive loop -------------------------------------------------------------
const levels = [{ px: dpr }, { px: 1 }, { px: 0.75 }];
let level = 0, slowMode = false, frozen = false, samples = [], lastT = 0, tick = 0;
const cur = { x: 3.4, y: 0.1, s: 1, f: 1 };
const clock = new THREE.Clock();
let ry = -0.4;

function setLevel(l) {
  level = l;
  renderer.setPixelRatio(levels[l].px);
  uniforms.uPx.value = levels[l].px;
  resize();
}

function frame(t) {
  if (lastT) samples.push(t - lastT);
  lastT = t;
  const every = slowMode || !inHero ? 2 : 1;
  if (samples.length >= 90) {
    const sorted = samples.slice().sort((a, b) => a - b);
    const median = sorted[45];
    if (median > (every === 2 ? 40 : 22)) {
      if (level < levels.length - 1) setLevel(level + 1);
      else if (!slowMode) slowMode = true;
      else { frozen = true; setRunning(); }
    }
    samples = [];
  }
  if (every > 1 && tick++ % every) return;

  const dt = Math.min(clock.getDelta(), 0.08);
  uniforms.uTime.value += dt;
  uniforms.uFront.value += dt * 1.7;
  if (uniforms.uFront.value > maxDist + 5) newSource();

  const [px, py, ps, pf] = sample(innerWidth < 900 ? pathNarrow : pathWide, scrollP);
  const k = Math.min(1, dt * 3);
  cur.x = lerp(cur.x, px, k); cur.y = lerp(cur.y, py, k); cur.s = lerp(cur.s, ps, k); cur.f = lerp(cur.f, pf, k);
  group.position.set(cur.x, cur.y, 0);
  group.scale.setScalar(cur.s);
  uniforms.uFade.value = cur.f;

  ry += dt * 0.05;
  group.rotation.y = lerp(group.rotation.y, ry + mouse.x * 0.5, k);
  group.rotation.x = lerp(group.rotation.x, 0.25 + mouse.y * 0.3, k);
  dust.rotation.y = mouse.x * 0.08;
  dust.rotation.x = mouse.y * 0.05;
  renderer.render(scene, camera);
}
function setRunning() {
  const on = !document.hidden && !frozen;
  if (on) { clock.getDelta(); lastT = 0; samples = []; }
  renderer.setAnimationLoop(on ? frame : null);
}
document.addEventListener("visibilitychange", setRunning);

group.position.set(cur.x, cur.y, 0);
group.rotation.set(0.25, ry, 0);
renderer.render(scene, camera);
canvas.classList.add("ready");
setRunning();
