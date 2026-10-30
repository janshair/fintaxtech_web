(() => {
  'use strict';
  const root = document.documentElement;
  const stage = document.querySelector('.motion-stage');
  const illustration = stage.querySelector('[data-lift-illustration]');
  const contactBar = document.querySelector('.mobile-contact');
  const steps = [...document.querySelectorAll('.process-steps li')];
  // Phones show the active step under the graphic, since the list sits below it.
  const caption = stage.querySelector('[data-stage-caption]');
  const captionNumber = stage.querySelector('[data-stage-number]');
  const reveals = [...document.querySelectorAll('[data-reveal]')];
  const media = matchMedia('(prefers-reduced-motion: reduce)');
  let frame = 0;
  let activeStep = -1;
  window.gymMotion = { progress: 1, log: null };

  // Progress: 0 as the illustration's top enters the visible bottom of the
  // viewport (above the fixed contact bar), 1 when its centre is ~35% down.
  const clamp = (value) => Math.max(0, Math.min(1, value));
  const phone = () => innerWidth < 768;
  function barInset() {
    const bar = contactBar.getBoundingClientRect();
    const fixed = bar.height && getComputedStyle(contactBar).position === 'fixed';
    return fixed ? Math.max(0, innerHeight - bar.top) : 0;
  }
  function measure() {
    const bounds = illustration.getBoundingClientRect();
    const visibleBottom = innerHeight - barInset() - 8;
    const finishCentre = Math.max(innerHeight * (phone() ? 0.25 : 0.35), bounds.height / 2 + 8);
    const travel = visibleBottom - finishCentre + bounds.height / 2;
    return Math.max(0, Math.min(1, (visibleBottom - bounds.top) / Math.max(1, travel)));
  }
  function paint() {
    frame = 0;
    const progress = media.matches ? 1 : measure();
    // Three equal stages, each eased only within its own third.
    const stagesDone = [0, 1, 2].map((i) => Math.max(0, Math.min(1, progress * 3 - i)));
    stage.style.setProperty('--lift-progress', progress.toFixed(4));
    stagesDone.forEach((value, i) => stage.style.setProperty('--p' + (i + 1), value.toFixed(4)));
    window.gymMotion.progress = progress;
    if (window.gymMotion.log) window.gymMotion.log.push([Math.round(scrollY), progress]);
    const current = Math.min(2, Math.floor(progress * 3));
    if (activeStep !== current) {
      steps.forEach((node, index) => {
        node.classList.toggle('is-current', index === current);
        node.classList.toggle('is-done', index < current || progress === 1);
        if (index === current) node.setAttribute('aria-current', 'step');
        else node.removeAttribute('aria-current');
      });
      caption.textContent = steps[current].querySelector('h3').textContent;
      captionNumber.textContent = '0' + (current + 1);
      activeStep = current;
    }
    if (progress === 1) steps.forEach((node) => node.classList.add('is-done'));
    revealVisible();
    paintHero();
    paintScenes();
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

  // Hero kettlebell: a once-only entrance when 40% visible, a gentle loop while
  // on screen, a scroll-linked swing as the hero leaves, and tap-to-swing.
  // Every layer is its own SVG group, animated with transform/opacity only.
  const art = document.querySelector('.hero-art');
  const kettlebell = art.querySelector('.hero-kettlebell');
  const part = (selector) => art.querySelector(selector);
  const layers = {
    scroll: part('.kb-scroll'),
    tap: part('.kb-tap'),
    sway: part('.kb-sway'),
    drop: part('.kb-drop'),
    mark: part('.kb-mark'),
    halo: part('.kb-halo'),
    shadow: part('.kb-shadow'),
    dumbbell: part('.hero-dumbbell'),
    dumbbellScroll: part('.db-scroll'),
    plates: part('.hero-plates'),
    platesScroll: part('.pl-scroll'),
    sparks: [...art.querySelectorAll('.spark')],
    badge: part('.hero-sticker'),
    card: part('.hero-card'),
    rows: [...art.querySelectorAll('.hero-card li')],
    dot: part('.next-dot'),
  };
  const hero = { angle: 0, progress: 0, entered: false, taps: 0, log: null };
  window.gymMotion.hero = hero;
  let heroOnScreen = false;
  let ambient = [];

  // Swing 0 → 35° → 0 between the illustration being fully above the contact
  // bar (or the top of the page) and 60% of it having scrolled away.
  function paintHero() {
    if (media.matches || (!heroOnScreen && (hero.progress === 0 || hero.progress === 1))) return;
    const box = kettlebell.getBoundingClientRect();
    const top = box.top + scrollY;
    const start = Math.max(0, top + box.height - (innerHeight - barInset()));
    const end = Math.max(start + 1, top + box.height * 0.6);
    const progress = Math.max(0, Math.min(1, (scrollY - start) / (end - start)));
    const swing = Math.sin(Math.PI * progress);
    hero.progress = progress;
    hero.angle = -35 * swing;
    layers.scroll.style.transform = `rotate(${hero.angle.toFixed(2)}deg)`;
    layers.dumbbellScroll.style.transform = `translateX(${(-22 * progress).toFixed(2)}px)`;
    layers.platesScroll.style.transform = `rotate(${(14 * progress).toFixed(2)}deg)`;
    if (hero.log) hero.log.push([Math.round(scrollY), +hero.angle.toFixed(2)]);
  }

  const play = (node, keyframes, delay, duration, easing = 'cubic-bezier(.2,.7,.2,1)') =>
    node.animate(keyframes, { delay, duration, easing, fill: 'backwards' });
  const dropFrames = [
    { transform: 'translateY(-120px)', opacity: 0, easing: 'ease-in' },
    { transform: 'translateY(-70px)', opacity: 1, offset: 0.22, easing: 'ease-in' },
    { transform: 'translateY(0px) scale(1.08, 0.9)', offset: 0.55, easing: 'ease-out' },
    { transform: 'translateY(-14px) scale(0.97, 1.04)', offset: 0.72, easing: 'ease-in' },
    { transform: 'translateY(0px) scale(1.03, 0.97)', offset: 0.86, easing: 'ease-out' },
    { transform: 'translateY(0px) scale(1, 1)', opacity: 1 },
  ];
  const dropShadowFrames = [
    { transform: 'scale(0.3, 0.5)', opacity: 0, easing: 'ease-in' },
    { transform: 'scale(1.15, 0.8)', opacity: 1, offset: 0.55, easing: 'ease-out' },
    { transform: 'scale(0.95, 1.04)', offset: 0.72 },
    { transform: 'scale(1, 1)', opacity: 1 },
  ];
  const hopFrames = [
    { transform: 'translateY(0px) scale(1, 1)', easing: 'ease-out' },
    { transform: 'translateY(0px) scale(1.06, 0.92)', offset: 0.18, easing: 'ease-out' },
    { transform: 'translateY(-34px) scale(0.97, 1.04)', offset: 0.45, easing: 'ease-in' },
    { transform: 'translateY(0px) scale(1.06, 0.93)', offset: 0.7, easing: 'ease-out' },
    { transform: 'translateY(0px) scale(1, 1)' },
  ];
  const hopShadowFrames = [
    { transform: 'scale(1, 1)' },
    { transform: 'scale(1.06, 1)', offset: 0.18 },
    { transform: 'scale(0.78, 0.8)', offset: 0.45 },
    { transform: 'scale(1.1, 0.9)', offset: 0.7 },
    { transform: 'scale(1, 1)' },
  ];
  function entrance() {
    const peek = matchMedia('(max-width: 767px)').matches;
    root.classList.remove('kb-pending');
    const finished = [
      // Phones (peek mode): an in-place hop. Otherwise it falls, lands squashed,
      // rebounds stretched and settles.
      play(layers.drop, peek ? hopFrames : dropFrames, 0, 720, 'linear'),
      play(layers.shadow, peek ? hopShadowFrames : dropShadowFrames, 0, 720, 'linear'),
      play(
        layers.mark,
        [
          { transform: 'scale(1.8)', opacity: 0 },
          { transform: 'scale(0.9)', opacity: 1, offset: 0.7 },
          { transform: 'scale(1)', opacity: 1 },
        ],
        620,
        280,
        'ease-out',
      ),
      play(
        layers.dumbbell,
        [
          { transform: 'translateX(190px)', opacity: 0 },
          { opacity: 1, offset: 0.2 },
          { transform: 'translateX(-8px)', offset: 0.78 },
          { transform: 'translateX(0px)', opacity: 1 },
        ],
        250,
        600,
      ),
      play(
        layers.plates,
        [
          { transform: 'translateX(-170px) rotate(0deg)', opacity: 0 },
          { opacity: 1, offset: 0.25 },
          { transform: 'translateX(0px) rotate(0deg)', offset: 0.55 },
          { transform: 'translateX(0px) rotate(-7deg)', offset: 0.7 },
          { transform: 'translateX(0px) rotate(4deg)', offset: 0.85 },
          { transform: 'translateX(0px) rotate(0deg)', opacity: 1 },
        ],
        300,
        620,
      ),
      ...layers.sparks.map((spark, i) =>
        play(
          spark,
          [
            peek
              ? { transform: 'scale(1) rotate(0deg)', opacity: 1 }
              : { transform: 'scale(0) rotate(-90deg)', opacity: 0 },
            { transform: 'scale(1.3) rotate(10deg)', opacity: 1, offset: 0.6 },
            { transform: 'scale(1) rotate(0deg)', opacity: 1 },
          ],
          500 + i * 150,
          300,
        ),
      ),
      play(
        layers.badge,
        peek
          ? [
              { transform: 'scale(1) rotate(0deg)' },
              { transform: 'scale(1.12) rotate(-10deg)', offset: 0.4 },
              { transform: 'scale(1) rotate(5deg)', offset: 0.7 },
              { transform: 'scale(1) rotate(0deg)' },
            ]
          : [
              { transform: 'scale(0.4) rotate(-22deg)', opacity: 0 },
              { transform: 'scale(1.08) rotate(6deg)', opacity: 1, offset: 0.65 },
              { transform: 'scale(1) rotate(0deg)', opacity: 1 },
            ],
        700,
        350,
      ),
      play(
        layers.card,
        [
          { transform: 'translateY(28px)', opacity: 0 },
          { transform: 'translateY(0px)', opacity: 1 },
        ],
        800,
        300,
      ),
      ...layers.rows.map((row, i) =>
        play(
          row,
          [
            { transform: 'translateX(-10px)', opacity: 0 },
            { transform: 'translateX(0px)', opacity: 1 },
          ],
          1000 + i * 110,
          150,
        ),
      ),
    ].map((animation) => animation.finished);
    Promise.all(finished).then(startAmbient, () => {});
  }

  function startAmbient() {
    if (media.matches || ambient.length) return;
    const loop = (node, keyframes, duration, options = {}) =>
      node.animate(keyframes, { duration, iterations: Infinity, ...options });
    ambient = [
      // A pendulum from the handle: ease out of centre, ease into each extreme.
      loop(
        layers.sway,
        [
          { transform: 'rotate(0deg)', easing: 'ease-out' },
          { transform: 'rotate(4deg)', offset: 0.25, easing: 'ease-in-out' },
          { transform: 'rotate(-4deg)', offset: 0.75, easing: 'ease-in' },
          { transform: 'rotate(0deg)' },
        ],
        3600,
      ),
      ...layers.sparks.map((spark, i) =>
        loop(
          spark,
          [
            { transform: 'scale(1) rotate(0deg)', opacity: 1 },
            { transform: 'scale(1) rotate(0deg)', opacity: 1, offset: 0.72 },
            { transform: 'scale(1.35) rotate(45deg)', opacity: 0.55, offset: 0.82 },
            { transform: 'scale(1) rotate(0deg)', opacity: 1 },
          ],
          4200 + i * 900,
          { delay: i * 1300, easing: 'ease-in-out' },
        ),
      ),
      loop(layers.badge, [{ transform: 'rotate(0deg)' }, { transform: 'rotate(360deg)' }], 48000),
      loop(layers.halo, [{ transform: 'scale(1)' }, { transform: 'scale(1.03)' }], 4000, {
        direction: 'alternate',
        easing: 'ease-in-out',
      }),
      loop(
        layers.dot,
        [
          { transform: 'scale(1)', opacity: 1 },
          { transform: 'scale(1.5)', opacity: 0.55 },
        ],
        900,
        { direction: 'alternate', easing: 'ease-in-out' },
      ),
    ];
    syncAmbient();
  }
  // The loop only runs while the hero is on screen and the tab is visible.
  function syncAmbient() {
    const run = heroOnScreen && !document.hidden;
    ambient.forEach((animation) => (run ? animation.play() : animation.pause()));
  }

  part('.kb-button').addEventListener('click', () => {
    if (media.matches) return;
    hero.taps++;
    layers.tap.animate(
      [
        { transform: 'rotate(0deg)', easing: 'ease-out' },
        { transform: 'rotate(-34deg)', offset: 0.32, easing: 'ease-in-out' },
        { transform: 'rotate(14deg)', offset: 0.62, easing: 'ease-in-out' },
        { transform: 'rotate(-4deg)', offset: 0.84, easing: 'ease-in-out' },
        { transform: 'rotate(0deg)' },
      ],
      { duration: 1200 },
    );
    layers.mark.animate(
      [
        { transform: 'scale(1)' },
        { transform: 'scale(1.25)', offset: 0.35 },
        { transform: 'scale(0.94)', offset: 0.7 },
        { transform: 'scale(1)' },
      ],
      { duration: 520, delay: 380, easing: 'ease-out' },
    );
  });

  // "40% visible" counts only the part above the fixed contact bar. Desktop
  // measures the kettlebell itself. Phones already show its top as a peek, so
  // they wait for the lowest animated row (the dumbbell) to be 40% visible;
  // otherwise the stamp, plates and card would play hidden behind the bar.
  const enterObserver = new IntersectionObserver(
    (entries) => {
      if (hero.entered || !entries.some((entry) => entry.intersectionRatio >= 0.4)) return;
      hero.entered = true;
      enterObserver.disconnect();
      if (!media.matches) entrance();
    },
    { threshold: [0, 0.4, 0.6], rootMargin: `0px 0px -${Math.round(barInset())}px 0px` },
  );
  enterObserver.observe(matchMedia('(max-width: 767px)').matches ? layers.dumbbell : layers.sway);
  new IntersectionObserver(([entry]) => {
    heroOnScreen = entry.isIntersecting;
    syncAmbient();
    schedule();
  }).observe(art);
  document.addEventListener('visibilitychange', syncAmbient);
  function heroPreference() {
    if (media.matches) {
      // Reduced motion: the settled illustration, no entrance, loop, scroll or tap.
      root.classList.remove('kb-pending');
      art.getAnimations({ subtree: true }).forEach((animation) => animation.cancel());
      ambient = [];
      [layers.scroll, layers.dumbbellScroll, layers.platesScroll].forEach((node) => {
        node.style.transform = '';
      });
      hero.angle = 0;
    } else if (hero.entered) startAmbient();
  }

  // Scenes below the hero, one per phone screen, on the same loop. Each runs
  // 0 → 1 from entering above the contact bar to its centre reaching 35% of
  // the viewport (about 550–650px on a phone). Reads first, then writes.
  // Reduced motion paints every scene finished.
  function sceneProgress(box, finish = 0.35) {
    const bottom = innerHeight - barInset() - 8;
    const finishCentre = Math.max(innerHeight * finish, box.height / 2 + 8);
    return clamp((bottom - box.top) / Math.max(1, bottom - finishCentre + box.height / 2));
  }
  const ptCard = document.querySelector('.service-card.has-art');
  const ptSwing = ptCard.querySelector('.ck-swing');
  const hours = document.querySelector('.hours');
  const hourTimes = [...hours.querySelectorAll('dd')];
  const wipes = [...document.querySelectorAll('[data-wipe]')];
  const scenes = (window.gymMotion.scenes = {});
  let pulse = null;
  // The pulse runs down the active day's gutter with a beat beside each class.
  function buildPulse() {
    const panel = document.querySelector('.day-panel.is-active');
    if (!panel || !panel.offsetHeight) return;
    const svg = panel.querySelector('.pulse');
    const path = svg.querySelector('path');
    const top = panel.getBoundingClientRect().top;
    const height = panel.offsetHeight;
    const rows = [...panel.querySelectorAll('li')].map((li) => {
      const box = li.getBoundingClientRect();
      return [li, Math.round(box.top - top + box.height / 2)];
    });
    let d = 'M15 0';
    for (const [, y] of rows)
      d += `V${y - 18}L11 ${y - 12}L28 ${y - 4}L3 ${y + 6}L15 ${y + 14}`;
    svg.setAttribute('viewBox', `0 0 30 ${height}`);
    path.setAttribute('d', d + `V${height}`);
    path.setAttribute('pathLength', '100');
    path.style.strokeDasharray = '100';
    pulse = { panel, path, height, rows };
  }
  function paintScenes() {
    const reduce = media.matches;
    if (!pulse || !pulse.panel.classList.contains('is-active')) buildPulse();
    const bottom = innerHeight - barInset();
    const pt = reduce ? 1 : sceneProgress(ptCard.getBoundingClientRect());
    const tt = reduce || !pulse ? 1 : sceneProgress(pulse.panel.getBoundingClientRect());
    const hp = reduce ? 1 : sceneProgress(hours.getBoundingClientRect());
    // Gallery pictures wipe in as each one rises fully above the contact bar.
    const wipe = wipes.map((art) => {
      if (reduce) return 1;
      const box = art.getBoundingClientRect();
      return clamp((bottom - box.top) / box.height);
    });
    // A pendulum that swings out, back and settles as the card passes.
    const angle = reduce ? 0 : 40 * Math.sin(3 * Math.PI * pt) * (1 - 0.4 * pt);
    ptSwing.style.transform = `rotate(${angle.toFixed(2)}deg)`;
    if (pulse) {
      pulse.path.style.strokeDashoffset = (100 * (1 - tt)).toFixed(2);
      pulse.rows.forEach(([li, y]) => li.classList.toggle('is-beat', tt * pulse.height >= y));
    }
    hours.style.setProperty('--ring', hp.toFixed(4));
    hourTimes.forEach((time, i) => {
      const settled = clamp((hp - 0.15 - i * 0.18) / 0.15);
      time.style.transform = `translateY(${Math.round((1 - settled) * 14)}px)`;
      time.style.opacity = settled.toFixed(3);
    });
    wipes.forEach((art, i) => art.style.setProperty('--wipe', wipe[i].toFixed(4)));
    Object.assign(scenes, { train: pt, timetable: tt, visit: hp, swing: angle });
    wipe.forEach((value, i) => (scenes['gallery' + (i + 1)] = value));
    if (window.gymMotion.scenesLog)
      window.gymMotion.scenesLog.push({
        y: Math.round(scrollY),
        hero: +hero.progress.toFixed(3),
        lift: +window.gymMotion.progress.toFixed(3),
        ...Object.fromEntries(
          Object.entries(scenes)
            .filter(([key]) => key !== 'swing')
            .map(([key, value]) => [key, +value.toFixed(3)]),
        ),
      });
  }
  document.addEventListener('gym:day', () => {
    pulse = null;
    schedule();
  });
  addEventListener('resize', () => (pulse = null), { passive: true });
  document.fonts?.ready.then(() => {
    pulse = null;
    schedule();
  });

  function preference() {
    heroPreference();
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
  addEventListener('resize', schedule, { passive: true });
  addEventListener('pageshow', schedule);
  media.addEventListener('change', preference);
  preference();
  // Fallback: if no observer callback ever arrives, nothing stays hidden.
  setTimeout(() => {
    if (!reveals.some((node) => node.classList.contains('is-revealed'))) reveals.forEach(show);
  }, 4000);
})();
