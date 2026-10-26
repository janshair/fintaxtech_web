// One observer, no scroll listeners, timers, storage, analytics or animation dependencies.
const scenes = [...document.querySelectorAll<HTMLElement | SVGElement>('[data-home-motion]')];
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
const visible = new Set<Element>();
const observer = new IntersectionObserver(
  (entries) => {
    for (const entry of entries) {
      const scene = entry.target as HTMLElement | SVGElement;
      if (entry.isIntersecting && entry.intersectionRatio >= 0.1) visible.add(scene);
      else visible.delete(scene);
      update(scene);
    }
  },
  { threshold: [0, 0.1] },
);
function finish(scene: HTMLElement | SVGElement) {
  scene.dataset.motionState = 'finished';
  visible.delete(scene);
  observer.unobserve(scene);
}
function update(scene: HTMLElement | SVGElement) {
  if (scene.dataset.motionState === 'finished') return;
  if (reduced.matches) {
    finish(scene);
    return;
  }
  if (visible.has(scene) && !document.hidden) scene.dataset.motionState = 'running';
  else if (scene.dataset.motionState === 'running') scene.dataset.motionState = 'paused';
}
for (const scene of scenes) {
  scene.addEventListener('animationend', (event) => {
    if ((event.target as Element).hasAttribute('data-motion-end')) finish(scene);
  });
  if (reduced.matches) finish(scene);
  else observer.observe(scene);
}
reduced.addEventListener('change', () => scenes.forEach(update));
document.addEventListener('visibilitychange', () => scenes.forEach(update));
