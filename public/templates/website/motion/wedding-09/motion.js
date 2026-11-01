(() => {
  'use strict';
  // Save the Date (wedding-09) motion. One passive scroll listener schedules one
  // requestAnimationFrame, which reads live boxes first and then writes only the
  // custom properties that changed. Observers only switch ambient work on/off.
  // Without this script (or with reduced motion) every --t / --p is 1, so each
  // scene shows finished.
  const root = document.documentElement;
  const $ = (selector, node = document) => node.querySelector(selector);
  const $$ = (selector, node = document) => [...node.querySelectorAll(selector)];
  const media = matchMedia('(prefers-reduced-motion: reduce)');
  const clamp = (value) => Math.max(0, Math.min(1, value));
  const stage = $('.story-stage');
  const contactBar = $('.mobile-contact');
  const steps = $$('.story-steps li');
  const caption = $('[data-stage-caption]', stage);
  const captionNumber = $('[data-stage-number]', stage);
  const timeline = $('[data-timeline]');
  const timelineSteps = $$('.timeline-step', timeline);
  const heroArt = $('.hero-art');
  const reveals = $$('[data-reveal]');
  let frame = 0;
  let activeStep = -1;
  let active = null;
  const scenes = {};
  window.weddingMotion = { progress: 1, log: null, scenes, scenesLog: null };

  // Everything that belongs to the visible supplier type, re-collected when it changes.
  function collect() {
    const type = root.dataset.type;
    const scene = $(`[data-story="${type}"]`);
    active = {
      type,
      scene,
      segs: $$('[data-seg]', scene).map((node) => {
        const [stageNumber, from, to] = node.dataset.seg.split(' ').map(Number);
        return { node, stage: stageNumber - 1, from, to };
      }),
      tiles: $$(`.tile[data-only="${type}"]`),
      cards: $$(`[data-packages="${type}"] [data-package-card]`),
    };
    activeStep = -1;
  }

  // Progress counts only the part of the viewport above the fixed contact bar.
  function barInset() {
    const bar = contactBar.getBoundingClientRect();
    const fixed = bar.height && getComputedStyle(contactBar).position === 'fixed';
    return fixed ? Math.max(0, innerHeight - bar.top) : 0;
  }
  // 0 as the box's top enters the visible bottom, 1 when its centre reaches `finish`.
  function sceneProgress(box, bottom, finish = 0.35) {
    const finishCentre = Math.max(innerHeight * finish, box.height / 2 + 8);
    return clamp((bottom - box.top) / Math.max(1, bottom - finishCentre + box.height / 2));
  }
  const written = new Map();
  function write(node, property, value) {
    const key = written.get(node) || {};
    if (key[property] === value) return;
    key[property] = value;
    written.set(node, key);
    node.style.setProperty(property, value);
  }

  function paint() {
    frame = 0;
    if (!active || active.type !== root.dataset.type) collect();
    const reduce = media.matches;
    // Reads
    const bottom = innerHeight - barInset() - 8;
    const read = (node, finish) =>
      reduce || !node ? 1 : sceneProgress(node.getBoundingClientRect(), bottom, finish);
    const progress = read(active.scene);
    const tiles = active.tiles.map((tile) => read(tile, 0.62));
    const cards = active.cards.map((card) => read(card, 0.55));
    const line = read(timeline, 0.45);

    // Writes. Three equal stages for every supplier's signature scene.
    const done = [0, 1, 2].map((i) => clamp(progress * 3 - i));
    write(stage, '--p', progress.toFixed(4));
    done.forEach((value, i) => write(stage, '--s' + (i + 1), value.toFixed(4)));
    for (const seg of active.segs)
      write(
        seg.node,
        '--t',
        clamp((done[seg.stage] - seg.from) / Math.max(0.001, seg.to - seg.from)).toFixed(4),
      );
    active.tiles.forEach((tile, i) => write(tile, '--t', tiles[i].toFixed(4)));
    active.cards.forEach((card, i) => write(card, '--vf', cards[i].toFixed(4)));
    // The story timeline draws step to step; each dot fills as the line reaches it.
    const reach = line * (timelineSteps.length - 1);
    timelineSteps.forEach((node, i) => {
      write(node, '--c', clamp(reach - i).toFixed(4));
      node.classList.toggle('is-reached', reduce || line >= 1 || (line > 0 && reach >= i - 0.001));
    });
    write(timeline, '--tl', line.toFixed(4));

    const current = Math.min(2, Math.floor(progress * 3));
    if (activeStep !== current) {
      steps.forEach((node, index) => {
        node.classList.toggle('is-current', index === current);
        if (index === current) node.setAttribute('aria-current', 'step');
        else node.removeAttribute('aria-current');
      });
      const heading = $(`h3 [data-only="${active.type}"]`, steps[current]);
      caption.textContent = heading ? heading.textContent : '';
      captionNumber.textContent = '0' + (current + 1);
      activeStep = current;
    }
    const average = (list) => (list.length ? list.reduce((a, b) => a + b, 0) / list.length : 1);
    Object.assign(scenes, {
      story: progress,
      gallery: average(tiles),
      packages: average(cards),
      timeline: line,
    });
    const motion = window.weddingMotion;
    motion.progress = progress;
    if (motion.log) motion.log.push([Math.round(scrollY), progress]);
    if (motion.scenesLog) motion.scenesLog.push({ y: Math.round(scrollY), ...scenes });
    revealVisible();
  }
  function schedule() {
    if (!frame) frame = requestAnimationFrame(paint);
  }

  // Florist petals drift only while the hero is on screen and the tab is visible.
  let heroVisible = true;
  function syncLive() {
    heroArt.classList.toggle('is-live', heroVisible && !document.hidden && !media.matches);
  }
  if ('IntersectionObserver' in window)
    new IntersectionObserver(([entry]) => {
      heroVisible = entry.isIntersecting;
      syncLive();
    }).observe(heroArt);
  document.addEventListener('visibilitychange', syncLive);

  // Reveals only hide content once this script runs, and anything at or above
  // the viewport bottom is always shown, so no heading can be left hidden.
  function show(node) {
    node.classList.add('is-revealed');
  }
  function revealVisible() {
    if (!root.classList.contains('reveal-ready')) return;
    for (const node of reveals)
      if (!node.classList.contains('is-revealed') && node.getBoundingClientRect().top < innerHeight)
        show(node);
  }
  const revealObserver =
    'IntersectionObserver' in window
      ? new IntersectionObserver(
          (entries) =>
            entries.forEach((entry) => {
              if (entry.isIntersecting) {
                show(entry.target);
                revealObserver.unobserve(entry.target);
              }
            }),
          { rootMargin: '0px 0px -6% 0px' },
        )
      : null;
  // Reduced motion (including a live change): every scene painted finished,
  // nothing hidden, no loops.
  function preference() {
    syncLive();
    if (media.matches) {
      document.getAnimations().forEach((animation) => {
        try {
          animation.finish();
        } catch {
          animation.cancel();
        }
      });
    }
    if (media.matches || !revealObserver) {
      root.classList.remove('reveal-ready');
      reveals.forEach(show);
    } else {
      root.classList.add('reveal-ready');
      reveals.forEach(
        (node) => node.classList.contains('is-revealed') || revealObserver.observe(node),
      );
    }
    schedule();
  }
  addEventListener('scroll', schedule, { passive: true });
  addEventListener('resize', schedule, { passive: true });
  addEventListener('pageshow', schedule);
  document.addEventListener('wedding:type', () => {
    collect();
    schedule();
  });
  document.fonts?.ready.then(schedule);
  media.addEventListener('change', preference);
  root.classList.add('motion-ready');
  preference();
  // Watchdog: if no observer callback ever arrives, nothing stays hidden.
  setTimeout(() => {
    if (!reveals.some((node) => node.classList.contains('is-revealed'))) reveals.forEach(show);
  }, 4000);
  setInterval(revealVisible, 1000);
})();
