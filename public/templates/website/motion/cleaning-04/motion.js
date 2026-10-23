(() => {
  'use strict';
  const stage = document.querySelector('.motion-stage');
  const media = matchMedia('(prefers-reduced-motion: reduce)');
  let frame = 0;
  let top = 0;
  let height = 1;
  function paint() {
    frame = 0;
    // One short, natural pass through the illustration; no pinned scroll distance.
    const progress = media.matches
      ? 1
      : Math.max(
          0,
          Math.min(
            1,
            (scrollY + innerHeight * 0.85 - top) /
              Math.min(height + innerHeight * 0.15, innerHeight * 0.8),
          ),
        );
    stage.style.setProperty('--clean', progress.toFixed(4));
  }
  function schedule() {
    if (!frame) frame = requestAnimationFrame(paint);
  }
  function measure() {
    top = stage.getBoundingClientRect().top + scrollY;
    height = stage.offsetHeight;
    schedule();
  }
  function preference() {
    if (media.matches) removeEventListener('scroll', schedule);
    else addEventListener('scroll', schedule, { passive: true });
    measure();
  }
  new ResizeObserver(measure).observe(document.body);
  addEventListener('resize', measure, { passive: true });
  addEventListener('pageshow', measure);
  media.addEventListener('change', preference);
  preference();
})();
