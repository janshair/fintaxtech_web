// Runs the single WebGL canvas. The cup follows whichever [data-anchor] box is
// most in view, so HTML layout decides where the 3D goes. Nothing here hides
// content: posters and the flat SVG cup stay in the page until 3D is live.
// The loop, guards and input helpers are shared with the other 3D templates.
import type { Band, CupScene, FruitKind } from './scene';
import {
  businessName,
  createRenderLoop,
  explodeAt,
  onDrag,
  onScrollVelocity,
  phone,
  pickAnchor,
  pixelRatio,
  reducedMotion,
  root,
  startWhenIdle,
  trackProgress,
  webgl2,
} from '../../../../../../lib/three-template/runtime';

type Mode = 'hero' | 'menu' | 'layers' | 'build' | 'collect';
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
  mode: Mode | '' = '',
  userSpin = 0,
  spinVelocity = 0,
  lastDrag = 0,
  scrollVelocity = 0,
  explode = 0;

const loop = createRenderLoop({
  frame: tick,
  enabled: () => ready && !!scene,
  canvas: () => canvas,
  onSlow: () => fallback('low-frame-rate'),
});
const kick = loop.kick;

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
function target(now: number) {
  const best = pickAnchor(anchors);
  const next = (best?.dataset.anchor as Mode) || '';
  if (next && next !== mode) {
    mode = next;
    applyMode(next);
    kick(1400);
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
  if (!drag.dragging()) {
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
    explode = explodeAt(trackProgress(layersTrack));
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

function tick(now: number, dt: number) {
  const goal = target(now);
  const moving = scene!.update(dt, goal, mode === 'layers' ? 18 : 9);
  scene!.render();
  placeLabels();
  return moving || drag.dragging() || Math.abs(spinVelocity) > 0.001;
}

function fallback(reason: string) {
  loop.stop();
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
  scene.resize(innerWidth, innerHeight, pixelRatio());
  kick(400);
}

async function start() {
  if (scene || ready) return;
  if (reducedMotion.matches) {
    root.dataset.three = 'static';
    root.dataset.fallback = 'reduced-motion';
    return;
  }
  // A cheap check first; the renderer itself makes the only real context and
  // falls back below if the browser refuses it.
  if (!webgl2()) return fallback('webgl-unavailable');
  try {
    const [{ createCupScene }] = await Promise.all([
      import('./scene'),
      Promise.race([
        document.fonts.load('150px "Bagel Fat One"'),
        new Promise((r) => setTimeout(r, 1500)),
      ]),
    ]);
    if (reducedMotion.matches) return;
    const style = getComputedStyle(root);
    canvas = document.createElement('canvas');
    layout.append(canvas);
    scene = await createCupScene(canvas, {
      mobile: phone.matches,
      ink: style.getPropertyValue('--brand').trim() || '#12402a',
      accent: style.getPropertyValue('--accent').trim() || '#d61f5e',
    });
    scene.resize(innerWidth, innerHeight, pixelRatio());
    scene.setName(businessName());
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
onScrollVelocity((v) => {
  scrollVelocity = v;
  scene?.slosh(Math.abs(v) * 0.03);
  kick(700);
});
addEventListener('resize', resize);
const drag = onDrag(dragZone, {
  ready: () => ready,
  start: () => {
    lastDrag = performance.now();
    kick(800);
  },
  move: (dx) => {
    userSpin += dx * 0.012;
    spinVelocity = dx * 0.006;
    lastDrag = performance.now();
    scene?.slosh(Math.abs(dx) * 0.004);
    kick(800);
  },
  end: () => kick(1600),
  key: (direction) => {
    spinVelocity = direction * 0.05;
    lastDrag = performance.now();
    kick(1600);
  },
});
addEventListener('template-identity-change', () => {
  scene?.setName(businessName());
  kick(400);
});
reducedMotion.addEventListener('change', () => {
  if (reducedMotion.matches) {
    fallback('reduced-motion');
    root.dataset.three = 'static';
  } else void start();
});
startWhenIdle(() => void start());
