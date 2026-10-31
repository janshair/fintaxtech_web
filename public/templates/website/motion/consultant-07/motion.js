(() => {
  'use strict';
  const root = document.documentElement;
  const $ = (selector, node = document) => node.querySelector(selector);
  const $$ = (selector, node = document) => [...node.querySelectorAll(selector)];
  const stage = $('.motion-stage');
  const board = $('[data-board]', stage);
  const contactBar = $('.mobile-contact');
  const steps = $$('.process-steps li');
  // Phones show the active step under the board, since the list sits below it.
  const caption = $('[data-stage-caption]', stage);
  const captionNumber = $('[data-stage-number]', stage);
  const reveals = $$('[data-reveal]');
  const media = matchMedia('(prefers-reduced-motion: reduce)');
  const clamp = (value) => Math.max(0, Math.min(1, value));
  const ease = (value) => 1 - (1 - value) ** 3;
  let frame = 0;
  let activeStep = -1;
  const scenes = {};
  window.consultantMotion = { progress: 1, log: null, scenes, scenesLog: null };

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
    if (property.startsWith('--')) node.style.setProperty(property, value);
    else node.style[property] = value;
  }

  // Hero: the arch rises a little as the hero scrolls away (and the card a
  // little less). The signature draws itself once it is fully on screen, and
  // the monogram float and "This week" dot only run while the hero is visible.
  const heroArt = $('.hero-art');
  const arch = $('.signature-card', heroArt);
  const heroCard = $('.hero-card', heroArt);
  const signature = $('.signature-line', heroArt);
  let heroVisible = true;
  let signed = false;
  function syncLive() {
    heroArt.classList.toggle('is-live', heroVisible && !document.hidden && !media.matches);
  }
  function sign() {
    if (signed) return;
    signed = true;
    root.classList.remove('sign-pending');
    if (!media.matches)
      signature
        .querySelector('path')
        .animate([{ strokeDashoffset: 100 }, { strokeDashoffset: 0 }], {
          duration: 1100,
          delay: 100,
          easing: 'cubic-bezier(.45,.05,.25,1)',
          fill: 'backwards',
        });
  }
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(([entry]) => {
      heroVisible = entry.isIntersecting;
      syncLive();
      schedule();
    }).observe(heroArt);
    const signObserver = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.intersectionRatio > 0.98)) {
          signObserver.disconnect();
          sign();
        }
      },
      { threshold: [0, 1], rootMargin: `0px 0px -${Math.round(barInset())}px 0px` },
    );
    signObserver.observe(signature);
  } else sign();
  document.addEventListener('visibilitychange', syncLive);

  // Services: the four cards start as a fanned stack on the first card and deal
  // out into the list over ~500px of scroll, each a little after the last.
  // Layout offsets ignore transforms, so they are measured once per resize.
  const serviceGrid = $('.service-grid');
  const cards = $$('.service-card', serviceGrid);
  let fan = null;
  function measureFan() {
    const [first] = cards;
    fan = cards.map((card, i) => [
      first.offsetLeft - card.offsetLeft,
      first.offsetTop - card.offsetTop + i * 12,
      (i - 1.5) * 3,
    ]);
  }
  cards.forEach((card) => {
    const lift = () => card.classList.add('is-lifted');
    const drop = () => setTimeout(() => card.classList.remove('is-lifted'), 240);
    card.addEventListener('pointerdown', lift);
    ['pointerup', 'pointercancel', 'pointerleave'].forEach((type) =>
      card.addEventListener(type, drop),
    );
  });

  const caseArts = $$('[data-case-art]');
  const portrait = $('[data-portrait]');
  const credentials = $('.placeholders');
  const credentialItems = $$('li', credentials);
  const calendar = $('[data-calendar]');

  function paint() {
    frame = 0;
    const reduce = media.matches;
    if (!fan) measureFan();
    // Reads
    const bottom = innerHeight - barInset() - 8;
    const heroBox = heroArt.getBoundingClientRect();
    const read = (node, finish) =>
      reduce ? 1 : sceneProgress(node.getBoundingClientRect(), bottom, finish);
    const progress = read(board);
    const hero = reduce ? 0 : clamp(scrollY / Math.max(1, heroBox.bottom + scrollY));
    const services = reduce
      ? 1
      : clamp((bottom - 140 - serviceGrid.getBoundingClientRect().top) / 500);
    const work = caseArts.map((art) => read(art, 0.4));
    const about = read(portrait, 0.4);
    const listed = reduce ? 1 : clamp((bottom - credentials.getBoundingClientRect().top) / 240);
    const slots = read(calendar, 0.4);

    // Writes
    const rise = innerWidth < 861 ? 24 : 44;
    write(arch, 'translate', hero ? `0 ${(-rise * hero).toFixed(1)}px` : '');
    write(heroCard, 'translate', hero ? `0 ${(-rise * 0.35 * hero).toFixed(1)}px` : '');
    cards.forEach((card, i) => {
      const settled = ease(clamp(services * 1.6 - i * 0.2));
      const [dx, dy, turn] = fan[i];
      const open = 1 - settled;
      write(card, 'translate', open ? `${(dx * open).toFixed(1)}px ${(dy * open).toFixed(1)}px` : '');
      write(card, 'rotate', open ? `${(turn * open).toFixed(2)}deg` : '');
      write(card, '--fan', open.toFixed(3));
    });
    // Listen, Plan, Deliver: three equal stages, each eased within its own third.
    const done = [0, 1, 2].map((i) => clamp(progress * 3 - i));
    write(stage, '--progress', progress.toFixed(4));
    done.forEach((value, i) => write(stage, '--p' + (i + 1), value.toFixed(4)));
    caseArts.forEach((art, i) => write(art, '--cp', work[i].toFixed(4)));
    write(portrait, '--ap', about.toFixed(4));
    credentialItems.forEach((item, i) => {
      const shown = ease(clamp(listed * 1.8 - i * 0.4));
      write(item, 'transform', shown < 1 ? `translateX(${((shown - 1) * 28).toFixed(1)}px)` : '');
      write(item, 'opacity', shown < 1 ? shown.toFixed(3) : '');
    });
    write(calendar, '--cp', slots.toFixed(4));

    const current = Math.min(2, Math.floor(progress * 3));
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
    window.consultantMotion.progress = progress;
    Object.assign(scenes, {
      hero,
      services,
      board: progress,
      ...Object.fromEntries(work.map((value, i) => ['case' + (i + 1), value])),
      portrait: about,
      credentials: listed,
      calendar: slots,
    });
    const motion = window.consultantMotion;
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
      root.classList.remove('sign-pending');
      heroArt.getAnimations({ subtree: true }).forEach((animation) => animation.finish());
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
      fan = null;
      schedule();
    },
    { passive: true },
  );
  addEventListener('pageshow', schedule);
  document.fonts?.ready.then(() => {
    fan = null;
    schedule();
  });
  media.addEventListener('change', preference);
  preference();
  // Fallback: if no observer callback ever arrives, nothing stays hidden.
  setTimeout(() => {
    if (!reveals.some((node) => node.classList.contains('is-revealed'))) reveals.forEach(show);
  }, 4000);
})();
