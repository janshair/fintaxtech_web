import type { createDrinkScene } from './scene';

declare global {
  interface Window {
    juiceIdentity: { sample: string; read: () => { name: string } };
  }
}
type DrinkScene = Awaited<ReturnType<typeof createDrinkScene>>;
const root = document.documentElement;
const frames = [...document.querySelectorAll<HTMLElement>('[data-scene]')];
const story = document.querySelector<HTMLElement>('[data-story-track]')!;
const coffeeTrack = document.querySelector<HTMLElement>('[data-coffee-track]')!;
const timelines = [
  { track: story, mode: 'story', progress: 0, labels: ['01 / PICK', '02 / BLEND', '03 / YOURS'] },
  {
    track: coffeeTrack,
    mode: 'coffee',
    progress: 0,
    labels: ['01 / BEANS', '02 / POUR', '03 / FINISH'],
  },
];
let heroStarted = -1;
const media = matchMedia('(prefers-reduced-motion: reduce)');
let scene: DrinkScene | undefined;
let ready = false;
let probeId = 0;
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
  ready = false;
  cancelAnimationFrame(probeId);
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
  if (frame.dataset.scene === 'hero') {
    const bar = document.querySelector('.mobile-contact')!.getBoundingClientRect().height;
    const shown = Math.max(0, Math.min(r.bottom, innerHeight - bar) - Math.max(r.top, 0));
    return r.width > 0 && shown / Math.max(1, r.height) >= 0.75;
  }
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
  const bar = document.querySelector('.mobile-contact')!.getBoundingClientRect().height;
  for (const timeline of timelines) {
    const { track, mode } = timeline;
    const pin = track.querySelector<HTMLElement>('.story-pin')!;
    const frame = track.querySelector<HTMLElement>('[data-scene]')!;
    const height = frame.getBoundingClientRect().height;
    const top = Math.max(20, innerHeight * 0.35 - height / 2);
    const start = innerHeight - bar - height - 24;
    track.style.setProperty('--pin-top', top + 'px');
    track.style.height =
      Math.max(
        pin.getBoundingClientRect().height + 620 - start + top,
        pin.getBoundingClientRect().height,
      ) + 'px';
    const trackTop = track.getBoundingClientRect().top;
    const rect = frame.getBoundingClientRect();
    // Reset before entry (including history/hash restores). Never advance a
    // story while its object is off-screen or concealed by the mobile bar.
    if (trackTop >= start) timeline.progress = 0;
    else if (rect.top >= 0 && rect.bottom <= innerHeight - bar)
      timeline.progress = Math.max(0, Math.min(1, (start - trackTop) / 620));
    const p = timeline.progress,
      stage = Math.min(2, Math.floor(p * 3));
    track.dataset.progress = p.toFixed(5);
    track.dataset.stage = String(stage);
    track.style.setProperty('--progress', String(p));
    track
      .querySelectorAll<HTMLElement>('[data-story-step]')
      .forEach((node, i) => (node.dataset.active = String(stage === i)));
    track.querySelector('[data-stage-badge]')!.textContent = timeline.labels[stage];
    if (mode === 'story') progress = p;
  }
}
function request(duration = 0) {
  if (!scene || !ready || lost || document.hidden) return;
  animatingUntil = Math.max(animatingUntil, performance.now() + duration);
  if (!pending) pending = requestAnimationFrame(tick);
}
function tick(now: number) {
  pending = 0;
  if (!scene || !ready || lost || document.hidden) {
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
    animatingUntil = ['hero'].includes(target.dataset.scene!)
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
  if (heroStarted < 0 && target.dataset.scene === 'hero') {
    heroStarted = now;
    animatingUntil = now + 2200;
  }
  const sceneProgress =
    timelines.find((t) => t.mode === target.dataset.scene)?.progress ?? progress;
  scene.render(
    target.dataset.scene!,
    sceneProgress,
    lean,
    now,
    Math.min(1, Math.max(0, (now - heroStarted) / 2200)),
  );
  target.dataset.live = 'true';
  if (target.dataset.scene === 'hero')
    document.querySelector('[data-render-status]')!.textContent = 'Live 3D · made for your morning';
  root.dataset.rendering = 'active';
  canvas.dataset.frames = String(Number(canvas.dataset.frames || 0) + 1);
  const steamActive =
    target.dataset.scene === 'coffee' &&
    sceneProgress > 2 / 3 &&
    r.top >= 0 &&
    r.bottom <=
      innerHeight - document.querySelector('.mobile-contact')!.getBoundingClientRect().height;
  if ((target.dataset.scene === 'hero' && now < animatingUntil) || steamActive)
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
    const { createDrinkScene } = await import('./scene');
    if (version !== epoch || preference()) return;
    canvas = document.createElement('canvas');
    canvas.setAttribute('aria-hidden', 'true');
    const created = await createDrinkScene(canvas);
    if (version !== epoch || preference()) {
      created.dispose();
      return;
    }
    scene = created;
    scene.name(window.juiceIdentity.read().name || window.juiceIdentity.sample);
    scene.mix(mix);
    frames.find((frame) => frame.dataset.scene === 'hero')!.append(canvas);
    await scene.prepare();
    if (version !== epoch || !scene || preference()) return;
    ready = true;
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
      ready = true;
      root.dataset.three = 'live';
      delete root.dataset.fallback;
      request(500);
    });
    root.dataset.three = 'live';
    delete root.dataset.fallback;
    document.querySelector('[data-render-status]')!.textContent =
      'Scroll a little to explore in 3D';
    request(2200);
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
  if (d.mask) scene.posterMask(d.mask);
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

// These effects never hide page content. The default/no-JS/reduced-motion
// loyalty card is already filled; only the decorative ink stamps animate.
const loyalty = document.querySelector<HTMLElement>('.loyalty')!;
if (!media.matches) loyalty.dataset.animate = 'true';
const loyaltyObserver = new IntersectionObserver(
  (entries) => {
    if (entries.some((e) => e.isIntersecting)) {
      loyalty.classList.add('is-filled');
      loyaltyObserver.disconnect();
    }
  },
  { threshold: 0.25 },
);
loyaltyObserver.observe(loyalty);
media.addEventListener('change', () => {
  if (media.matches) loyalty.classList.add('is-filled');
});
addEventListener('pagehide', () => loyaltyObserver.disconnect());

for (const card of document.querySelectorAll<HTMLElement>('.menu-card')) {
  card.addEventListener('pointerdown', () => card.classList.add('is-pressed'));
  for (const event of ['pointerup', 'pointercancel', 'pointerleave'])
    card.addEventListener(event, () => card.classList.remove('is-pressed'));
}

// Warm the coffee-specific instancing/steam shaders only as that section nears.
const coffeeWarmup = new IntersectionObserver(
  (entries) => {
    if (ready && entries.some((e) => e.isIntersecting)) {
      void scene?.prepareCoffee().then(() => request());
      coffeeWarmup.disconnect();
    }
  },
  { rootMargin: '500px', threshold: 0 },
);
coffeeWarmup.observe(document.querySelector('[data-scene=coffee]')!);
addEventListener('pagehide', () => coffeeWarmup.disconnect());

// A brief frame-cadence preflight avoids enabling costly rendering on a busy
// device. It samples scheduling only: no GPU draw while the hero is mostly
// below the viewport/sticky bar. The regular render-time monitor remains active.
if (!preference()) {
  let probeStart = 0,
    probeFrames = 0;
  const probe = (now: number) => {
    if (document.hidden || preference() || root.dataset.three === 'fallback') return;
    if (!probeStart) probeStart = now;
    probeFrames++;
    if (now - probeStart >= 2000) {
      if (((probeFrames - 1) * 1000) / (now - probeStart) < 30) fallback('low-frame-rate');
      return;
    }
    probeId = requestAnimationFrame(probe);
  };
  probeId = requestAnimationFrame(probe);
}
addEventListener('pagehide', () => cancelAnimationFrame(probeId));
