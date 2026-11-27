// Shared plumbing for the 3D website template demos (juice-bar-05, kitchens-13…).
// Each template keeps its own scene and look; this file only holds the parts
// that must behave the same everywhere: the render loop and its performance
// guards, the once-per-session loader, scene transitions and nav state.

declare global {
  interface Window {
    templateIdentity: { sample: string; read: () => { name: string } };
  }
}

export const root = document.documentElement;
export const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
export const phone = matchMedia('(max-width: 700px), (pointer: coarse)');
// Canvas pixel ratio: at most 2 on desktop and 1.5 on phones.
export const pixelRatio = () => Math.min(devicePixelRatio || 1, phone.matches ? 1.5 : 2);
export const businessName = () =>
  window.templateIdentity.read().name || window.templateIdentity.sample;
export const webgl2 = () => 'WebGL2RenderingContext' in window;

// Share of an element that is on screen, relative to the smaller of its own
// height and the viewport height.
export function visibleShare(r: DOMRect) {
  const shown = Math.min(r.bottom, innerHeight) - Math.max(r.top, 0);
  return r.width > 0 ? Math.max(0, shown) / Math.max(1, Math.min(r.height, innerHeight)) : 0;
}
// The anchor box most in view (at least 30 %), so the 3D follows HTML layout.
export function pickAnchor(anchors: HTMLElement[], minimum = 0.3) {
  let best: HTMLElement | undefined,
    share = minimum;
  for (const anchor of anchors) {
    const s = visibleShare(anchor.getBoundingClientRect());
    if (s > share + 0.02) {
      best = anchor;
      share = s;
    }
  }
  return best;
}
// 0 to 1 progress through a tall, sticky-pinned scroll track.
export function trackProgress(track: HTMLElement) {
  const t = track.getBoundingClientRect();
  return Math.min(1, Math.max(0, -t.top / Math.max(1, t.height - innerHeight)));
}
// Pull apart from 12 % to 38 %, hold, then snap back by 84 %.
export function explodeAt(progress: number) {
  const up = (progress - 0.12) / 0.26,
    down = (progress - 0.68) / 0.16;
  if (progress < 0.12 || progress > 0.84) return 0;
  if (progress < 0.38) return 1 - Math.pow(1 - up, 3);
  if (progress < 0.68) return 1;
  return 1 - down * down;
}

type LoopOptions = {
  // Draw one frame; return true while the scene still wants frames.
  frame: (now: number, dt: number) => boolean;
  // False until the scene is ready (and after a fallback).
  enabled: () => boolean;
  canvas: () => HTMLCanvasElement | undefined;
  // Sustained frame rate under 24 fps for two seconds.
  onSlow: () => void;
};
// Renders on demand only: frames run while something moves or for a short
// "busy" window after input, then the loop stops. It also pauses while the tab
// is hidden and never counts background-tab throttling as slow rendering.
export function createRenderLoop({ frame, enabled, canvas, onSlow }: LoopOptions) {
  let pending = 0,
    running = false,
    last = 0,
    busyUntil = 0,
    slowSince = 0,
    slowFrames = 0;
  const reset = () => {
    last = 0;
    slowSince = 0;
    slowFrames = 0;
  };
  function tick(now: number) {
    pending = 0;
    if (!enabled() || document.hidden) return;
    if (last && now - last > 250) {
      slowSince = 0;
      slowFrames = 0;
    }
    const dt = last ? Math.min(0.05, (now - last) / 1000) : 1 / 60;
    last = now;
    running = true;
    const moving = frame(now, dt);
    running = false;
    if (!enabled()) return;
    root.dataset.rendering = 'active';
    const c = canvas();
    if (c) c.dataset.frames = String(Number(c.dataset.frames || 0) + 1);
    if (!slowSince) slowSince = now;
    slowFrames++;
    if (now - slowSince > 2000) {
      const fps = ((slowFrames - 1) * 1000) / (now - slowSince);
      if (c) c.dataset.fps = fps.toFixed(1);
      if (fps < 24) return onSlow();
      slowSince = now;
      slowFrames = 0;
    }
    if (moving || now < busyUntil) pending = requestAnimationFrame(tick);
    else {
      reset();
      root.dataset.rendering = 'paused';
    }
  }
  function kick(ms = 600) {
    if (!enabled()) return;
    busyUntil = Math.max(busyUntil, performance.now() + ms);
    if (!pending && !running && !document.hidden) pending = requestAnimationFrame(tick);
  }
  function stop() {
    cancelAnimationFrame(pending);
    pending = 0;
  }
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      stop();
      last = 0;
    } else kick(400);
  });
  addEventListener('pagehide', stop);
  addEventListener('pageshow', (event) => {
    if (event.persisted) kick(600);
  });
  return { kick, stop, busy: (now: number) => now < busyUntil };
}

// Leave the first moments to the loader, text and input; then start 3D on idle.
export function startWhenIdle(start: () => void, after = 1600) {
  const begin = () =>
    setTimeout(
      () => {
        if ('requestIdleCallback' in window) requestIdleCallback(start, { timeout: 2000 });
        else start();
      },
      Math.max(0, after - performance.now()),
    );
  if (document.readyState === 'complete') begin();
  else addEventListener('load', begin, { once: true });
}

// Scroll velocity in px/ms, smoothed, for tilt and slosh effects.
export function onScrollVelocity(callback: (velocity: number) => void) {
  let lastY = scrollY,
    lastAt = performance.now(),
    velocity = 0;
  addEventListener(
    'scroll',
    () => {
      const now = performance.now();
      const v = (scrollY - lastY) / Math.max(8, now - lastAt);
      lastY = scrollY;
      lastAt = now;
      velocity = velocity * 0.5 + v * 0.5;
      callback(velocity);
    },
    { passive: true },
  );
}

// Drag or swipe horizontally on an HTML element (the 3D canvas never takes
// input); arrow keys do the same when it has focus.
export function onDrag(
  zone: HTMLElement,
  handlers: {
    ready: () => boolean;
    start: () => void;
    move: (dx: number) => void;
    end: () => void;
    key: (direction: -1 | 1) => void;
  },
) {
  let dragging = false,
    x = 0;
  zone.addEventListener('pointerdown', (event) => {
    if (!handlers.ready() || event.button > 0) return;
    dragging = true;
    x = event.clientX;
    zone.setPointerCapture(event.pointerId);
    handlers.start();
  });
  zone.addEventListener('pointermove', (event) => {
    if (!dragging) return;
    const dx = event.clientX - x;
    x = event.clientX;
    handlers.move(dx);
  });
  for (const type of ['pointerup', 'pointercancel', 'lostpointercapture'])
    zone.addEventListener(type, () => {
      if (!dragging) return;
      dragging = false;
      handlers.end();
    });
  zone.addEventListener('keydown', (event) => {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
    event.preventDefault();
    handlers.key(event.key === 'ArrowLeft' ? -1 : 1);
  });
  return { dragging: () => dragging };
}

// Loader: at most `max` ms from navigation, skippable, once per session (the
// session flag is set by the shared identity script before first paint).
export function runLoader(max = 1500) {
  const loader = document.querySelector<HTMLElement>('[data-loader]');
  if (!loader || root.dataset.loader !== 'on') return;
  const end = () => {
    if (loader.classList.contains('is-done')) return;
    loader.classList.add('is-done');
    setTimeout(() => (root.dataset.loader = 'done'), 450);
  };
  setTimeout(end, Math.max(0, max - performance.now()));
  loader.querySelector('[data-loader-skip]')?.addEventListener('click', end);
  addEventListener('keydown', (event) => event.key === 'Escape' && end(), { once: true });
}

// Scene transition: the layer covers the screen, the page jumps, the layer
// leaves. Reduced motion jumps straight away.
export function bindSceneLinks(options: {
  layer: HTMLElement;
  scenes: string[];
  focus: Record<string, string>;
  cover?: number;
  leave?: number;
}) {
  const { layer, scenes, focus, cover = 380, leave = 460 } = options;
  function go(id: string) {
    const section = document.getElementById(id);
    if (!section) return;
    const jump = () => {
      section.scrollIntoView({ block: 'start' });
      const url = new URL(location.href);
      url.hash = id;
      history.replaceState(history.state, '', url);
      if (focus[id]) document.querySelector<HTMLElement>(focus[id])?.focus({ preventScroll: true });
    };
    if (reducedMotion.matches || layer.classList.length > 1) return jump();
    layer.classList.add('is-covering');
    setTimeout(() => {
      jump();
      layer.classList.replace('is-covering', 'is-leaving');
      setTimeout(() => layer.classList.remove('is-leaving'), leave);
    }, cover);
  }
  document.addEventListener('click', (event) => {
    const link = (event.target as Element).closest<HTMLAnchorElement>(
      'a[data-wipe], a[data-order]',
    );
    if (!link || event.defaultPrevented || event.metaKey || event.ctrlKey) return;
    const id = link.hash.slice(1);
    if (!scenes.includes(id)) return;
    event.preventDefault();
    go(id);
  });
  return go;
}

// aria-current on the nav link of the section crossing the middle of the screen.
export function watchNav(links: HTMLAnchorElement[], ids: string[]) {
  const watcher = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        links.forEach((link) => {
          if (link.hash === '#' + entry.target.id) link.setAttribute('aria-current', 'true');
          else link.removeAttribute('aria-current');
        });
      }
    },
    { rootMargin: '-50% 0px -50% 0px' },
  );
  for (const id of ids) watcher.observe(document.getElementById(id)!);
}

// Adds .is-in while an element is on screen (footer animations).
export function toggleInView(element: HTMLElement, threshold = 0.4) {
  new IntersectionObserver(([entry]) => element.classList.toggle('is-in', entry.isIntersecting), {
    threshold,
  }).observe(element);
}
