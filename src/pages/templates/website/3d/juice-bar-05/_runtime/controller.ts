// Runs the single WebGL canvas. The cup follows whichever [data-anchor] box is
// most in view, so HTML layout decides where the 3D goes. Nothing here hides
// content: posters and the flat SVG cup stay in the page until 3D is live.
import type { Band, CupScene, FruitKind } from './scene';

declare global {
  interface Window {
    juiceIdentity: { sample: string; read: () => { name: string } };
  }
}
type Mode = 'hero' | 'menu' | 'layers' | 'build' | 'collect';
const root = document.documentElement;
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
const phone = matchMedia('(max-width: 700px), (pointer: coarse)');
const layout = document.querySelector<HTMLElement>('[data-stage]')!;
const anchors = [...document.querySelectorAll<HTMLElement>('[data-anchor]')];
const layersTrack = document.querySelector<HTMLElement>('[data-layers]')!;
const layersPin = layersTrack.querySelector<HTMLElement>('.layers-pin')!;
const labels = [...document.querySelectorAll<HTMLElement>('[data-layer]')];
const dragZone = document.querySelector<HTMLElement>('[data-drag]')!;

const model = {
  drink: { colour: '#ffb029', fruit: ['mango', 'pineapple'] as FruitKind[] },
  build: [] as Band[],
  finished: [] as Band[],
};
let scene: CupScene | undefined;
let canvas: HTMLCanvasElement | undefined;
let ready = false,
  frame = 0,
  last = 0,
  busyUntil = 0,
  mode: Mode | '' = '',
  userSpin = 0,
  spinVelocity = 0,
  lastDrag = 0,
  dragging = false,
  dragX = 0,
  scrollVelocity = 0,
  lastScrollY = scrollY,
  lastScrollAt = performance.now(),
  slowSince = 0,
  slowFrames = 0,
  explode = 0;

const name = () => window.juiceIdentity.read().name || window.juiceIdentity.sample;
const dpr = () => Math.min(devicePixelRatio || 1, phone.matches ? 1.5 : 2);

function kick(ms = 600) {
  if (!ready || !scene) return;
  busyUntil = Math.max(busyUntil, performance.now() + ms);
  if (!frame && !document.hidden) frame = requestAnimationFrame(tick);
}

// The page talks to the cup through this object. Every call is safe before
// 3D has loaded (or after it has fallen back): the model is kept regardless.
export const stage = {
  live: () => ready,
  setDrink(colour: string, fruit: string[]) {
    model.drink = { colour, fruit: fruit as FruitKind[] };
    if (scene && (mode === 'hero' || mode === 'menu' || mode === 'layers')) applyMode(mode);
    kick(1400);
  },
  setBuild(bands: Band[]) {
    model.build = bands;
    if (scene && mode === 'build') scene.setBands(bands);
    kick(1000);
  },
  setFinished(bands: Band[]) {
    model.finished = bands;
    if (scene && mode === 'collect') scene.setBands(bands);
    kick(1000);
  },
  fly(kind: string, from: Element, land: () => void) {
    if (!scene || mode !== 'build') return land();
    const r = from.getBoundingClientRect();
    scene.fly(kind as FruitKind, r.left + r.width / 2, r.top + r.height / 2, land);
    kick(1500);
  },
  blend(colour: string, done: () => void) {
    if (!scene || mode !== 'build') return done();
    scene.blend(colour);
    kick(2400);
    setTimeout(done, 1300);
  },
};

function applyMode(next: Mode) {
  if (!scene) return;
  const look = scene.look;
  const narrow = innerWidth < 700;
  Object.assign(look, {
    lid: next !== 'build',
    straw: next !== 'build',
    sleeve: next === 'hero' || next === 'menu' || next === 'collect',
    orbit: next === 'hero' || (next === 'menu' && !narrow),
  });
  if (next === 'build') scene.setBands(model.build);
  else if (next === 'collect')
    scene.setBands(
      model.finished.length ? model.finished : [{ colour: model.drink.colour, height: 2 }],
    );
  else scene.setBands([{ colour: model.drink.colour, height: 2 }]);
  scene.setOrbit(model.drink.fruit);
  scene.setExplodeColour(model.drink.colour);
}

// Cup extents in cup units for each mode: [bottom, top, width].
const extents: Record<Mode, [number, number, number]> = {
  // Hero and menu include the orbiting fruit, so it never crosses the copy.
  hero: [-0.1, 4.15, 3.7],
  menu: [-0.1, 4.15, 3.7],
  layers: [-0.4, 4.6, 3.0],
  build: [-0.05, 2.75, 2.3],
  collect: [-0.1, 4.15, 2.5],
};
function visibleShare(r: DOMRect) {
  const shown = Math.min(r.bottom, innerHeight) - Math.max(r.top, 0);
  return r.width > 0 ? Math.max(0, shown) / Math.max(1, Math.min(r.height, innerHeight)) : 0;
}
function explodeAt(progress: number) {
  const up = (progress - 0.12) / 0.26,
    down = (progress - 0.68) / 0.16;
  if (progress < 0.12 || progress > 0.84) return 0;
  if (progress < 0.38) return 1 - Math.pow(1 - up, 3);
  if (progress < 0.68) return 1;
  return 1 - down * down;
}

function target(now: number) {
  let best: HTMLElement | undefined,
    share = 0.3;
  for (const anchor of anchors) {
    const s = visibleShare(anchor.getBoundingClientRect());
    if (s > share + 0.02) {
      best = anchor;
      share = s;
    }
  }
  const next = (best?.dataset.anchor as Mode) || '';
  if (next && next !== mode) {
    mode = next;
    applyMode(next);
    busyUntil = Math.max(busyUntil, now + 1400);
  }
  const pose = { ...scene!.pose, visible: best ? 1 : 0 };
  if (!best || !mode) return pose;
  const r = best.getBoundingClientRect();
  const [bottom, top, wide] = extents[mode];
  const s = Math.min(r.height / (top - bottom), r.width / wide);
  pose.scale = s;
  pose.x = r.left + r.width / 2 - innerWidth / 2;
  pose.y = innerHeight / 2 - (r.top + r.height / 2) - (s * (top + bottom)) / 2;
  // Drag spin with inertia; drifts back to face front after a pause.
  if (!dragging) {
    userSpin += spinVelocity;
    spinVelocity *= 0.92;
    if (now - lastDrag > 2600)
      userSpin += (Math.round(userSpin / (2 * Math.PI)) * 2 * Math.PI - userSpin) * 0.04;
  }
  const idle = mode === 'hero' || mode === 'menu' ? Math.sin(now * 0.0006) * 0.32 : 0;
  pose.spin = userSpin + idle + (mode === 'build' ? -0.3 : 0);
  const lean = Math.max(-0.22, Math.min(0.22, scrollVelocity * 0.12));
  pose.tilt = (mode === 'build' ? 0.24 : 0.14) + lean;
  pose.sway = -lean * 0.4;
  scrollVelocity *= 0.86;
  if (mode === 'layers') {
    const t = layersTrack.getBoundingClientRect();
    const progress = Math.min(1, Math.max(0, -t.top / Math.max(1, t.height - innerHeight)));
    explode = explodeAt(progress);
    pose.spin = userSpin + 0.35 - explode * 0.35;
  } else explode = 0;
  scene!.look.explode = explode;
  return pose;
}

function placeLabels() {
  if (!scene) return;
  const wideLabels = innerWidth >= 700 && mode === 'layers';
  const pin = layersPin.getBoundingClientRect();
  const points = wideLabels ? scene.layerPoints() : [];
  let floor = -Infinity;
  labels.forEach((li, i) => {
    li.style.setProperty('--o', String(mode === 'layers' ? explode : 0));
    if (!wideLabels) {
      li.style.removeProperty('--x');
      li.style.removeProperty('--y');
      return;
    }
    li.style.setProperty('--x', Math.round(points[i].x - pin.left + 28) + 'px');
    // Top to bottom: never let a label overlap the one above it.
    const y = Math.max(floor, points[i].y - pin.top - li.offsetHeight / 2);
    floor = y + li.offsetHeight + 10;
    li.style.setProperty('--y', Math.round(y) + 'px');
  });
}

function tick(now: number) {
  frame = 0;
  if (!scene || !ready || document.hidden) return;
  // Long gaps mean the browser is throttling a background page: don't count
  // them as slow rendering.
  if (last && now - last > 250) {
    slowSince = 0;
    slowFrames = 0;
  }
  const dt = last ? Math.min(0.05, (now - last) / 1000) : 1 / 60;
  last = now;
  const goal = target(now);
  const moving = scene.update(dt, goal, mode === 'layers' ? 18 : 9);
  scene.render();
  placeLabels();
  root.dataset.rendering = 'active';
  if (canvas) canvas.dataset.frames = String(Number(canvas.dataset.frames || 0) + 1);
  // Sustained low frame rate (two seconds under 24 fps) falls back to posters.
  if (!slowSince) slowSince = now;
  slowFrames++;
  if (now - slowSince > 2000) {
    const fps = ((slowFrames - 1) * 1000) / (now - slowSince);
    if (canvas) canvas.dataset.fps = fps.toFixed(1);
    if (fps < 24) return fallback('low-frame-rate');
    slowSince = now;
    slowFrames = 0;
  }
  const idleHero = (mode === 'hero' || mode === 'menu') && now < busyUntil;
  if (moving || dragging || idleHero || now < busyUntil || Math.abs(spinVelocity) > 0.001)
    frame = requestAnimationFrame(tick);
  else {
    last = 0;
    slowSince = 0;
    slowFrames = 0;
    root.dataset.rendering = 'paused';
  }
}

function fallback(reason: string) {
  cancelAnimationFrame(frame);
  frame = 0;
  ready = false;
  root.dataset.three = 'fallback';
  root.dataset.fallback = reason;
  root.dataset.rendering = 'paused';
  labels.forEach((li) => li.removeAttribute('style'));
  scene?.dispose();
  scene = undefined;
  canvas?.remove();
  canvas = undefined;
}

function resize() {
  if (!scene) return;
  scene.resize(innerWidth, innerHeight, dpr());
  kick(400);
}

async function start() {
  if (scene || ready) return;
  if (reduced.matches) {
    root.dataset.three = 'static';
    root.dataset.fallback = 'reduced-motion';
    return;
  }
  // A cheap check first; the renderer itself makes the only real context and
  // falls back below if the browser refuses it.
  if (!('WebGL2RenderingContext' in window)) return fallback('webgl-unavailable');
  try {
    const [{ createCupScene }] = await Promise.all([
      import('./scene'),
      Promise.race([
        document.fonts.load('150px "Bagel Fat One"'),
        new Promise((r) => setTimeout(r, 1500)),
      ]),
    ]);
    if (reduced.matches) return;
    const style = getComputedStyle(root);
    canvas = document.createElement('canvas');
    layout.append(canvas);
    scene = await createCupScene(canvas, {
      mobile: phone.matches,
      ink: style.getPropertyValue('--brand').trim() || '#12402a',
      accent: style.getPropertyValue('--accent').trim() || '#d61f5e',
    });
    scene.resize(innerWidth, innerHeight, dpr());
    scene.setName(name());
    const first = target(performance.now());
    Object.assign(scene.pose, first, { visible: 0 });
    applyMode((mode || 'hero') as Mode);
    await scene.prepare();
    if (!scene) return;
    canvas.addEventListener('webglcontextlost', (event) => {
      event.preventDefault();
      fallback('context-lost');
    });
    ready = true;
    root.dataset.three = 'live';
    delete root.dataset.fallback;
    kick(4200);
  } catch {
    fallback('webgl-unavailable');
  }
}

// Input
addEventListener(
  'scroll',
  () => {
    const now = performance.now();
    const v = (scrollY - lastScrollY) / Math.max(8, now - lastScrollAt);
    lastScrollY = scrollY;
    lastScrollAt = now;
    scrollVelocity = scrollVelocity * 0.5 + v * 0.5;
    scene?.slosh(Math.abs(v) * 0.03);
    kick(700);
  },
  { passive: true },
);
addEventListener('resize', resize);
dragZone.addEventListener('pointerdown', (event) => {
  if (!ready || event.button > 0) return;
  dragging = true;
  dragX = event.clientX;
  lastDrag = performance.now();
  dragZone.setPointerCapture(event.pointerId);
  kick(800);
});
dragZone.addEventListener('pointermove', (event) => {
  if (!dragging) return;
  const dx = event.clientX - dragX;
  dragX = event.clientX;
  userSpin += dx * 0.012;
  spinVelocity = dx * 0.006;
  lastDrag = performance.now();
  scene?.slosh(Math.abs(dx) * 0.004);
  kick(800);
});
for (const type of ['pointerup', 'pointercancel', 'lostpointercapture'])
  dragZone.addEventListener(type, () => {
    dragging = false;
    kick(1600);
  });
dragZone.addEventListener('keydown', (event) => {
  if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
  event.preventDefault();
  spinVelocity = event.key === 'ArrowLeft' ? -0.05 : 0.05;
  lastDrag = performance.now();
  kick(1600);
});
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    cancelAnimationFrame(frame);
    frame = 0;
    last = 0;
  } else kick(400);
});
addEventListener('juice-identity-change', () => {
  scene?.setName(name());
  kick(400);
});
reduced.addEventListener('change', () => {
  if (reduced.matches) {
    fallback('reduced-motion');
    root.dataset.three = 'static';
  } else void start();
});
addEventListener('pagehide', () => {
  cancelAnimationFrame(frame);
  frame = 0;
});
addEventListener('pageshow', (event) => {
  if (event.persisted) kick(600);
});

// Leave the first moments to the loader, text and input; then load 3D on idle.
const begin = () => {
  const wait = Math.max(0, 1600 - performance.now());
  setTimeout(() => {
    if ('requestIdleCallback' in window) requestIdleCallback(() => void start(), { timeout: 2000 });
    else void start();
  }, wait);
};
if (document.readyState === 'complete') begin();
else addEventListener('load', begin, { once: true });
