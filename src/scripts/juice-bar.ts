import type { createDrinkScene } from '../lib/juice-bar/scene';

declare global {
  interface Window {
    juiceIdentity: { sample: string; read: () => { name: string } };
  }
}
type DrinkScene = ReturnType<typeof createDrinkScene>;
const root = document.documentElement;
const frames = [...document.querySelectorAll<HTMLElement>('[data-scene]')];
const story = document.querySelector<HTMLElement>('[data-story-track]')!;
const pin = story.querySelector<HTMLElement>('.story-pin')!;
const media = matchMedia('(prefers-reduced-motion: reduce)');
let scene: DrinkScene | undefined;
let canvas: HTMLCanvasElement;
let current: HTMLElement | undefined;
let pending = 0,
  epoch = 0,
  animatingUntil = 0,
  slowFrames = 0,
  slowSince = 0,
  restored = false,
  lost = false;
let pointer = 0,
  progress = 0;
let mix = { colour: '#ee9239', fruit: 'orange', type: 'smoothie' };
const connection = (
  navigator as Navigator & {
    connection?: {
      saveData?: boolean;
      addEventListener?: (type: string, callback: () => void) => void;
    };
  }
).connection;
function preference() {
  if (media.matches) return 'reduced-motion';
  if (connection?.saveData) return 'save-data';
  if ((navigator as Navigator & { deviceMemory?: number }).deviceMemory! <= 2) return 'low-memory';
  return '';
}
function stop() {
  cancelAnimationFrame(pending);
  pending = 0;
  slowFrames = 0;
  slowSince = 0;
  root.dataset.rendering = 'paused';
}
function fallback(reason: string, dispose = true) {
  stop();
  epoch++;
  root.dataset.three = 'fallback';
  root.dataset.fallback = reason;
  frames.forEach((frame) => delete frame.dataset.live);
  document.querySelector('[data-render-status]')!.textContent =
    'Original 3D illustration · static preview';
  if (dispose) {
    scene?.dispose();
    scene = undefined;
    canvas?.remove();
    current = undefined;
  }
}
function visible(frame: HTMLElement) {
  if (frame.closest('dialog') && !frame.closest('dialog')!.open) return false;
  const r = frame.getBoundingClientRect();
  return r.bottom > 0 && r.top < innerHeight && r.width > 0;
}
function choose() {
  return (
    frames.find((frame) => frame.dataset.scene === 'builder' && frame.closest('dialog')?.open) ||
    ['story', 'coffee', 'hero']
      .map((mode) => frames.find((frame) => frame.dataset.scene === mode && visible(frame)))
      .find(Boolean)
  );
}
function updateProgress() {
  // Live geometry on every scroll frame. The 620px timeline begins only when
  // the entire object is above the mobile bar; sticky centre ends at 35% vh.
  const frame = frames.find((frame) => frame.dataset.scene === 'story')!;
  const bar = document.querySelector('.mobile-contact')!.getBoundingClientRect().height;
  const height = frame.getBoundingClientRect().height;
  const top = Math.max(20, innerHeight * 0.35 - height / 2);
  story.style.setProperty('--pin-top', top + 'px');
  const start = innerHeight - bar - height - 24;
  story.style.height =
    Math.max(
      pin.getBoundingClientRect().height + 620 - start + top,
      pin.getBoundingClientRect().height,
    ) + 'px';
  const rect = frame.getBoundingClientRect();
  if (rect.top >= 0 && rect.bottom <= innerHeight - bar) {
    progress = Math.max(0, Math.min(1, (start - story.getBoundingClientRect().top) / 620));
  }
  story.dataset.progress = progress.toFixed(5);
  story.style.setProperty('--progress', String(progress));
  const stage = Math.min(2, Math.floor(progress * 3));
  story.dataset.stage = String(stage);
  story
    .querySelectorAll<HTMLElement>('[data-story-step]')
    .forEach((node, i) => (node.dataset.active = String(stage === i)));
  story.querySelector('[data-stage-badge]')!.textContent = [
    '01 / PICK',
    '02 / BLEND',
    '03 / YOURS',
  ][stage];
}
function request(duration = 0) {
  if (!scene || lost || document.hidden) return;
  animatingUntil = Math.max(animatingUntil, performance.now() + duration);
  if (!pending) pending = requestAnimationFrame(tick);
}
function tick(now: number) {
  pending = 0;
  if (!scene || lost || document.hidden) {
    stop();
    return;
  }
  updateProgress();
  const target = choose();
  if (!target) {
    stop();
    frames.forEach((frame) => delete frame.dataset.live);
    return;
  }
  if (current !== target) {
    frames.forEach((frame) => delete frame.dataset.live);
    target.append(canvas);
    current = target;
    animatingUntil = ['hero', 'coffee'].includes(target.dataset.scene!)
      ? Math.max(animatingUntil, now + 1600)
      : 0;
  }
  // Measure a complete two-second window: an occasional quick frame must not
  // conceal a sustained average below 30 fps.
  if (!slowSince) slowSince = now;
  slowFrames++;
  if (now - slowSince > 2000) {
    const fps = ((slowFrames - 1) * 1000) / (now - slowSince);
    canvas.dataset.fps = fps.toFixed(1);
    if (fps < 30) {
      fallback('low-frame-rate');
      return;
    }
    slowSince = now;
    slowFrames = 0;
  }
  const r = target.getBoundingClientRect();
  scene.resize(r.width, r.height);
  const remaining = Math.max(0, animatingUntil - now);
  const lean =
    target.dataset.scene === 'hero'
      ? pointer + Math.sin(now * 0.0007) * Math.min(1, remaining / 600)
      : 0;
  scene.render(target.dataset.scene!, progress, lean, now);
  target.dataset.live = 'true';
  root.dataset.rendering = 'active';
  canvas.dataset.frames = String(Number(canvas.dataset.frames || 0) + 1);
  if (['hero', 'coffee'].includes(target.dataset.scene!) && now < animatingUntil)
    pending = requestAnimationFrame(tick);
  else stop();
}
async function start() {
  if (scene || lost) return;
  const reason = preference();
  if (reason) {
    fallback(reason);
    return;
  }
  const version = ++epoch;
  try {
    const { createDrinkScene } = await import('../lib/juice-bar/scene');
    if (version !== epoch || preference()) return;
    canvas = document.createElement('canvas');
    canvas.setAttribute('aria-hidden', 'true');
    scene = createDrinkScene(canvas);
    scene.name(window.juiceIdentity.read().name || window.juiceIdentity.sample);
    scene.mix(mix);
    canvas.addEventListener('webglcontextlost', (event) => {
      event.preventDefault();
      lost = true;
      fallback('context-lost', false);
    });
    canvas.addEventListener('webglcontextrestored', () => {
      if (restored || preference()) {
        fallback('context-restore-exhausted');
        return;
      }
      restored = true;
      lost = false;
      root.dataset.three = 'live';
      delete root.dataset.fallback;
      request(500);
    });
    root.dataset.three = 'live';
    delete root.dataset.fallback;
    document.querySelector('[data-render-status]')!.textContent = 'Live 3D · made for your morning';
    request(3600);
  } catch {
    fallback('webgl-unavailable');
  }
}
const observer = new IntersectionObserver(() => request(), { threshold: [0, 0.01, 0.5, 1] });
frames.forEach((frame) => observer.observe(frame));
addEventListener('scroll', () => request(), { passive: true });
addEventListener('resize', () => request());
addEventListener(
  'pointermove',
  (event) => {
    if (event.pointerType === 'mouse' && current?.dataset.scene === 'hero') {
      pointer = (event.clientX / innerWidth - 0.5) * 1.5;
      request(450);
    }
  },
  { passive: true },
);
addEventListener('juice-scene-change', () => request(600));
addEventListener('juice-identity-change', () => {
  scene?.name(window.juiceIdentity.read().name || window.juiceIdentity.sample);
  request(300);
});
addEventListener('juice-mix-change', (event) => {
  mix = (event as CustomEvent).detail;
  scene?.mix(mix);
  request(400);
});
document.addEventListener('visibilitychange', () => {
  if (document.hidden) stop();
  else request(300);
});
function preferencesChanged() {
  const reason = preference();
  if (reason) fallback(reason);
  else void start();
}
media.addEventListener('change', preferencesChanged);
connection?.addEventListener?.('change', preferencesChanged);
addEventListener('pagehide', () => {
  fallback('page-hidden');
  observer.disconnect();
});
addEventListener('pageshow', (event) => {
  if (event.persisted) {
    frames.forEach((frame) => observer.observe(frame));
    void start();
  }
});
// An event-based, local capture hook renders synchronously so screenshots do not
// require preserveDrawingBuffer (which would cost memory on every visitor).
addEventListener('juice-capture', (event) => {
  if (!scene) return;
  const d = (event as CustomEvent).detail;
  scene.resize(d.width || 900, d.height || 900);
  // Posters use a neutral sleeve mark so personalised links never flash a
  // different business's name before WebGL loads, or in any poster fallback.
  if (d.poster) scene.name('✳');
  scene.render(d.mode, d.progress || 0, 0, 0);
  if (d.poster) scene.name(window.juiceIdentity.read().name || window.juiceIdentity.sample);
});
// Preserve the first 300ms for content and input. Shader compilation can block
// the main thread even after an idle import, so give the poster a 500ms lead.
requestAnimationFrame(() =>
  requestAnimationFrame(() => {
    setTimeout(() => {
      if ('requestIdleCallback' in window)
        window.requestIdleCallback(() => void start(), { timeout: 1800 });
      else void start();
    }, 500);
  }),
);
export {};
