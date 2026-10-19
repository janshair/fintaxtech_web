/* The Road Ahead — original, template-local motion. No dependency, network or scroll hijacking. */
(() => {
  'use strict';
  const root = document.documentElement;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const hero = document.querySelector('.hero');
  const art = document.querySelector('.hero-art');
  const identity = document.querySelector('.hero-identity');
  const scene = document.querySelector('.workshop');
  const stage = document.querySelector('.workshop-stage > .automotive-art');
  const spine = document.querySelector('.road-spine');
  const offer = document.querySelector('.agency-offer');
  const bar = document.querySelector('.mobile-actions');
  const cards = [...document.querySelectorAll('.work figure')];
  const steps = [...document.querySelectorAll('.steps li')];
  const copy = JSON.parse(document.querySelector('#template-copy').textContent);
  const clamp = (value) => Math.min(1, Math.max(0, value));
  const active = new Set();
  const animations = new Set();
  const values = new WeakMap();
  let geometry,
    frame = 0,
    workshopFrame = 0,
    needsMeasure = true,
    heroVisible = true,
    introPlayed = false,
    introTimer,
    nameTimer,
    lastStep = -1,
    barSeen = false;
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
    // Batched layout reads on resize/content changes; no element measurements in the scroll loop.
    const y = scrollY;
    const box = (node) => {
      const rect = node.getBoundingClientRect();
      return { top: rect.top + y, height: rect.height, width: rect.width };
    };
    geometry = {
      hero: box(hero),
      offer: box(offer),
      cards: cards.map(box),
      max: Math.max(1, document.body.scrollHeight - innerHeight),
    };
    const anchors = [...document.querySelectorAll('main > section, footer, .agency-offer')].map(
      box,
    );
    const height = document.body.scrollHeight;
    const x = innerWidth < 768 ? 10 : Math.max(18, innerWidth * 0.025);
    let path = `M${x} ${geometry.hero.top + 30}`;
    anchors.slice(1).forEach(({ top }) => {
      path += ` L${x} ${top - 40} C${x + 12} ${top - 20} ${x + 12} ${top + 20} ${x} ${top + 40}`;
    });
    path += ` L${x} ${geometry.offer.top + geometry.offer.height / 2} L8 ${geometry.offer.top + geometry.offer.height / 2}`;
    spine.setAttribute('viewBox', `0 0 ${innerWidth} ${height}`);
    spine.querySelector('path').setAttribute('d', path);
    offer
      .querySelector('rect')
      .setAttribute('width', String(Math.max(0, geometry.offer.width - 16)));
    offer
      .querySelector('rect')
      .setAttribute('height', String(Math.max(0, geometry.offer.height - 16)));
    needsMeasure = false;
  }
  function ambient() {
    art.classList.toggle('ambient-active', heroVisible && !document.hidden && !reduced.matches);
  }
  function animate(node, keyframes, options) {
    if (reduced.matches || document.hidden) return;
    const animation = node.animate(keyframes, {
      duration: 400,
      easing: 'cubic-bezier(.2,.75,.25,1)',
      ...options,
    });
    animations.add(animation);
    animation.finished.catch(() => {}).finally(() => animations.delete(animation));
  }
  function nameArrival() {
    clearTimeout(nameTimer);
    identity.classList.remove('name-arriving');
    if (reduced.matches) return;
    requestAnimationFrame(() => {
      if (reduced.matches) return;
      identity.classList.add('name-arriving');
      nameTimer = setTimeout(() => identity.classList.remove('name-arriving'), 450);
    });
    needsMeasure = true;
    request();
  }
  function updateWorkshop() {
    workshopFrame = 0;
    if (document.hidden || reduced.matches) return;
    // The illustration follows normal document flow at every width. Start when its top
    // enters the viewport; finish when its centre reaches 35% of the viewport height.
    const rect = stage.getBoundingClientRect();
    const distance = innerHeight * 0.65 + rect.height / 2;
    const p = clamp((innerHeight - rect.top) / Math.max(1, distance));
    const scan = clamp(p / 0.33);
    const tool = clamp((p - 0.33) / 0.33);
    variable(scene, '--service-progress', p);
    variable(scene, '--scan-progress', scan);
    variable(scene, '--tool-progress', tool);
    variable(scene, '--scan', Math.sin(scan * Math.PI));
    variable(scene, '--tool', Math.sin(tool * Math.PI));
    variable(scene, '--check', clamp((p - 0.66) / 0.34));
    const step = p < 0.33 ? 0 : p < 0.66 ? 1 : 2;
    if (step !== lastStep) {
      steps.forEach((node, i) => node.classList.toggle('step-current', i === step));
      lastStep = step;
    }
  }
  function requestWorkshop() {
    if (!workshopFrame && !document.hidden && !reduced.matches)
      workshopFrame = requestAnimationFrame(updateWorkshop);
  }
  function render() {
    frame = 0;
    if (document.hidden) return;
    if (needsMeasure || !geometry) measure();
    if (reduced.matches) return;
    const y = scrollY;
    variable(root, '--road-progress', clamp(y / geometry.max));
    cards.forEach((card, i) => {
      if (!active.has(card)) return;
      const p = clamp((y + innerHeight * 0.8 - geometry.cards[i].top) / (innerHeight * 0.4));
      variable(card, '--work-progress', p);
      const state = card.querySelector('[data-work-state]');
      const label = p < 0.55 ? copy.work.before : copy.work.after;
      if (state.textContent !== label) state.textContent = label;
    });
    variable(
      offer,
      '--finish',
      clamp((y + innerHeight - geometry.offer.top - 25) / Math.max(80, geometry.offer.height)),
    );
    const visible = y > geometry.hero.top + geometry.hero.height - 80;
    bar.classList.toggle('bar-visible', visible);
    bar.inert = !visible;
    if (visible && !barSeen) {
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
    ambient();
    if (reduced.matches) {
      cancelAnimationFrame(frame);
      cancelAnimationFrame(workshopFrame);
      frame = 0;
      workshopFrame = 0;
      clearTimeout(nameTimer);
      root.classList.remove('load-sequence');
      identity.classList.remove('name-arriving');
      animations.forEach((a) => a.cancel());
      animations.clear();
      variable(root, '--road-progress', 1);
      variable(scene, '--service-progress', 1);
      variable(scene, '--scan-progress', 1);
      variable(scene, '--tool-progress', 1);
      variable(scene, '--scan', 0);
      variable(scene, '--tool', 0);
      variable(scene, '--check', 1);
      cards.forEach((card) => {
        variable(card, '--work-progress', 1);
        card.querySelector('[data-work-state]').textContent = copy.work.after;
      });
      steps.forEach((step) => step.classList.add('step-current'));
      lastStep = -1;
      variable(offer, '--finish', 1);
      bar.inert = false;
    } else if (!introPlayed) {
      introPlayed = true;
      root.classList.add('load-sequence');
      nameArrival();
      introTimer = setTimeout(() => root.classList.remove('load-sequence'), 500);
    }
    needsMeasure = true;
    request();
    requestWorkshop();
  }
  const nearby = new IntersectionObserver(
    (entries) => {
      entries.forEach(({ target, isIntersecting }) =>
        isIntersecting ? active.add(target) : active.delete(target),
      );
      request();
    },
    { rootMargin: '120px 0px' },
  );
  cards.forEach((node) => nearby.observe(node));
  new IntersectionObserver(([entry]) => {
    heroVisible = entry.isIntersecting;
    ambient();
    request();
  }).observe(art);
  const reveal = new IntersectionObserver(
    (entries) =>
      entries.forEach(({ target, isIntersecting }) => {
        if (isIntersecting) {
          target.classList.add('revealed');
          reveal.unobserve(target);
        }
      }),
    { threshold: 0.08 },
  );
  document
    .querySelectorAll(
      '.section-heading, .service-row, .reviews h2, .reviews > p, .review-grid > p, .visit-grid > div, .contact-info, .map',
    )
    .forEach((node, i) => {
      node.setAttribute('data-reveal', '');
      node.style.setProperty('--reveal-delay', `${(i % 3) * 60}ms`);
      reveal.observe(node);
    });
  new ResizeObserver(() => {
    needsMeasure = true;
    request();
    requestWorkshop();
  }).observe(document.body);
  addEventListener('resize', () => {
    needsMeasure = true;
    request();
    requestWorkshop();
  });
  // Workshop progress is driven by every native scroll, never by observer thresholds.
  document.addEventListener(
    'scroll',
    () => {
      requestWorkshop();
      if (!reduced.matches) request();
    },
    { passive: true },
  );
  addEventListener('pageshow', () => {
    needsMeasure = true;
    request();
    requestWorkshop();
  });
  document.addEventListener('automotive:name', nameArrival);
  document.addEventListener('automotive:dialog', ({ detail: { dialog } }) =>
    animate(dialog, [
      { transform: 'translateY(20px) scale(.97)', opacity: 0.4 },
      { transform: 'none', opacity: 1 },
    ]),
  );
  document.addEventListener('automotive:step', ({ detail: panel }) => {
    animate(
      panel,
      [
        { transform: 'translateX(15px)', opacity: 0.3 },
        { transform: 'none', opacity: 1 },
      ],
      { duration: 300 },
    );
    if (panel.id === 'quote-final')
      animate(
        panel.querySelector('.confirmation-mark path'),
        [{ strokeDashoffset: 1 }, { strokeDashoffset: 0 }],
        { duration: 650 },
      );
  });
  document.addEventListener('visibilitychange', () => {
    ambient();
    root.classList.toggle('tab-hidden', document.hidden);
    if (document.hidden) {
      cancelAnimationFrame(frame);
      cancelAnimationFrame(workshopFrame);
      frame = 0;
      workshopFrame = 0;
      animations.forEach((a) => a.pause());
    } else {
      animations.forEach((a) => a.play());
      needsMeasure = true;
      request();
      requestWorkshop();
    }
  });
  bar.addEventListener('animationend', () => bar.classList.remove('bar-arrived'));
  reduced.addEventListener('change', configure);
  configure();
})();
