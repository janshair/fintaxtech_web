(() => {
  'use strict';
  const c = JSON.parse(document.querySelector('#template-copy').textContent);
  const { clean, read, initials, links, presetFor, applyCopy, stop } = window.consultantIdentity;
  stop();
  const $ = (selector) => document.querySelector(selector);
  const nameDialog = $('#name-dialog');
  const callDialog = $('#call-dialog');
  const contactDialog = $('#contact-dialog');
  const input = $('#business-name');
  const nameError = $('#name-error');
  const edit = $('[data-edit]');
  const dialogs = [nameDialog, callDialog, contactDialog];
  const triggers = new WeakMap();
  let offered = Boolean(read().name);
  let timer;
  let current;
  function update() {
    current = read();
    const name = current.name || c.name;
    const role = current.role || c.role;
    document.querySelectorAll('[data-business]').forEach((node) => {
      node.textContent = name;
    });
    document.querySelectorAll('[data-monogram]').forEach((node) => {
      node.textContent = initials(name);
    });
    document.querySelectorAll('[data-role]').forEach((node) => {
      node.textContent = role;
    });
    applyCopy(presetFor(current.role));
    document.querySelectorAll('[data-area], [data-hero-area]').forEach((node) => {
      node.textContent = current.area || c.area;
    });
    document.querySelectorAll('[data-phone]').forEach((node) => {
      node.textContent = current.phone ? current.phone.display : 'Your number here';
    });
    links(current.phone);
    document.title =
      current.name || current.role
        ? `${name} · ${role}${c.titleSuffix}`
        : document.querySelector('meta[property="og:title"]').content;
    // The final offer opens the template brief with this preview's values.
    const brief = new URL('/client/website-brief/templates/?template=consultant-07', location.origin);
    if (current.name) brief.searchParams.set('name', current.name);
    if (current.area) brief.searchParams.set('area', current.area);
    if (current.phone && current.phone.display) brief.searchParams.set('phone', current.phone && current.phone.display);
    if (current.ref) brief.searchParams.set('ref', current.ref);
    if (current.role) brief.searchParams.set('role', current.role);
    document.querySelectorAll('[data-brief-link]').forEach((node) => {
      node.href = brief.pathname + brief.search;
    });
    const contact = new URL('/contact/', location.origin);
    if (current.ref) contact.searchParams.set('ref', current.ref);
    document.querySelectorAll('[data-agency-link]').forEach((node) => {
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
      const trigger = triggers.get(dialog);
      if (trigger && trigger.isConnected) trigger.focus({ preventScroll: true });
    });
  });

  // Name: edits replace the URL (keeping role, area, phone and ref) so the link can be shared.
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
      showError('Enter your name or business name, or explore the sample.');
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

  // Three-step discovery call demo. Every field is pre-filled, so Next always reaches the end.
  const steps = [$('#topic-form'), $('#time-form'), $('#call-final')];
  const topic = $('#call-topic');
  const day = $('#call-day');
  const time = $('#call-time');
  function step(index) {
    steps.forEach((node, i) => {
      node.hidden = i !== index;
    });
    document.querySelectorAll('[data-step-indicator]').forEach((node, i) => {
      if (i === index) node.setAttribute('aria-current', 'step');
      else node.removeAttribute('aria-current');
    });
    steps[index].querySelector('h3').focus();
    if (index === 2) celebrate();
  }
  // The booked-slot card settles in and its tick draws itself (skipped for reduced motion).
  const booked = $('.booked-card');
  const tick = booked.querySelector('path');
  function celebrate() {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    booked.animate(
      [
        { transform: 'translateY(10px) scale(0.96)', opacity: 0 },
        { transform: 'none', opacity: 1 },
      ],
      { duration: 360, easing: 'cubic-bezier(.2,.7,.2,1)' },
    );
    tick.animate([{ strokeDashoffset: 100 }, { strokeDashoffset: 0 }], {
      duration: 520,
      delay: 260,
      easing: 'ease-out',
      fill: 'backwards',
    });
    booked
      .querySelector('circle')
      .animate([{ transform: 'scale(0.6)' }, { transform: 'scale(1.08)' }, { transform: 'none' }], {
        duration: 480,
        delay: 160,
        easing: 'ease-out',
        fill: 'backwards',
      });
  }
  document.querySelectorAll('[data-book], [data-service]').forEach((trigger) =>
    trigger.addEventListener('click', (event) => {
      event.preventDefault();
      $('#time-form').reset();
      $('#call-summary').textContent = '';
      topic.value = trigger.dataset.service || c.services[0].id;
      open(callDialog, trigger);
      step(0);
    }),
  );
  steps[0].addEventListener('submit', (event) => {
    event.preventDefault();
    step(1);
  });
  steps[1].addEventListener('submit', (event) => {
    event.preventDefault();
    $('#call-summary').textContent = [
      topic.selectedOptions[0].text,
      day.value,
      time.value,
      '15 minutes',
    ].join(' · ');
    step(2);
  });
  document
    .querySelectorAll('[data-restart]')
    .forEach((button) => button.addEventListener('click', () => step(0)));

  // Without ?phone, Call and WhatsApp explain the preview instead of dialling nothing.
  function preview(kind, trigger) {
    $('#contact-dialog-title').textContent = {
      call: 'Call preview',
      message: 'WhatsApp preview',
      directions: 'Directions preview',
    }[kind];
    $('#contact-explanation').textContent = c.contactNotes[kind];
    $('.contact-preview-value').textContent =
      kind === 'directions' ? current.area || 'Your address here' : 'Your number here';
    open(contactDialog, trigger);
  }
  document.querySelectorAll('[data-call], [data-whatsapp]').forEach((link) =>
    link.addEventListener('click', (event) => {
      if (current.phone) return;
      event.preventDefault();
      preview(link.hasAttribute('data-call') ? 'call' : 'message', link);
    }),
  );
  $('[data-directions]').addEventListener('click', (event) =>
    preview('directions', event.currentTarget),
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
