(() => {
  'use strict';
  // Save the Date (wedding-09): personalisation, dialogs and the "Check your
  // date" demo. Nothing is stored, counted or sent; the URL is the only state.
  const c = JSON.parse(document.querySelector('#template-copy').textContent);
  const { clean, read, initials, links, presets, stop } = window.weddingIdentity;
  stop();
  const root = document.documentElement;
  const $ = (selector, node = document) => node.querySelector(selector);
  const $$ = (selector, node = document) => [...node.querySelectorAll(selector)];
  const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
  const nameDialog = $('#name-dialog');
  const dateDialog = $('#date-dialog');
  const contactDialog = $('#contact-dialog');
  const input = $('#business-name');
  const typeSelect = $('#business-type');
  const nameError = $('#name-error');
  const edit = $('[data-edit]');
  const dialogs = [nameDialog, dateDialog, contactDialog];
  const triggers = new WeakMap();
  let offered = Boolean(read().name);
  let timer;
  let current;

  // Demo wording, package list and labels follow the supplier type.
  const packageSelect = $('#day-package');
  function applyType(preset) {
    const changed = root.dataset.type !== preset;
    root.dataset.type = preset;
    const p = presets[preset];
    $('[data-package-label]').textContent = p.demo.packageLabel;
    $('[data-final-title]').textContent = p.demo.finalTitle;
    $('[data-card-eyebrow]').textContent = p.demo.cardEyebrow;
    if (packageSelect.dataset.for !== preset) {
      packageSelect.dataset.for = preset;
      packageSelect.replaceChildren(
        ...p.packages.map((item) => {
          const option = document.createElement('option');
          option.value = item.id;
          option.dataset.price = item.price;
          option.textContent = item.name;
          return option;
        }),
      );
      showPrice();
    }
    if (changed) document.dispatchEvent(new CustomEvent('wedding:type'));
  }
  function update() {
    current = read();
    const name = current.name || c.name;
    $$('[data-business]').forEach((node) => {
      node.textContent = name;
    });
    $$('[data-monogram]').forEach((node) => {
      node.textContent = initials(name);
    });
    $$('[data-area], [data-hero-area]').forEach((node) => {
      node.textContent = current.area || c.area;
    });
    $$('[data-type-label]').forEach((node) => {
      node.textContent = current.label;
    });
    $$('[data-phone]').forEach((node) => {
      node.textContent = current.phone ? current.phone.display : 'Your number here';
    });
    links(current.phone);
    applyType(current.preset);
    document.title = current.name
      ? name + c.titleSuffix
      : $('meta[property="og:title"]').content;
    // The final offer opens the template brief with this preview's values.
    const brief = new URL('/client/website-brief/templates/?template=wedding-09', location.origin);
    if (current.name) brief.searchParams.set('name', current.name);
    if (current.area) brief.searchParams.set('area', current.area);
    if (current.phone && current.phone.display) brief.searchParams.set('phone', current.phone && current.phone.display);
    if (current.ref) brief.searchParams.set('ref', current.ref);
    if (current.type) brief.searchParams.set('type', current.type);
    document.querySelectorAll('[data-brief-link]').forEach((node) => {
      node.href = brief.pathname + brief.search;
    });
    const contact = new URL('/contact/', location.origin);
    if (current.ref) contact.searchParams.set('ref', current.ref);
    $$('[data-agency-link]').forEach((node) => {
      node.href = contact.pathname + contact.search;
    });
    input.value = current.name;
    typeSelect.value = current.preset;
  }

  function cancelOffer() {
    offered = true;
    clearTimeout(timer);
    removeEventListener('scroll', offer);
  }
  function open(dialog, trigger) {
    cancelOffer();
    dialogs.forEach((other) => other !== dialog && other.open && other.close());
    triggers.set(dialog, trigger instanceof HTMLElement ? trigger : edit);
    if (!dialog.open) dialog.showModal();
    document.body.classList.add('dialog-open');
  }
  function offer() {
    if (!offered && !dialogs.some((dialog) => dialog.open)) {
      open(nameDialog, edit);
      input.focus();
    }
  }
  dialogs.forEach((dialog) => {
    dialog.querySelector('[data-close]').addEventListener('click', () => dialog.close());
    dialog.addEventListener('close', () => {
      if (!dialogs.some((other) => other.open)) document.body.classList.remove('dialog-open');
      // Return focus only when it was left on the page body or inside the closed dialog.
      const trigger = triggers.get(dialog);
      const active = document.activeElement;
      if (trigger && trigger.isConnected && (active === document.body || dialog.contains(active)))
        trigger.focus({ preventScroll: true });
    });
  });

  // Name and type: edits replace the URL (keeping area, phone and ref) so the
  // personalised link can be copied and shared.
  function showError(message) {
    nameError.textContent = message;
    input.setAttribute('aria-invalid', message ? 'true' : 'false');
  }
  edit.addEventListener('click', () => {
    const now = read();
    input.value = now.name;
    typeSelect.value = now.preset;
    showError('');
    open(nameDialog, edit);
    input.focus();
  });
  function setName(value, type) {
    const url = new URL(location.href);
    if (value) url.searchParams.set('name', value);
    else url.searchParams.delete('name');
    if (type) url.searchParams.set('type', type);
    history.replaceState(history.state, '', url);
    update();
    nameDialog.close();
    $('#announcement').textContent =
      'Preview updated for ' + (current.name || c.name) + ', ' + current.label;
  }
  $('#name-form').addEventListener('submit', (event) => {
    event.preventDefault();
    const name = clean(input.value, 100);
    if (!name) {
      showError('Enter your business name, or explore the sample.');
      input.focus();
      return;
    }
    setName(name, typeSelect.value !== read().preset ? typeSelect.value : '');
  });
  input.addEventListener('input', () => showError(''));
  $('#restore-name').addEventListener('click', () => {
    showError('');
    setName('', '');
  });
  const copy = $('#copy-link');
  copy.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(location.href);
      copy.textContent = 'Link copied';
    } catch {
      copy.textContent = 'Copy the address bar link';
    }
    setTimeout(() => {
      copy.textContent = 'Copy your link';
    }, 2500);
  });

  // "Check your date": a sample calendar (some dates marked "example: booked"),
  // then event, package and guests, then a final screen. Everything is
  // pre-filled, so Next always reaches the end. No contact details are asked for.
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const monthNames = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ];
  const booked = new Set(c.flow.booked);
  const grid = $('#cal-grid');
  const status = $('#date-status');
  const monthLabel = $('#cal-month');
  const highlight = document.createElement('span');
  highlight.className = 'cal-highlight';
  highlight.setAttribute('aria-hidden', 'true');
  let monthIndex = c.flow.months.indexOf(c.flow.startMonth);
  let selected = c.flow.selected;
  const parts = (iso) => iso.split('-').map(Number);
  function label(iso) {
    const [y, m, d] = parts(iso);
    const weekday = days[new Date(Date.UTC(y, m - 1, d)).getUTCDay()];
    return `${weekday} ${d} ${monthNames[m - 1]} ${y}`;
  }
  function placeHighlight(animate) {
    const button = $(`[data-date="${selected}"]`, grid);
    highlight.hidden = !button;
    if (!button) return;
    highlight.style.transition = animate && !reduced() ? '' : 'none';
    highlight.style.width = button.offsetWidth + 'px';
    highlight.style.height = button.offsetHeight + 'px';
    highlight.style.transform = `translate(${button.offsetLeft}px, ${button.offsetTop}px)`;
  }
  function renderMonth() {
    const [y, m] = parts(c.flow.months[monthIndex]);
    monthLabel.textContent = `${monthNames[m - 1]} ${y}`;
    const offset = (new Date(Date.UTC(y, m - 1, 1)).getUTCDay() + 6) % 7;
    const total = new Date(Date.UTC(y, m, 0)).getUTCDate();
    const cells = [highlight];
    for (let i = 0; i < offset; i++) {
      const blank = document.createElement('span');
      blank.className = 'cal-blank';
      cells.push(blank);
    }
    for (let d = 1; d <= total; d++) {
      const iso = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const button = document.createElement('button');
      const taken = booked.has(iso);
      button.type = 'button';
      button.className = 'cal-day' + (taken ? ' is-booked' : '');
      button.dataset.date = iso;
      button.style.setProperty('--i', String(d));
      button.textContent = String(d);
      button.setAttribute('aria-label', `${label(iso)}, ${taken ? 'example: booked' : 'available'}`);
      button.setAttribute('aria-pressed', String(iso === selected));
      if (taken) button.setAttribute('aria-disabled', 'true');
      cells.push(button);
    }
    grid.replaceChildren(...cells);
    $$('[data-month]').forEach((button) => {
      const next = monthIndex + Number(button.dataset.month);
      button.disabled = next < 0 || next >= c.flow.months.length;
    });
    grid.classList.remove('is-filling');
    if (!reduced()) {
      void grid.offsetWidth;
      grid.classList.add('is-filling');
    }
    requestAnimationFrame(() => placeHighlight(false));
  }
  function choose(button) {
    const iso = button.dataset.date;
    if (booked.has(iso)) {
      status.textContent = `${label(iso)} is marked “example: booked”. Please choose another date.`;
      status.classList.add('is-warning');
      return;
    }
    selected = iso;
    $$('.cal-day', grid).forEach((node) =>
      node.setAttribute('aria-pressed', String(node === button)),
    );
    status.textContent = `${label(iso)} · available (example)`;
    status.classList.remove('is-warning');
    placeHighlight(true);
  }
  grid.addEventListener('click', (event) => {
    const button = event.target.closest('.cal-day');
    if (button) choose(button);
  });
  // Arrow keys move between days; Home/End jump to the first/last day.
  grid.addEventListener('keydown', (event) => {
    const buttons = $$('.cal-day', grid);
    const index = buttons.indexOf(document.activeElement);
    if (index < 0) return;
    const next = {
      ArrowRight: index + 1,
      ArrowLeft: index - 1,
      ArrowDown: index + 7,
      ArrowUp: index - 7,
      Home: 0,
      End: buttons.length - 1,
    }[event.key];
    if (next === undefined) return;
    event.preventDefault();
    buttons[Math.max(0, Math.min(buttons.length - 1, next))].focus();
  });
  $$('[data-month]').forEach((button) =>
    button.addEventListener('click', () => {
      monthIndex = Math.max(
        0,
        Math.min(c.flow.months.length - 1, monthIndex + Number(button.dataset.month)),
      );
      renderMonth();
    }),
  );
  addEventListener('resize', () => dateDialog.open && placeHighlight(false), { passive: true });

  const steps = [$('#date-form'), $('#day-form'), $('#date-final')];
  const event = $('#day-event');
  const guests = $('#day-guests');
  const price = $('#day-price [data-sample-price]');
  function showPrice() {
    const option = packageSelect.selectedOptions[0];
    if (option) price.textContent = option.dataset.price;
  }
  packageSelect.addEventListener('change', showPrice);
  function step(index) {
    steps.forEach((node, i) => {
      node.hidden = i !== index;
    });
    $$('[data-step-indicator]').forEach((node, i) => {
      if (i === index) node.setAttribute('aria-current', 'step');
      else node.removeAttribute('aria-current');
    });
    steps[index].querySelector('h3').focus();
    if (index === 0) renderMonth();
    if (index === 2) celebrate();
  }
  function reset(packageId) {
    selected = c.flow.selected;
    monthIndex = c.flow.months.indexOf(c.flow.startMonth);
    status.textContent = `${label(selected)} · available (example)`;
    status.classList.remove('is-warning');
    event.selectedIndex = 0;
    $$('option', guests).forEach((option) => {
      option.selected = option.defaultSelected;
    });
    const ids = [...packageSelect.options].map((option) => option.value);
    packageSelect.value = ids.includes(packageId) ? packageId : ids[0];
    showPrice();
    $('#date-summary').textContent = '';
  }
  $$('[data-book], [data-package]').forEach((trigger) =>
    trigger.addEventListener('click', (e) => {
      e.preventDefault();
      reset(trigger.dataset.package);
      open(dateDialog, trigger);
      step(0);
    }),
  );
  steps[0].addEventListener('submit', (e) => {
    e.preventDefault();
    step(1);
  });
  steps[1].addEventListener('submit', (e) => {
    e.preventDefault();
    $('#date-summary').textContent = [
      label(selected),
      event.value,
      packageSelect.selectedOptions[0].textContent,
      guests.value,
    ].join(' · ');
    step(2);
  });
  $$('[data-restart]').forEach((button) =>
    button.addEventListener('click', () => {
      if (button.closest('#day-form')) step(0);
      else {
        reset(packageSelect.value);
        step(0);
      }
    }),
  );

  // Delight on the final screen, once per visit to it: photographers' card
  // develops like a print, florists' petals drift down, bakers' sprinkles fall.
  const card = $('.checked-card');
  const develop = $('.develop', card);
  const pieces = $$('.confetti i', card);
  function celebrate() {
    if (reduced()) return;
    card.animate(
      [
        { transform: 'translateY(12px)', opacity: 0 },
        { transform: 'none', opacity: 1 },
      ],
      { duration: 600, easing: 'cubic-bezier(.22,.61,.36,1)' },
    );
    const type = root.dataset.type;
    if (type === 'photographer') {
      develop.animate([{ opacity: 1 }, { opacity: 0.5, offset: 0.4 }, { opacity: 0 }], {
        duration: 900,
        delay: 150,
        easing: 'ease-out',
        fill: 'backwards',
      });
      return;
    }
    const width = card.offsetWidth;
    pieces.forEach((node, i) => {
      const x = ((i * 37) % 100) / 100;
      const drift = ((i % 5) - 2) * 10;
      const spin = (i % 2 ? 1 : -1) * (180 + i * 12);
      node.style.left = Math.round(x * (width - 16) + 8) + 'px';
      node.animate(
        [
          { transform: 'translate(0, -40px) rotate(0deg)', opacity: 0 },
          { opacity: 1, offset: 0.15 },
          { opacity: 1, offset: 0.75 },
          {
            transform: `translate(${drift}px, ${card.offsetHeight + 30}px) rotate(${spin}deg)`,
            opacity: 0,
          },
        ],
        {
          duration: type === 'florist' ? 1400 + (i % 4) * 120 : 1100 + (i % 3) * 100,
          delay: (i % 8) * 70,
          easing: type === 'florist' ? 'cubic-bezier(.3,.1,.4,1)' : 'cubic-bezier(.45,0,.8,.6)',
          fill: 'both',
        },
      );
    });
  }

  // Without ?phone, Call and WhatsApp explain the preview instead of dialling nothing.
  const previewTitles = {
    call: 'Call preview',
    message: 'WhatsApp preview',
    directions: 'Directions preview',
    instagram: 'Instagram preview',
    pinterest: 'Pinterest preview',
    fairs: 'Wedding fairs preview',
  };
  function preview(kind, trigger) {
    $('#contact-dialog-title').textContent = previewTitles[kind];
    $('#contact-explanation').textContent = c.contactNotes[kind];
    $('.contact-preview-value').textContent = {
      directions: current.area || 'Your address here',
      instagram: '@yourbusiness',
      pinterest: 'Your mood boards',
      fairs: 'Your next wedding fair here',
    }[kind] || 'Your number here';
    open(contactDialog, trigger);
  }
  $$('[data-call], [data-whatsapp]').forEach((link) =>
    link.addEventListener('click', (e) => {
      if (current.phone) return;
      e.preventDefault();
      preview(link.hasAttribute('data-call') ? 'call' : 'message', link);
    }),
  );
  $('[data-directions]').addEventListener('click', (e) => preview('directions', e.currentTarget));
  $('[data-fairs]').addEventListener('click', (e) => preview('fairs', e.currentTarget));
  // Placeholder links: no real accounts, so they explain instead of jumping to #contact.
  $$('[data-social]').forEach((link) =>
    link.addEventListener('click', (e) => {
      e.preventDefault();
      preview(link.dataset.social, link);
    }),
  );

  function restore() {
    cancelOffer();
    dialogs.forEach((dialog) => dialog.open && dialog.close());
    update();
  }
  update();
  addEventListener('popstate', restore);
  addEventListener('pageshow', (e) => {
    if (e.persisted) restore();
  });
  if (!offered) {
    timer = setTimeout(offer, 5000);
    addEventListener('scroll', offer, { passive: true });
  }
})();
