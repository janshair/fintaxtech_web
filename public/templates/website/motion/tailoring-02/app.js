(() => {
  'use strict';
  const root = document.documentElement;
  const c = JSON.parse(document.querySelector('#template-copy').textContent);
  const nameDialog = document.querySelector('#name-dialog');
  const bookingDialog = document.querySelector('#booking-dialog');
  const input = document.querySelector('#business-name');
  const clean = (value, limit) =>
    Array.from((value || '').trim().replace(/\s+/gu, ' '))
      .slice(0, limit)
      .join('');
  let business = c.name;
  let lastTrigger;
  let offered = new URL(location.href).searchParams.has('name');
  let timer;
  let scrollIntent = false;
  const params = () => new URL(location.href).searchParams;
  function update() {
    const query = params();
    const name = clean(query.get('name'), 100);
    business = name || c.name;
    document.querySelectorAll('[data-business]').forEach((node) => {
      node.textContent = business;
    });
    const words = business.match(/[\p{L}\p{N}]+(?:['’][\p{L}\p{N}]+)*/gu) || [];
    const initials =
      (name ? words : words.filter((word) => !['the', 'and', 'of'].includes(word.toLowerCase())))
        .slice(0, 2)
        .map((word) => Array.from(word.toUpperCase())[0])
        .join('') || 'FA';
    document.querySelectorAll('[data-monogram]').forEach((node) => {
      node.textContent = initials;
    });
    document.title = business + c.titleSuffix;
    const area = clean(query.get('area'), 100);
    document.querySelectorAll('[data-area]').forEach((node) => {
      node.textContent = area || c.visit.location;
    });
    const heroArea = document.querySelector('[data-hero-area]');
    heroArea.textContent = area ? ' · ' + area : '';
    heroArea.hidden = !area;
    const raw = (query.get('phone') || '').trim();
    let digits = raw.length <= 20 && /^[+\d ()]+$/.test(raw) ? raw.replace(/[ ()]/g, '') : '';
    if (/^0\d{10}$/.test(digits)) digits = '44' + digits.slice(1);
    digits = /^\+?[1-9]\d{6,14}$/.test(digits) ? digits.replace(/^\+/, '') : '';
    // tel: has an opaque path: construct its URL only after the strict digits validation above.
    const tel = new URL(`tel:+${digits}`);
    const whatsapp = new URL('https://wa.me/');
    whatsapp.pathname = digits;
    document.querySelectorAll('[data-call]').forEach((node) => {
      node.href = digits ? tel.href : '#contact-details';
    });
    document.querySelectorAll('[data-whatsapp]').forEach((node) => {
      node.href = digits ? whatsapp.href : '#contact-details';
      node.rel = 'noopener noreferrer';
    });
    document.querySelector('[data-phone-text]').textContent = !digits
      ? c.visit.phone
      : /^4420\d{8}$/.test(digits)
        ? '+44 20 ' + digits.slice(4, 8) + ' ' + digits.slice(8)
        : /^44\d{10}$/.test(digits)
          ? '+44 ' + digits.slice(2, 6) + ' ' + digits.slice(6)
          : '+' + digits;
    const maps = new URL('https://www.google.com/maps/search/');
    maps.searchParams.set('api', '1');
    maps.searchParams.set('query', area);
    document.querySelectorAll('[data-directions]').forEach((node) => {
      node.href = area ? maps.href : '#map';
      node.rel = 'noopener noreferrer';
    });
    // A ref code is only carried by a deliberate agency-enquiry navigation, never tracked or displayed.
    const ref = (query.get('ref') || '').trim();
    const contact = new URL(c.contact, location.origin);
    if (/^[A-Za-z0-9_-]{3,32}$/.test(ref)) contact.searchParams.set('ref', ref);
    document.querySelectorAll('.agency-contact').forEach((node) => {
      node.href = contact.href;
    });
    root.classList.remove('personalising');
  }
  update();
  const menu = document.querySelector('#navigation');
  const menuButton = document.querySelector('.menu-toggle');
  function closeMenu() {
    menu.classList.remove('is-open');
    menuButton.setAttribute('aria-expanded', 'false');
  }
  menuButton.addEventListener('click', () =>
    menuButton.setAttribute('aria-expanded', String(menu.classList.toggle('is-open'))),
  );
  menu.querySelectorAll('a').forEach((link) => link.addEventListener('click', closeMenu));
  function cancelPrompt() {
    offered = true;
    clearTimeout(timer);
    window.removeEventListener('scroll', firstScroll);
    ['wheel', 'touchmove', 'pointerdown', 'keydown'].forEach((event) =>
      window.removeEventListener(event, armScroll),
    );
  }
  function open(dialog, trigger) {
    cancelPrompt();
    lastTrigger = trigger || document.activeElement;
    closeMenu();
    dialog.showModal();
    document.body.classList.add('dialog-open');
    document.dispatchEvent(new CustomEvent('tailoring:dialog', { detail: { dialog, trigger } }));
  }
  function offer() {
    if (!offered) {
      open(nameDialog);
      input.focus();
    }
  }
  function armScroll(event) {
    if (event.type !== 'keydown' || ['ArrowDown', 'PageDown', 'End', ' '].includes(event.key))
      scrollIntent = true;
  }
  function firstScroll() {
    if (scrollIntent) offer();
  }
  document.querySelector('[data-edit]').addEventListener('click', (event) => {
    input.value = clean(params().get('name'), 100);
    open(nameDialog, event.currentTarget);
    input.focus();
  });
  function setName(value) {
    const url = new URL(location.href);
    if (value) url.searchParams.set('name', value);
    else url.searchParams.delete('name');
    history.replaceState(history.state, '', url);
    update();
    document.dispatchEvent(new Event('tailoring:name'));
    document.querySelector('#announcement').textContent = c.nameDialog.updated + business;
    nameDialog.close();
  }
  document.querySelector('#name-form').addEventListener('submit', (event) => {
    event.preventDefault();
    const name = clean(input.value, 100);
    if (!name) {
      input.setCustomValidity(c.nameDialog.required);
      input.reportValidity();
      return;
    }
    setName(name);
  });
  input.addEventListener('input', () => input.setCustomValidity(''));
  document.querySelector('#restore-name').addEventListener('click', () => {
    input.value = '';
    setName('');
  });
  [nameDialog, bookingDialog].forEach((dialog) => {
    dialog.querySelector('[data-close]').addEventListener('click', () => dialog.close());
    dialog.addEventListener('close', () => {
      document.body.classList.remove('dialog-open');
      if (lastTrigger instanceof HTMLElement) lastTrigger.focus({ preventScroll: true });
    });
  });
  const serviceForm = document.querySelector('#service-form');
  const slotForm = document.querySelector('#slot-form');
  const final = document.querySelector('#booking-final');
  const service = document.querySelector('#booking-service');
  function step(index) {
    [serviceForm, slotForm, final].forEach((panel, i) => {
      panel.hidden = index !== i;
    });
    if (index === 0) service.focus();
    else [serviceForm, slotForm, final][index].querySelector('h3').focus();
    document.dispatchEvent(
      new CustomEvent('tailoring:step', { detail: [serviceForm, slotForm, final][index] }),
    );
  }
  document.querySelectorAll('[data-book], [data-service]').forEach((link) =>
    link.addEventListener('click', (event) => {
      event.preventDefault();
      service.value = link.dataset.service || c.services.items[0].code;
      slotForm.reset();
      open(bookingDialog, link);
      step(0);
    }),
  );
  serviceForm.addEventListener('submit', (event) => {
    event.preventDefault();
    step(1);
  });
  slotForm.addEventListener('submit', (event) => {
    event.preventDefault();
    document.querySelector('#booking-summary').textContent = [
      service.selectedOptions[0].textContent,
      document.querySelector('#booking-day').value,
      document.querySelector('#booking-time').value,
    ].join(' · ');
    step(2);
  });
  document
    .querySelectorAll('[data-restart]')
    .forEach((button) => button.addEventListener('click', () => step(0)));
  function restore() {
    update();
    input.value = '';
    nameDialog.close();
    bookingDialog.close();
    closeMenu();
  }
  window.addEventListener('popstate', restore);
  window.addEventListener('pageshow', (event) => {
    if (event.persisted) {
      cancelPrompt();
      restore();
    }
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') closeMenu();
  });
  if (!offered) {
    timer = setTimeout(offer, 5000);
    ['wheel', 'touchmove', 'pointerdown', 'keydown'].forEach((event) =>
      addEventListener(event, armScroll, { passive: true }),
    );
    addEventListener('scroll', firstScroll, { passive: true });
  }
})();
