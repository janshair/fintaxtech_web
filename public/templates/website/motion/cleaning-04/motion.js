(() => {
  'use strict';
  const stage = document.querySelector('.motion-stage');
  const illustration = stage.querySelector('[data-cleaning-illustration]');
  const contactBar = document.querySelector('.mobile-contact');
  const steps = [...document.querySelectorAll('.process-steps li')];
  const media = matchMedia('(prefers-reduced-motion: reduce)');
  let frame = 0;
  let start = 0;
  let end = 1;
  let activeStep = -1;
  function paint() {
    frame = 0;
    const progress = media.matches
      ? 1
      : Math.max(0, Math.min(1, (scrollY - start) / (end - start)));
    stage.style.setProperty('--clean', progress.toFixed(4));
    const step = Math.min(2, Math.floor(progress * 3));
    if (activeStep !== step) {
      steps.forEach((node, index) => {
        node.classList.toggle('is-current', index === step);
        if (index === step) node.setAttribute('aria-current', 'step');
        else node.removeAttribute('aria-current');
      });
      activeStep = step;
    }
  }
  function schedule() {
    if (!frame) frame = requestAnimationFrame(paint);
  }
  function measure() {
    // Cache geometry outside the scroll handler. The illustration, not the whole
    // card, must fit above the fixed contact bar before the pass begins.
    const bounds = illustration.getBoundingClientRect();
    const bar = contactBar.getBoundingClientRect();
    const visibleBottom =
      (bar.height && getComputedStyle(contactBar).position === 'fixed'
        ? Math.min(innerHeight, bar.top)
        : innerHeight) - 8;
    const top = bounds.top + scrollY;
    start = top + bounds.height - visibleBottom;
    // Keep the entire illustration on screen even in unusually short viewports.
    const finishCentre = Math.max(innerHeight * 0.35, bounds.height / 2 + 8);
    end = Math.max(start + 1, top + bounds.height / 2 - finishCentre);
    schedule();
  }
  function preference() {
    if (media.matches) removeEventListener('scroll', schedule);
    else addEventListener('scroll', schedule, { passive: true });
    measure();
  }
  const observer = new ResizeObserver(measure);
  [document.body, illustration, contactBar].forEach((node) => observer.observe(node));
  addEventListener('resize', measure, { passive: true });
  addEventListener('pageshow', measure);
  media.addEventListener('change', preference);
  preference();
})();
