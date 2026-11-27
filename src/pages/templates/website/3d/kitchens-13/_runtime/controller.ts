// Runs the kitchen's WebGL canvas. The model is framed inside whichever
// [data-anchor] box is most in view, so HTML layout decides where the 3D goes.
// Posters and the flat elevation stay in the page until 3D is live.
import type { KitchenScene, Room } from './scene';
import type { Bath, Spec } from '../../../../../../content/kitchens-demo';
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

const model: { style: Spec; build: Spec; room: Room; bath: Bath } = {
  style: { door: 'sage', doorStyle: 'shaker', top: 'oak', handle: 'cup', tap: 'brass' },
  build: { door: 'sage', doorStyle: 'shaker', top: 'oak', handle: 'cup', tap: 'brass' },
  room: 'kitchen',
  bath: { layout: 'shower', tiles: 'stone' },
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
  setBuild(spec: Spec, room: Room, bath: Bath) {
    model.build = spec;
    model.room = room;
    model.bath = bath;
    scene?.setBath(bath);
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
  // Only the box hosting the live model hides its picture; every other box
  // keeps its poster or drawing, so no box is ever left empty.
  for (const anchor of anchors) anchor.toggleAttribute('data-live', anchor === best);
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
  // Pull back as the layers part; and a little in the narrow designer boxes.
  const narrowBox = (mode === 'design' || mode === 'visit') && innerWidth < 980;
  scene.view.zoom = mode === 'layers' ? 1 - explode * 0.2 : narrowBox ? 0.88 : 1;
  layersProgress = trackProgress(layersTrack);
  explode = mode === 'layers' ? explodeAt(layersProgress) : 0;
  scene.setExplode(explode);
  // Rise and pull back as it comes apart, so every layer stays in frame.
  scene.view.lift = explode * 0.55;
}

// Labels sit in their own column; on wide screens a leader line joins each one
// to its layer. The label for the layer in focus is highlighted.
const leaders = [...document.querySelectorAll<SVGPathElement>('[data-leader]')];
let layersProgress = 0;
function placeLabels() {
  const live = mode === 'layers';
  const active =
    live && explode > 0.6
      ? Math.min(3, Math.max(0, Math.floor((layersProgress - 0.36) / 0.08)))
      : -1;
  labels.forEach((li, i) => li.toggleAttribute('data-active', i === active));
  if (!scene || !live || innerWidth < 900) {
    leaders.forEach((path) => path.removeAttribute('d'));
    return;
  }
  const pin = layersPin.getBoundingClientRect();
  const points = scene.layerPoints();
  labels.forEach((li, i) => {
    const r = li.getBoundingClientRect();
    const x1 = r.left - pin.left - 10,
      y1 = r.top + r.height / 2 - pin.top;
    const x2 = points[i].x - pin.left,
      y2 = points[i].y - pin.top;
    const elbow = Math.max(x2 + 12, x1 - 36);
    leaders[i].setAttribute('d', `M${x1} ${y1}H${elbow}L${x2} ${y2}`);
    leaders[i].style.setProperty('--o', String(Math.max(0, explode * 1.4 - 0.4)));
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
  for (const anchor of anchors) anchor.removeAttribute('data-live');
  ready = false;
  root.dataset.three = 'fallback';
  root.dataset.fallback = reason;
  root.dataset.rendering = 'paused';
  labels.forEach((li) => li.removeAttribute('data-active'));
  leaders.forEach((path) => path.removeAttribute('d'));
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
    scene.setBath(model.bath, true);
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
