(() => {
  'use strict';
  const root = document.documentElement;
  const $ = (selector, node = document) => node.querySelector(selector);
  const $$ = (selector, node = document) => [...node.querySelectorAll(selector)];
  const stage = $('.story-stage');
  const hand = $('[data-story]', stage);
  const contactBar = $('.mobile-contact');
  const steps = $$('.story-steps li');
  // Phones show the active step under the hand, since the list sits below it.
  const caption = $('[data-stage-caption]', stage);
  const captionNumber = $('[data-stage-number]', stage);
  const prices = $('[data-prices]');
  const lashes = $('[data-lashes]');
  const brows = $('[data-brows]');
  const gallery = $('[data-gallery]');
  const tiles = $$('.tile', gallery);
  const reveals = $$('[data-reveal]');
  const media = matchMedia('(prefers-reduced-motion: reduce)');
  const clamp = (value) => Math.max(0, Math.min(1, value));
  let frame = 0;
  let activeStep = -1;
  let fan = false;
  const scenes = {};
  window.beautyMotion = { progress: 1, log: null, scenes, scenesLog: null };

  // Everything runs on this one loop: a passive scroll listener schedules one
  // requestAnimationFrame, which reads every box first and then writes only
  // the values that changed. Progress counts only the part of the viewport
  // above the fixed contact bar, so nothing plays hidden behind it.
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

  // Hero: the cap lifts and tilts, and its brush paints the underline under the
  // business name (1.3s, once). The bottle's slow turn and the late-evening dot
  // only run while the hero is on screen and the tab is visible.
  const heroArt = $('.hero-art');
  const cap = $('.bottle-cap', heroArt);
  const stroke = $('.name-stroke');
  const brush = $('.name-brush');
  let heroVisible = true;
  function syncLive() {
    heroArt.classList.toggle('is-live', heroVisible && !document.hidden && !media.matches);
  }
  function paintName() {
    root.classList.remove('paint-pending');
    if (media.matches) return;
    const width = Math.round(stroke.getBoundingClientRect().width);
    cap.animate(
      [
        { transform: 'none' },
        { transform: 'translateY(-96px) rotate(-14deg)', offset: 0.35 },
        { transform: 'translateY(-96px) rotate(-14deg)', offset: 0.7 },
        { transform: 'none' },
      ],
      { duration: 1300, easing: 'cubic-bezier(.45,.05,.25,1)' },
    );
    const timing = { duration: 760, delay: 420, easing: 'cubic-bezier(.5,.1,.3,1)', fill: 'backwards' };
    stroke.animate([{ transform: 'scaleX(0)' }, { transform: 'scaleX(1)' }], timing);
    brush.animate(
      [
        { transform: 'translateX(0) rotate(-24deg)', opacity: 0 },
        { opacity: 1, offset: 0.12 },
        { opacity: 1, offset: 0.85 },
        { transform: `translateX(${width}px) rotate(-12deg)`, opacity: 0 },
      ],
      { ...timing, fill: 'both' },
    );
  }
  if ('IntersectionObserver' in window)
    new IntersectionObserver(([entry]) => {
      heroVisible = entry.isIntersecting;
      syncLive();
    }).observe(heroArt);
  document.addEventListener('visibilitychange', syncLive);

  // Gallery tiles start stacked on the grid's lower centre like a fanned set of
  // swatches, then deal out into place. Offsets ignore transforms, so they are
  // measured once per resize.
  function measureFan() {
    const centreX = gallery.offsetWidth / 2;
    const bottom = gallery.offsetHeight;
    tiles.forEach((tile, i) => {
      const dx = centreX - (tile.offsetLeft + tile.offsetWidth / 2);
      const dy = bottom - (tile.offsetTop + tile.offsetHeight) + 12;
      tile.style.setProperty('--dx', `${Math.round(dx)}px`);
      tile.style.setProperty('--dy', `${Math.round(dy)}px`);
      tile.style.setProperty('--fan', `${((i - (tiles.length - 1) / 2) * 11).toFixed(1)}deg`);
    });
    fan = true;
  }

  function paint() {
    frame = 0;
    const reduce = media.matches;
    if (!fan) measureFan();
    // Reads
    const bottom = innerHeight - barInset() - 8;
    const read = (node, finish) =>
      reduce ? 1 : sceneProgress(node.getBoundingClientRect(), bottom, finish);
    const listed = reduce ? 1 : clamp((bottom - 40 - prices.getBoundingClientRect().top) / 300);
    const progress = read(hand);
    // Lashes and brows finish a little higher, so on a phone the brow scene
    // starts only once the lashes are done.
    const lash = read(lashes, 0.6);
    const brow = read(brows, 0.6);
    const dealt = read(gallery, 0.45);

    // Writes
    write(prices, '--rp', listed.toFixed(4));
    // Prep, base coat, colour, top coat: four equal stages.
    const done = [0, 1, 2, 3].map((i) => clamp(progress * 4 - i));
    write(stage, '--progress', progress.toFixed(4));
    done.forEach((value, i) => write(stage, '--s' + (i + 1), value.toFixed(4)));
    write(lashes, '--lp', lash.toFixed(4));
    write(brows, '--bp', brow.toFixed(4));
    write(gallery, '--gp', dealt.toFixed(4));

    const current = Math.min(3, Math.floor(progress * 4));
    if (activeStep !== current) {
      steps.forEach((node, index) => {
        node.classList.toggle('is-current', index === current);
        if (index === current) node.setAttribute('aria-current', 'step');
        else node.removeAttribute('aria-current');
      });
      caption.textContent = steps[current].querySelector('h3').textContent;
      captionNumber.textContent = '0' + (current + 1);
      activeStep = current;
    }
    window.beautyMotion.progress = progress;
    Object.assign(scenes, { prices: listed, story: progress, lashes: lash, brows: brow, gallery: dealt });
    const motion = window.beautyMotion;
    if (motion.log) motion.log.push([Math.round(scrollY), progress]);
    if (motion.scenesLog) motion.scenesLog.push({ y: Math.round(scrollY), ...scenes });
    revealVisible();
  }
  function schedule() {
    if (!frame) frame = requestAnimationFrame(paint);
  }

  // Reveals only hide content once this script is running, and anything at or
  // above the viewport bottom is always shown, so no heading can be left hidden.
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
  // Reduced motion: every scene is painted finished, with no entrance or loop.
  function preference() {
    syncLive();
    if (media.matches) {
      root.classList.remove('paint-pending');
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
      reveals.forEach((node) => node.classList.contains('is-revealed') || revealObserver.observe(node));
    }
    schedule();
  }
  addEventListener('scroll', schedule, { passive: true });
  addEventListener(
    'resize',
    () => {
      fan = false;
      schedule();
    },
    { passive: true },
  );
  addEventListener('pageshow', schedule);
  document.fonts?.ready.then(() => {
    fan = false;
    schedule();
  });
  media.addEventListener('change', preference);
  preference();
  paintName();
  // Fallback: if no observer callback ever arrives, nothing stays hidden.
  setTimeout(() => {
    if (!reveals.some((node) => node.classList.contains('is-revealed'))) reveals.forEach(show);
  }, 4000);
})();
