// Runs the kitchen's WebGL canvas. The model is framed inside whichever
// [data-anchor] box is most in view, so HTML layout decides where the 3D goes.
// Posters and the flat elevation stay in the page until 3D is live.
import type { KitchenScene, Room } from './scene';
import type { Spec } from '../../../../../../content/kitchens-demo';
import {
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

type Mode = 'hero' | 'styles' | 'layers' | 'design' | 'visit';
const layout = document.querySelector<HTMLElement>('[data-stage]')!;
const anchors = [...document.querySelectorAll<HTMLElement>('[data-anchor]')];
const layersTrack = document.querySelector<HTMLElement>('[data-layers]')!;
const layersPin = layersTrack.querySelector<HTMLElement>('.layers-pin')!;
const labels = [...document.querySelectorAll<HTMLElement>('[data-layer]')];

const model: { style: Spec; build: Spec; room: Room } = {
  style: { door: 'sage', doorStyle: 'shaker', top: 'oak', handle: 'cup', tap: 'brass' },
  build: { door: 'sage', doorStyle: 'shaker', top: 'oak', handle: 'cup', tap: 'brass' },
  room: 'kitchen',
};
let scene: KitchenScene | undefined;
let canvas: HTMLCanvasElement | undefined;
let ready = false,
  mode: Mode | '' = '',
  userTurn = 0,
  turnVelocity = 0,
  lastDrag = 0,
  scrollVelocity = 0,
  explode = 0;
const view = { azimuth: 0.62, elevation: 0.42 };

const loop = createRenderLoop({
  frame: tick,
  enabled: () => ready && !!scene,
  canvas: () => canvas,
  onSlow: () => fallback('low-frame-rate'),
});
const kick = loop.kick;

// The page talks to the kitchen through this object. Calls are safe before 3D
// has loaded (or after a fallback): the model is kept regardless.
export const stage = {
  live: () => ready,
  setStyle(spec: Spec) {
    model.style = spec;
    if (scene && (mode === 'hero' || mode === 'styles' || mode === 'layers')) scene.setSpec(spec);
    kick(1200);
  },
  setBuild(spec: Spec, room: Room) {
    model.build = spec;
    model.room = room;
    if (scene && (mode === 'design' || mode === 'visit')) {
      scene.setSpec(spec);
      scene.setRoom(room);
    }
    kick(1400);
  },
};

function applyMode(next: Mode) {
  if (!scene) return;
  const building = next === 'design' || next === 'visit';
  scene.setSpec(building ? model.build : model.style);
  scene.setRoom(building ? model.room : 'kitchen');
}

// Camera angle per box: a three-quarter view, turned a little for each scene.
const angles: Record<Mode, [number, number]> = {
  hero: [0.62, 0.42],
  styles: [0.5, 0.44],
  layers: [0.48, 0.5],
  design: [0.42, 0.46],
  visit: [0.78, 0.4],
};

function target(now: number, dt: number) {
  const best = pickAnchor(anchors);
  const next = (best?.dataset.anchor as Mode) || '';
  if (next && next !== mode) {
    mode = next;
    applyMode(next);
    kick(1400);
  }
  scene?.show(!!best);
  if (!best || !mode || !scene) return;
  scene.frame(best.getBoundingClientRect());
  if (!drag.dragging() && !designDrag.dragging()) {
    userTurn += turnVelocity;
    turnVelocity *= 0.9;
    // After a pause the camera drifts back towards the designed angle.
    if (now - lastDrag > 3000) userTurn *= 0.96;
  }
  const idle = mode === 'hero' ? Math.sin(now * 0.00035) * 0.12 : 0;
  const lean = Math.max(-0.12, Math.min(0.12, scrollVelocity * 0.05));
  scrollVelocity *= 0.86;
  const [a, e] = angles[mode];
  view.azimuth += (a + userTurn + idle - view.azimuth) * (1 - Math.exp(-dt * 6));
  view.elevation += (e + lean - view.elevation) * (1 - Math.exp(-dt * 6));
  scene.view.azimuth = view.azimuth;
  scene.view.elevation = Math.min(0.9, Math.max(0.15, view.elevation));
  // Pull back a little for the exploded view so every part stays in frame.
  scene.view.zoom = mode === 'layers' ? 0.84 : 1;
  explode = mode === 'layers' ? explodeAt(trackProgress(layersTrack)) : 0;
  scene.setExplode(explode);
}

function placeLabels() {
  if (!scene) return;
  const wide = innerWidth >= 700 && mode === 'layers';
  const pin = layersPin.getBoundingClientRect();
  const points = wide ? scene.layerPoints() : [];
  let floor = -Infinity;
  // One tidy column just right of the whole model.
  const column = points.length ? Math.max(...points.map((p) => p.x)) - pin.left + 28 : 0;
  labels.forEach((li, i) => {
    li.style.setProperty('--o', String(mode === 'layers' ? explode : 0));
    if (!wide) {
      li.style.removeProperty('--x');
      li.style.removeProperty('--y');
      return;
    }
    const x = Math.min(column, pin.width - li.offsetWidth - 16);
    li.style.setProperty('--x', Math.round(x) + 'px');
    // Top to bottom: never let a label overlap the one above it.
    const y = Math.max(floor, points[i].y - pin.top - li.offsetHeight / 2);
    floor = y + li.offsetHeight + 10;
    li.style.setProperty('--y', Math.round(y) + 'px');
  });
}

function tick(now: number, dt: number) {
  target(now, dt);
  const moving = scene!.update(dt);
  scene!.render();
  placeLabels();
  return (
    moving ||
    drag.dragging() ||
    designDrag.dragging() ||
    Math.abs(turnVelocity) > 0.0005 ||
    (mode === 'hero' && loop.busy(now))
  );
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

async function start() {
  if (scene || ready) return;
  if (reducedMotion.matches) {
    root.dataset.three = 'static';
    root.dataset.fallback = 'reduced-motion';
    return;
  }
  if (!webgl2()) return fallback('webgl-unavailable');
  try {
    const { createKitchenScene } = await import('./scene');
    if (reducedMotion.matches) return;
    canvas = document.createElement('canvas');
    layout.append(canvas);
    scene = await createKitchenScene(canvas, {
      mobile: phone.matches,
      ink: getComputedStyle(root).getPropertyValue('--brand').trim() || '#1c2124',
    });
    scene.resize(innerWidth, innerHeight, pixelRatio());
    target(performance.now(), 1);
    applyMode((mode || 'hero') as Mode);
    scene.update(1);
    await scene.prepare();
    if (!scene) return;
    canvas.addEventListener('webglcontextlost', (event) => {
      event.preventDefault();
      fallback('context-lost');
    });
    ready = true;
    root.dataset.three = 'live';
    delete root.dataset.fallback;
    kick(4000);
  } catch {
    fallback('webgl-unavailable');
  }
}

// Input
onScrollVelocity((v) => {
  scrollVelocity = v;
  kick(700);
});
addEventListener('resize', () => {
  scene?.resize(innerWidth, innerHeight, pixelRatio());
  kick(400);
});
const turnHandlers = {
  ready: () => ready,
  start: () => {
    lastDrag = performance.now();
    kick(800);
  },
  move: (dx: number) => {
    userTurn = Math.max(-1.1, Math.min(1.1, userTurn - dx * 0.006));
    turnVelocity = -dx * 0.002;
    lastDrag = performance.now();
    kick(800);
  },
  end: () => kick(1600),
  key: (direction: -1 | 1) => {
    turnVelocity = -direction * 0.025;
    lastDrag = performance.now();
    kick(1600);
  },
};
const drag = onDrag(document.querySelector<HTMLElement>('[data-drag]')!, turnHandlers);
const designDrag = onDrag(document.querySelector<HTMLElement>('[data-drag-design]')!, turnHandlers);
addEventListener('template-identity-change', () => kick(300));
reducedMotion.addEventListener('change', () => {
  if (reducedMotion.matches) {
    fallback('reduced-motion');
    root.dataset.three = 'static';
  } else void start();
});
startWhenIdle(() => void start());
