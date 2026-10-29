// Presentation only. The questionnaire owns answers, validation, ordering and PDF generation.
export type EnquiryDirection = 'forward' | 'back' | 'rise';
export function createEnquiryMotion(root: HTMLElement, enabled: boolean) {
  if (!enabled)
    return {
      enabled: false,
      get active() {
        return false;
      },
      go: (render: () => void, _direction?: EnquiryDirection) => render(),
      screen: (_screen: string) => {},
      focus: (heading: HTMLElement) => heading.focus(),
      progress: (
        _progress: HTMLProgressElement,
        _position: number,
        _total: number,
        _label: string,
      ) => {},
      conditional: (
        container: HTMLElement,
        build: () => HTMLElement | undefined,
        _animate: boolean,
      ) => {
        container.replaceChildren();
        const field = build();
        if (field) container.append(field);
      },
    };

  // Reuse the Phase 1/2 token scope; no home-motion observer or artwork is attached here.
  root.classList.add('home-motion', 'enquiry-motion');
  const viewport = document.createElement('div');
  viewport.className = 'enquiry-motion-viewport';
  root.before(viewport);
  viewport.append(root);
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const live = document.createElement('p');
  live.id = 'enquiry-progress-status';
  live.className = 'sr-only';
  live.setAttribute('aria-live', 'polite');
  live.setAttribute('aria-atomic', 'true');
  root.after(live);
  let active = false;
  let ratio = 0;
  let announcement = '';
  const waits = new Set<() => void>();
  const versions = new WeakMap<HTMLElement, number>();
  const duration = () =>
    parseFloat(getComputedStyle(root).getPropertyValue('--motion-duration')) * 0.4;
  const publish = () => {
    if (live.textContent !== announcement) live.textContent = announcement;
  };
  function wait(node: HTMLElement, milliseconds: number) {
    if (reduced.matches) return Promise.resolve();
    return new Promise<void>((resolve) => {
      const started = performance.now();
      const done = (event?: Event) => {
        if (event && event.target !== node) return;
        // A prior transition's queued end event must not finish a newer navigation.
        if (event && performance.now() - started < milliseconds - 24) return;
        node.removeEventListener('transitionend', done);
        clearTimeout(timer);
        waits.delete(done);
        resolve();
      };
      const timer = setTimeout(done, milliseconds + 16);
      waits.add(done);
      node.addEventListener('transitionend', done);
    });
  }
  reduced.addEventListener('change', () => {
    if (reduced.matches) [...waits].forEach((finish) => finish());
  });
  function focusHeading() {
    const heading = root.hidden
      ? document.querySelector<HTMLElement>('#start-title')
      : root.querySelector<HTMLElement>('h1');
    heading?.focus({ preventScroll: false });
  }
  function finish() {
    delete root.dataset.enquiryPhase;
    // Commit the resting state before unlocking, even if a compositor frame was delayed.
    root.getAnimations().forEach((animation) => animation.cancel());
    root.inert = false;
    root.removeAttribute('aria-hidden');
    active = false;
    publish();
    focusHeading();
  }
  function go(render: () => void, direction: EnquiryDirection = 'forward') {
    if (active) return;
    active = true;
    root.dataset.enquiryDirection = direction;
    const leave = !root.hidden && direction !== 'rise' && !reduced.matches;
    const milliseconds = duration();
    const focused = document.activeElement;
    if (focused instanceof HTMLElement && root.contains(focused)) focused.blur();
    root.inert = true;
    root.setAttribute('aria-hidden', 'true');
    if (reduced.matches) {
      try {
        render();
      } finally {
        finish();
      }
      return;
    }
    void (async () => {
      try {
        if (leave) {
          root.getBoundingClientRect();
          root.dataset.enquiryPhase = 'out';
          await wait(root, milliseconds / 2);
        }
        render();
        if (root.hidden) return;
        root.dataset.enquiryEntrance =
          direction === 'rise' || root.dataset.enquiryScreen === 'review' ? 'rise' : 'slide';
        root.dataset.enquiryPhase = 'start';
        // Flush the entrance position before transitioning; content remains in normal flow.
        root.getBoundingClientRect();
        root.dataset.enquiryPhase = 'in';
        await wait(root, direction === 'rise' ? milliseconds : milliseconds / 2);
      } finally {
        finish();
      }
    })();
  }
  return {
    enabled: true,
    get active() {
      return active;
    },
    go,
    screen(screen: string) {
      root.dataset.enquiryScreen = screen;
      if (screen !== 'question') {
        announcement = '';
        publish();
      }
    },
    focus(heading: HTMLElement) {
      if (!active) heading.focus();
    },
    progress(progress: HTMLProgressElement, position: number, total: number, label: string) {
      progress.max = total;
      progress.value = position;
      progress.setAttribute('aria-label', `Question ${position} of ${total}`);
      let track = progress.parentElement?.classList.contains('enquiry-progress-track')
        ? progress.parentElement
        : undefined;
      if (!track) {
        track = document.createElement('div');
        track.className = 'enquiry-progress-track';
        progress.before(track);
        track.append(progress);
        const fill = document.createElement('span');
        fill.className = 'enquiry-progress-fill';
        fill.setAttribute('aria-hidden', 'true');
        fill.style.transform = `scaleX(${ratio})`;
        track.append(fill);
        fill.getBoundingClientRect();
      }
      ratio = position / total;
      track.querySelector<HTMLElement>('.enquiry-progress-fill')!.style.transform =
        `scaleX(${ratio})`;
      announcement = `Question ${position} of ${total}: ${label}`;
      if (!active) publish();
    },
    conditional(container: HTMLElement, build: () => HTMLElement | undefined, animate: boolean) {
      const version = (versions.get(container) ?? 0) + 1;
      versions.set(container, version);
      container.classList.add('enquiry-conditional');
      const origin = document.activeElement;
      const replace = () => {
        container.replaceChildren();
        const field = build();
        if (!field) return false;
        const inner = document.createElement('div');
        inner.className = 'enquiry-conditional-inner';
        inner.append(field);
        container.append(inner);
        return true;
      };
      const settle = () => {
        container.inert = false;
        container.removeAttribute('aria-hidden');
        container.dataset.settled = 'true';
        if (animate && document.activeElement === origin && container.isConnected && !active)
          container.querySelector<HTMLInputElement>('input, textarea')?.focus();
      };
      if (!animate || reduced.matches) {
        container.dataset.open = String(replace());
        settle();
        return;
      }
      const swapping = !!container.childElementCount;
      container.inert = true;
      container.setAttribute('aria-hidden', 'true');
      delete container.dataset.settled;
      void (async () => {
        const milliseconds = duration() / (swapping ? 2 : 1);
        if (swapping) {
          container.style.setProperty('--enquiry-field-duration', `${milliseconds}ms`);
          container.dataset.open = 'false';
          await wait(container, milliseconds);
        }
        if (versions.get(container) !== version || !container.isConnected) return;
        const shown = replace();
        container.dataset.open = 'false';
        container.getBoundingClientRect();
        container.style.setProperty('--enquiry-field-duration', `${milliseconds}ms`);
        container.dataset.open = String(shown);
        if (shown) {
          // The new field can be used immediately, including by fast keyboard/paste input.
          // Only the outgoing field is inert while it collapses.
          container.inert = false;
          container.removeAttribute('aria-hidden');
          if (document.activeElement === origin && !active)
            container
              .querySelector<HTMLInputElement>('input, textarea')
              ?.focus({ preventScroll: true });
          await wait(container, milliseconds);
        }
        if (versions.get(container) === version) settle();
      })();
    },
  };
}
