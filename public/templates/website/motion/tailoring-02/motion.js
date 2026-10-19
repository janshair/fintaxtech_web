/* One Thread — template-local enhancement. Native scrolling; no network, storage or dependencies. */
(() => {
  'use strict';
  const root = document.documentElement;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const hero = document.querySelector('.hero');
  const art = document.querySelector('.hero-art');
  const identity = document.querySelector('.hero-identity');
  const scene = document.querySelector('#process');
  const stage = scene.querySelector('.stitch-stage');
  const seam = document.querySelector('#seam-path');
  const needle = document.querySelector('.needle');
  const seamLength = seam.getTotalLength();
  const spine = document.querySelector('.story-thread');
  const spinePath = spine.querySelector('path');
  const offer = document.querySelector('.agency-offer');
  const bar = document.querySelector('.mobile-actions');
  const cards = [...document.querySelectorAll('.work figure')];
  const steps = [...document.querySelectorAll('.steps li')];
  const copy = JSON.parse(document.querySelector('#template-copy').textContent);
  const clamp = (value) => Math.min(1, Math.max(0, value));
  const active = new Set();
  const animations = new Set();
  let geometry;
  let frame = 0;
  let needsMeasure = true;
  let heroVisible = true;
  let barSeen = false;
  let introPlayed = false;
  let introTimer;
  let nameTimer;
  let lastStep = -1;
  const values = new WeakMap();
  bar.addEventListener('animationend', () => bar.classList.remove('bar-arrived'));
  function variable(node, property, value) {
    const rounded = String(Math.round(value * 10000) / 10000);
    const cache = values.get(node) || {};
    if (cache[property] !== rounded) {
      node.style.setProperty(property, rounded);
      cache[property] = rounded;
      values.set(node, cache);
    }
  }
  function measure() {
    // Geometry is read together on resize/content changes, never once per element per scroll.
    const y = scrollY;
    const box = (node) => {
      const rect = node.getBoundingClientRect();
      return { top: rect.top + y, height: rect.height, width: rect.width, left: rect.left };
    };
    const heroBox = box(hero);
    const sceneBox = box(scene);
    const stageBox = box(stage);
    const offerBox = box(offer);
    const cardBoxes = cards.map(box);
    const anchors = [...document.querySelectorAll('main > section, footer, .agency-offer')].map(
      box,
    );
    const height = document.body.scrollHeight;
    const nameWidth = identity.getBoundingClientRect().width;
    geometry = {
      hero: heroBox,
      scene: sceneBox,
      stage: stageBox,
      offer: offerBox,
      cards: cardBoxes,
      max: Math.max(1, height - innerHeight),
    };
    const x = innerWidth < 768 ? 10 : Math.max(18, innerWidth * 0.025);
    let path = `M0 ${heroBox.top + 50} Q${x} ${heroBox.top + 50} ${x} ${heroBox.top + 80}`;
    for (const anchor of anchors.slice(1)) {
      const top = anchor.top;
      path += ` L${x} ${top - 25} C${x + 16} ${top - 8} ${x + 16} ${top + 8} ${x} ${top + 25}`;
    }
    path += ` L${x} ${offerBox.top + offerBox.height / 2} L8 ${offerBox.top + offerBox.height / 2}`;
    spine.setAttribute('viewBox', `0 0 ${innerWidth} ${height}`);
    spinePath.setAttribute('d', path);
    const rect = offer.querySelector('rect');
    rect.setAttribute('width', String(Math.max(0, offerBox.width - 16)));
    rect.setAttribute('height', String(Math.max(0, offerBox.height - 16)));
    identity.style.setProperty('--name-travel', `${Math.max(0, nameWidth - 30)}px`);
    needsMeasure = false;
  }
  function ambient() {
    art.classList.toggle('ambient-active', heroVisible && !document.hidden && !reduced.matches);
  }
  function stitchName() {
    clearTimeout(nameTimer);
    identity.classList.remove('name-sewing');
    const containers = [...identity.querySelectorAll('[data-business], [data-hero-area]')];
    if (reduced.matches) return;
    let index = 0;
    const words = containers
      .flatMap((node) => node.textContent.split(/(\s+)/u))
      .filter((word) => word.trim());
    for (const node of containers) {
      const text = node.textContent;
      node.replaceChildren();
      for (const word of text.split(/(\s+)/u)) {
        if (!word.trim()) {
          node.append(document.createTextNode(word));
          continue;
        }
        const span = document.createElement('span');
        span.className = 'name-word';
        span.textContent = word;
        span.style.setProperty(
          '--word-delay',
          `${index++ * Math.min(innerWidth < 768 ? 35 : 85, (innerWidth < 768 ? 160 : 650) / Math.max(1, words.length))}ms`,
        );
        node.append(span);
      }
    }
    // A frame boundary restarts only the name, without forcing synchronous layout.
    requestAnimationFrame(() => {
      if (reduced.matches) return;
      identity.classList.add('name-sewing');
      nameTimer = setTimeout(
        () => identity.classList.remove('name-sewing'),
        innerWidth < 768 ? 1100 : 1500,
      );
    });
    needsMeasure = true;
    request();
  }
  function animate(node, keyframes, options) {
    if (reduced.matches || document.hidden) return;
    const animation = node.animate(keyframes, {
      duration: 420,
      easing: 'cubic-bezier(.2,.75,.25,1)',
      ...options,
    });
    animations.add(animation);
    animation.finished.catch(() => {}).finally(() => animations.delete(animation));
  }
  function render() {
    frame = 0;
    if (document.hidden) return;
    if (needsMeasure || !geometry) measure();
    if (reduced.matches) return;
    const y = scrollY;
    const { scene: sceneBox, stage: stageBox, hero: heroBox, offer: offerBox } = geometry;
    variable(root, '--thread-progress', clamp(y / geometry.max));
    if (heroVisible) variable(art, '--hero-away', clamp((y - heroBox.top) / heroBox.height));
    if (active.has(scene)) {
      const p =
        innerWidth < 768
          ? clamp((y + innerHeight * 0.83 - stageBox.top) / (innerHeight * 0.64))
          : clamp((y - sceneBox.top) / Math.max(1, sceneBox.height - innerHeight));
      const sewn = clamp((p - 0.36) / 0.43);
      variable(scene, '--measure', clamp(p / 0.22));
      variable(scene, '--pin', clamp((p - 0.18) / 0.2));
      variable(scene, '--press', clamp((p - 0.79) / 0.21));
      variable(scene, '--steam', Math.sin(clamp((p - 0.79) / 0.21) * Math.PI));
      variable(root, '--stitch', sewn);
      const point = seam.getPointAtLength(sewn * seamLength);
      // Needle bobs along the seam with scroll position, not a continuous timer.
      needle.setAttribute(
        'transform',
        `translate(${point.x} ${point.y - Math.sin(sewn * Math.PI * 16) * 3})`,
      );
      const step = p < 0.22 ? 0 : p < 0.79 ? 1 : 2;
      if (step !== lastStep) {
        steps.forEach((node, i) => node.classList.toggle('step-current', i === step));
        lastStep = step;
      }
    }
    cards.forEach((card, i) => {
      if (!active.has(card)) return;
      const p = clamp((y + innerHeight * 0.7 - geometry.cards[i].top) / (innerHeight * 0.38));
      variable(card, '--work-progress', p);
      const label = p < 0.55 ? copy.work.before : copy.work.after;
      const state = card.querySelector('[data-work-state]');
      if (state.textContent !== label) state.textContent = label;
    });
    const finish = clamp((y + innerHeight - offerBox.top - 25) / Math.max(80, offerBox.height));
    variable(offer, '--finish', finish);
    if (finish > 0.95 && !offer.classList.contains('thread-finished'))
      offer.classList.add('thread-finished');
    const barVisible = y > heroBox.top + heroBox.height - 80;
    bar.classList.toggle('bar-visible', barVisible);
    bar.inert = !barVisible;
    if (!barVisible) bar.classList.remove('bar-arrived');
    if (barVisible && !barSeen) {
      barSeen = true;
      bar.classList.add('bar-arrived');
    }
  }
  function request() {
    if (!frame && !document.hidden) frame = requestAnimationFrame(render);
  }
  function configure() {
    clearTimeout(introTimer);
    root.classList.toggle('motion-ready', !reduced.matches);
    root.classList.toggle('reveal-ready', !reduced.matches);
    ambient();
    if (reduced.matches) {
      pendingReveals.forEach((_, node) => finishReveal(node, true));
      cancelAnimationFrame(frame);
      frame = 0;
      clearTimeout(nameTimer);
      root.classList.remove('load-sequence');
      identity.classList.remove('name-sewing');
      animations.forEach((animation) => animation.cancel());
      animations.clear();
      variable(root, '--stitch', 1);
      variable(root, '--thread-progress', 1);
      variable(art, '--hero-away', 0);
      variable(scene, '--measure', 1);
      variable(scene, '--pin', 1);
      variable(scene, '--press', 1);
      variable(scene, '--steam', 0);
      const point = seam.getPointAtLength(seamLength);
      needle.setAttribute('transform', `translate(${point.x} ${point.y})`);
      cards.forEach((card) => {
        variable(card, '--work-progress', 1);
        card.querySelector('[data-work-state]').textContent = copy.work.after;
      });
      steps.forEach((step) => step.classList.add('step-current'));
      lastStep = -1;
      variable(offer, '--finish', 1);
      bar.inert = false;
      needsMeasure = true;
      request();
      return;
    }
    needsMeasure = true;
    if (!introPlayed) {
      introPlayed = true;
      root.classList.add('load-sequence');
      stitchName();
      introTimer = setTimeout(
        () => root.classList.remove('load-sequence'),
        innerWidth < 768 ? 1450 : 2400,
      );
    }
    request();
  }
  // Below-fold scenes are activated near the viewport, not continuously measured.
  const nearby = new IntersectionObserver(
    (entries) => {
      entries.forEach(({ target, isIntersecting }) =>
        isIntersecting ? active.add(target) : active.delete(target),
      );
      request();
    },
    { rootMargin: '120px 0px' },
  );
  [scene, ...cards].forEach((node) => nearby.observe(node));
  new IntersectionObserver(([entry]) => {
    heroVisible = entry.isIntersecting;
    ambient();
    request();
  }).observe(art);
  const reveals = document.querySelectorAll(
    '.section-heading, .service-row, .work header, .reviews h2, .reviews > p, .review-grid > p, .visit > div, .contact > div, .contact dl > div',
  );
  const pendingReveals = new Map();
  let revealWatchdog;
  function finishReveal(node, force = false) {
    node.classList.add('revealed');
    if (force) node.classList.add('reveal-forced');
    pendingReveals.delete(node);
    reveal.unobserve(node);
    if (!pendingReveals.size) clearInterval(revealWatchdog);
  }
  const reveal = new IntersectionObserver(
    (entries) =>
      entries.forEach(({ target, isIntersecting, intersectionRect }) => {
        if (isIntersecting && intersectionRect.width > 0 && intersectionRect.height > 0)
          finishReveal(target);
      }),
    { threshold: 0, rootMargin: '0px' },
  );
  reveals.forEach((node, i) => {
    node.setAttribute('data-reveal', '');
    node.style.setProperty('--reveal-delay', `${(i % 3) * 65}ms`);
    pendingReveals.set(node, null);
    reveal.observe(node);
  });
  // Independent of IntersectionObserver: a missed callback must never leave readable content hidden.
  // Only pending elements are sampled, at 4Hz; the timer stops once they are all revealed.
  revealWatchdog = setInterval(() => {
    const now = performance.now();
    const boxes = [...pendingReveals].map(([node, since]) => [
      node,
      since,
      node.getBoundingClientRect(),
    ]);
    for (const [node, since, box] of boxes) {
      const visible =
        !document.hidden &&
        box.bottom > 0 &&
        box.top < innerHeight &&
        box.right > 0 &&
        box.left < innerWidth;
      if (!visible) pendingReveals.set(node, null);
      else if (since === null) pendingReveals.set(node, now);
      else if (now - since >= 1000) finishReveal(node, true);
    }
  }, 250);
  document.querySelectorAll('.contact dl > div').forEach((row) => {
    if (row.querySelector('dd').textContent === 'Closed') row.classList.add('hours-closed');
  });
  new ResizeObserver(() => {
    needsMeasure = true;
    request();
  }).observe(document.body);
  addEventListener('resize', () => {
    needsMeasure = true;
    request();
  });
  addEventListener(
    'scroll',
    () => {
      if (!reduced.matches) request();
    },
    { passive: true },
  );
  addEventListener('pageshow', () => {
    needsMeasure = true;
    request();
  });
  document.addEventListener('tailoring:name', stitchName);
  document.addEventListener('tailoring:dialog', ({ detail: { dialog, trigger } }) => {
    const dialogBox = dialog.getBoundingClientRect();
    const triggerBox = trigger?.getBoundingClientRect();
    if (triggerBox)
      dialog.style.transformOrigin = `${clamp((triggerBox.left - dialogBox.left) / dialogBox.width) * 100}% ${clamp((triggerBox.top - dialogBox.top) / dialogBox.height) * 100}%`;
    animate(dialog, [
      { transform: 'scale(.96)', clipPath: 'inset(0 0 85% 0)', opacity: 0.65 },
      { transform: 'scale(1)', clipPath: 'inset(0)', opacity: 1 },
    ]);
  });
  document.addEventListener('tailoring:step', ({ detail: panel }) => {
    animate(
      panel,
      [
        { transform: 'translateX(18px)', opacity: 0.3 },
        { transform: 'translateX(0)', opacity: 1 },
      ],
      { duration: 300 },
    );
    if (panel.id === 'booking-final')
      animate(
        panel.querySelector('.confirmation-thread path'),
        [{ strokeDashoffset: 1 }, { strokeDashoffset: 0 }],
        { duration: 700 },
      );
  });
  document.addEventListener('visibilitychange', () => {
    ambient();
    root.classList.toggle('tab-hidden', document.hidden);
    if (document.hidden) {
      cancelAnimationFrame(frame);
      frame = 0;
      animations.forEach((animation) => animation.pause());
    } else {
      animations.forEach((animation) => animation.play());
      needsMeasure = true;
      request();
    }
  });
  reduced.addEventListener('change', configure);
  configure();
})();
