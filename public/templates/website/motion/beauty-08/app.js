(() => {
  'use strict';
  const c = JSON.parse(document.querySelector('#template-copy').textContent);
  const { clean, read, initials, links, stop } = window.beautyIdentity;
  stop();
  const $ = (selector) => document.querySelector(selector);
  const $$ = (selector) => [...document.querySelectorAll(selector)];
  const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
  const nameDialog = $('#name-dialog');
  const bookDialog = $('#book-dialog');
  const contactDialog = $('#contact-dialog');
  const input = $('#business-name');
  const nameError = $('#name-error');
  const edit = $('[data-edit]');
  const dialogs = [nameDialog, bookDialog, contactDialog];
  const triggers = new WeakMap();
  let offered = Boolean(read().name);
  let timer;
  let current;
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
    $$('[data-phone]').forEach((node) => {
      node.textContent = current.phone ? current.phone.display : 'Your number here';
    });
    links(current.phone);
    document.title = current.name
      ? name + c.titleSuffix
      : $('meta[property="og:title"]').content;
    const contact = new URL('/contact/', location.origin);
    if (current.ref) contact.searchParams.set('ref', current.ref);
    $$('[data-agency-link]').forEach((node) => {
      node.href = contact.pathname + contact.search;
    });
    input.value = current.name;
  }
  update();

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
      // The close event can arrive after focus has already moved on; only return
      // focus when it was left on the page body or inside the closed dialog.
      const trigger = triggers.get(dialog);
      const active = document.activeElement;
      if (trigger && trigger.isConnected && (active === document.body || dialog.contains(active)))
        trigger.focus({ preventScroll: true });
    });
  });

  // Name: edits replace the URL (keeping area, phone and ref) so the link can be shared.
  function showError(message) {
    nameError.textContent = message;
    input.setAttribute('aria-invalid', message ? 'true' : 'false');
  }
  edit.addEventListener('click', () => {
    input.value = read().name;
    showError('');
    open(nameDialog, edit);
    input.focus();
  });
  function setName(value) {
    const url = new URL(location.href);
    if (value) url.searchParams.set('name', value);
    else url.searchParams.delete('name');
    history.replaceState(history.state, '', url);
    update();
    nameDialog.close();
    $('#announcement').textContent = 'Preview updated for ' + (current.name || c.name);
  }
  $('#name-form').addEventListener('submit', (event) => {
    event.preventDefault();
    const name = clean(input.value, 100);
    if (!name) {
      showError('Enter your business name, or explore the sample.');
      input.focus();
      return;
    }
    setName(name);
  });
  input.addEventListener('input', () => showError(''));
  $('#restore-name').addEventListener('click', () => {
    showError('');
    setName('');
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

  // Treatment tabs: arrow keys move between tabs; the new list's rows slide in
  // again with the price shimmer (the --tp animation needs @property support,
  // and without it the rows simply appear).
  const tabs = $$('[data-tab]');
  function select(id, focus) {
    tabs.forEach((tab) => {
      const on = tab.dataset.tab === id;
      tab.setAttribute('aria-selected', String(on));
      tab.tabIndex = on ? 0 : -1;
      if (on && focus) tab.focus();
    });
    $$('[data-panel]').forEach((panel) => {
      const on = panel.dataset.panel === id;
      if (on === panel.classList.contains('is-active')) return;
      panel.classList.toggle('is-active', on);
      if (on && !reduced())
        panel.animate([{ '--tp': 0 }, { '--tp': 1 }], { duration: 650, easing: 'linear' });
    });
  }
  tabs.forEach((tab, index) => {
    tab.addEventListener('click', () => select(tab.dataset.tab));
    tab.addEventListener('keydown', (event) => {
      const next = {
        ArrowRight: index + 1,
        ArrowLeft: index - 1,
        Home: 0,
        End: tabs.length - 1,
      }[event.key];
      if (next === undefined) return;
      event.preventDefault();
      select(tabs[(next + tabs.length) % tabs.length].dataset.tab, true);
    });
  });
  $$('[data-tab-link]').forEach((link) =>
    link.addEventListener('click', () => select(link.dataset.tabLink)),
  );

  // Three-step booking demo. Every field is pre-filled, so Next always reaches the end.
  const steps = [$('#treatment-form'), $('#time-form'), $('#book-final')];
  const treatment = $('#book-treatment');
  const tech = $('#book-tech');
  const day = $('#book-day');
  const time = $('#book-time');
  function step(index) {
    steps.forEach((node, i) => {
      node.hidden = i !== index;
    });
    $$('[data-step-indicator]').forEach((node, i) => {
      if (i === index) node.setAttribute('aria-current', 'step');
      else node.removeAttribute('aria-current');
    });
    steps[index].querySelector('h3').focus();
    if (index === 2) celebrate();
  }
  // Delight: the booked card settles in and small sparkles burst out of it.
  const booked = $('.booked-card');
  const sparkles = $$('.sparkles i');
  function celebrate() {
    if (reduced()) return;
    booked.animate(
      [
        { transform: 'translateY(12px) scale(0.95)', opacity: 0 },
        { transform: 'none', opacity: 1 },
      ],
      { duration: 380, easing: 'cubic-bezier(.2,.7,.2,1)' },
    );
    sparkles.forEach((node, i) => {
      const angle = (i / sparkles.length) * Math.PI * 2 + 0.3;
      const reach = 70 + (i % 3) * 22;
      const x = Math.cos(angle) * reach;
      const y = Math.sin(angle) * reach * 0.7;
      node.animate(
        [
          { transform: 'translate(0, 0) scale(0.2) rotate(0deg)', opacity: 0 },
          { opacity: 1, offset: 0.25 },
          {
            transform: `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) scale(1) rotate(${90 + i * 15}deg)`,
            opacity: 0,
          },
        ],
        { duration: 900, delay: 180 + i * 24, easing: 'cubic-bezier(.15,.7,.3,1)', fill: 'both' },
      );
    });
  }
  $$('[data-book], [data-service]').forEach((trigger) =>
    trigger.addEventListener('click', (event) => {
      event.preventDefault();
      $('#time-form').reset();
      $('#book-summary').textContent = '';
      treatment.value = trigger.dataset.service || treatment.options[0].value;
      showPrice();
      open(bookDialog, trigger);
      step(0);
    }),
  );
  // Options show only the name, so they fit a 320px phone; the duration and
  // example price show on the line below.
  const price = $('#book-price [data-sample-price]');
  const duration = $('[data-book-duration]');
  function showPrice() {
    const option = treatment.selectedOptions[0];
    duration.textContent = option.dataset.duration;
    price.textContent = option.dataset.price;
  }
  treatment.addEventListener('change', showPrice);
  steps[0].addEventListener('submit', (event) => {
    event.preventDefault();
    step(1);
  });
  steps[1].addEventListener('submit', (event) => {
    event.preventDefault();
    const option = treatment.selectedOptions[0];
    $('#book-summary').textContent = [
      option.dataset.name,
      tech.value,
      `${day.value} ${time.value}`,
      option.dataset.duration,
    ].join(' · ');
    step(2);
  });
  $$('[data-restart]').forEach((button) => button.addEventListener('click', () => step(0)));

  // Without ?phone, Call and WhatsApp explain the preview instead of dialling nothing.
  function preview(kind, trigger) {
    $('#contact-dialog-title').textContent = {
      call: 'Call preview',
      message: 'WhatsApp preview',
      directions: 'Directions preview',
      voucher: 'Gift voucher preview',
    }[kind];
    $('#contact-explanation').textContent = c.contactNotes[kind];
    $('.contact-preview-value').textContent =
      kind === 'directions'
        ? current.area || 'Your address here'
        : kind === 'voucher'
          ? 'Vouchers from £20 (example)'
          : 'Your number here';
    open(contactDialog, trigger);
  }
  $$('[data-call], [data-whatsapp]').forEach((link) =>
    link.addEventListener('click', (event) => {
      if (current.phone) return;
      event.preventDefault();
      preview(link.hasAttribute('data-call') ? 'call' : 'message', link);
    }),
  );
  $('[data-directions]').addEventListener('click', (event) =>
    preview('directions', event.currentTarget),
  );
  $('[data-voucher]').addEventListener('click', (event) =>
    preview('voucher', event.currentTarget),
  );

  function restore() {
    cancelOffer();
    dialogs.forEach((dialog) => dialog.open && dialog.close());
    update();
  }
  addEventListener('popstate', restore);
  addEventListener('pageshow', (event) => {
    if (event.persisted) restore();
  });
  if (!offered) {
    timer = setTimeout(offer, 5000);
    addEventListener('scroll', offer, { passive: true });
  }
})();
