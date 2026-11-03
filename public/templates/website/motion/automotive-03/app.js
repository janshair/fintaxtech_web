(() => {
  'use strict';
  const c = JSON.parse(document.querySelector('#template-copy').textContent);
  const nameDialog = document.querySelector('#name-dialog');
  const input = document.querySelector('#business-name');
  const mapLoad = document.querySelector('[data-map-load]');
  // false until the visitor loads the map, then the address it was loaded for.
  let mapLoaded = false;
  const clean = (value, limit) =>
    Array.from((value || '').trim().replace(/\s+/gu, ' '))
      .slice(0, limit)
      .join('');
  // Lower-case words from a letter link are title-cased for display ("b&t autos" becomes
  // "B&T Autos"). Words that already contain capitals, such as "McLaren" or "MOT", are kept.
  const titleCase = (value) =>
    value.replace(/\S+/gu, (word) =>
      word === word.toLowerCase()
        ? word.replace(/(^|[&/(-])(\p{L})/gu, (_, before, letter) => before + letter.toUpperCase())
        : word,
    );
  let business = c.name;
  let lastTrigger;
  let offered = new URL(location.href).searchParams.has('name');
  let timer;
  let scrollIntent = false;
  let mapQuery = '';
  const params = () => new URL(location.href).searchParams;
  // UK numbers display nationally (01382 221621) and link internationally (441382221621).
  function ukPhone(raw) {
    const value = (raw || '').trim();
    if (!value || value.length > 20 || !/^[+\d ()]+$/.test(value)) return null;
    let digits = value.replace(/\D/g, '');
    if (value.startsWith('+') && !digits.startsWith('44'))
      return /^[1-9]\d{6,14}$/.test(digits)
        ? { display: value.replace(/\s+/g, ' '), international: digits }
        : null;
    if (value.startsWith('+') || (digits.startsWith('44') && digits.length === 12))
      digits = digits.slice(2).replace(/^0/, '');
    else if (digits.startsWith('0')) digits = digits.slice(1);
    else return null;
    if (!/^[1-9]\d{8,9}$/.test(digits)) return null;
    const national = '0' + digits;
    const groups = national.startsWith('02')
      ? [3, 4, 4]
      : /^01\d1|^011/.test(national)
        ? [4, 3, 4]
        : [5, 6];
    let index = 0;
    const display = groups
      .map((size) => national.slice(index, (index += size)))
      .filter(Boolean)
      .join(' ');
    return { display, international: '44' + digits };
  }
  function update() {
    const query = params();
    const name = titleCase(clean(query.get('name'), 100));
    business = name || c.name;
    document.querySelectorAll('[data-business]').forEach((node) => {
      node.textContent = business;
    });
    const words = business.match(/[\p{L}\p{N}]+(?:['’][\p{L}\p{N}]+)*/gu) || [];
    const initials =
      (name ? words : words.filter((word) => !['the', 'and', 'of'].includes(word.toLowerCase())))
        .slice(0, 2)
        .map((word) => Array.from(word.toUpperCase())[0])
        .join('') || c.monogram;
    document.querySelectorAll('[data-monogram]').forEach((node) => {
      node.textContent = initials;
    });
    document.title = business + c.titleSuffix;
    const town = clean(query.get('area'), 100) || c.area;
    document.querySelectorAll('[data-town]').forEach((node) => {
      node.textContent = town;
    });
    mapQuery = c.visit.address + ', ' + town;
    // An invalid or missing ?phone= falls back to the example number.
    const phone = ukPhone(query.get('phone')) || ukPhone(c.visit.phone);
    // tel: has an opaque path: construct its URL only after the strict digits validation above.
    const tel = new URL(`tel:+${phone.international}`);
    const whatsapp = new URL('https://wa.me/');
    whatsapp.pathname = phone.international;
    document.querySelectorAll('[data-call]').forEach((node) => {
      node.href = tel.href;
    });
    document.querySelectorAll('[data-whatsapp]').forEach((node) => {
      node.href = whatsapp.href;
      node.rel = 'noopener noreferrer';
    });
    document.querySelectorAll('[data-phone-text]').forEach((node) => {
      node.textContent = phone.display;
    });
    const maps = new URL('https://www.google.com/maps/dir/');
    maps.searchParams.set('api', '1');
    maps.searchParams.set('destination', mapQuery);
    document.querySelectorAll('[data-directions]').forEach((node) => {
      node.href = maps.href;
      node.rel = 'noopener noreferrer';
    });
    if (mapLoaded !== false && mapLoaded !== mapQuery) {
      document.querySelector('.map-frame').remove();
      mapLoaded = false;
    }
    mapLoad.hidden = mapLoaded !== false;
    mapLoad.nextElementSibling.hidden = mapLoad.hidden;
    // A ref code is only carried by a deliberate agency-enquiry navigation, never tracked or displayed.
    const ref = (query.get('ref') || '').trim();
    const contact = new URL(c.contact, location.origin);
    if (/^[A-Za-z0-9_-]{3,32}$/.test(ref)) contact.searchParams.set('ref', ref);
    document.querySelectorAll('.agency-contact').forEach((node) => {
      node.href = contact.href;
    });
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
    document.dispatchEvent(new CustomEvent('automotive:dialog', { detail: { dialog, trigger } }));
  }
  function offer() {
    if (!offered) {
      open(nameDialog);
      input.focus();
    }
  }
  function armScroll(event) {
    // A tap on an in-page link scrolls for the visitor; only their own scrolling counts.
    if (event.type === 'pointerdown' && event.target.closest?.('a[href^="#"], [data-service]'))
      return;
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
    document.dispatchEvent(new Event('automotive:name'));
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
  nameDialog.querySelector('[data-close]').addEventListener('click', () => nameDialog.close());
  nameDialog.addEventListener('close', () => {
    document.body.classList.remove('dialog-open');
    if (lastTrigger instanceof HTMLElement) lastTrigger.focus({ preventScroll: true });
  });

  // Quote and MOT reminder forms are front-end only: details stay in these fields and are
  // never sent, stored or looked up. Each field shows its own error until corrected.
  const plateValue = (field) => field.value.trim().replace(/\s+/g, ' ').toUpperCase();
  const checks = {
    plate: (field) => /^[A-Z0-9 ]{2,8}$/.test(plateValue(field)),
    name: (field) => Boolean(clean(field.value, 80)),
    phone: (field) => Boolean(ukPhone(field.value)),
  };
  function validate(fields) {
    let first;
    fields.forEach(([field, check]) => {
      const valid = checks[check](field);
      const error = document.getElementById(field.id + '-error');
      error.hidden = valid;
      if (valid) field.removeAttribute('aria-invalid');
      else {
        field.setAttribute('aria-invalid', 'true');
        first = first || field;
      }
    });
    if (first) first.focus();
    return !first;
  }
  function clearErrors(form) {
    form.querySelectorAll('[aria-invalid]').forEach((field) => field.removeAttribute('aria-invalid'));
    form.querySelectorAll('.form-error').forEach((error) => {
      error.hidden = true;
    });
  }
  function swap(form, thanks, showThanks) {
    form.hidden = showThanks;
    thanks.hidden = !showThanks;
    if (showThanks) {
      (thanks.querySelector('h3') || thanks.querySelector('.demo-result')).focus();
      document.dispatchEvent(new CustomEvent('automotive:step', { detail: thanks }));
    } else {
      form.reset();
      clearErrors(form);
      form.querySelector('input').focus();
    }
  }
  [...document.querySelectorAll('#quote-form input, #reminder-form input')].forEach((field) =>
    field.addEventListener('input', () => {
      field.removeAttribute('aria-invalid');
      document.getElementById(field.id + '-error')?.setAttribute('hidden', '');
    }),
  );

  const quoteForm = document.querySelector('#quote-form');
  const final = document.querySelector('#quote-final');
  const service = document.querySelector('#quote-service');
  const plate = document.querySelector('#quote-plate');
  const date = document.querySelector('#quote-date');
  const summary = document.querySelector('#quote-summary');
  const today = new Date();
  date.min = [
    today.getFullYear(),
    String(today.getMonth() + 1).padStart(2, '0'),
    String(today.getDate()).padStart(2, '0'),
  ].join('-');
  // Quote links go straight to the form's first field; service rows and MOT links also pick
  // the service. Without JavaScript they remain plain links to #quote.
  document.querySelectorAll('[data-service], [data-quote]').forEach((link) =>
    link.addEventListener('click', (event) => {
      event.preventDefault();
      if (!final.hidden) swap(quoteForm, final, false);
      if (link.dataset.service) service.value = link.dataset.service;
      quoteForm.closest('.quote-card').scrollIntoView({ block: 'start' });
      plate.focus({ preventScroll: true });
    }),
  );
  quoteForm.addEventListener('submit', (event) => {
    event.preventDefault();
    if (
      !validate([
        [plate, 'plate'],
        [document.querySelector('#quote-name'), 'name'],
        [document.querySelector('#quote-phone'), 'phone'],
      ])
    )
      return;
    const day = date.value
      ? new Date(date.value + 'T12:00').toLocaleDateString('en-GB', {
          weekday: 'short',
          day: 'numeric',
          month: 'short',
        })
      : '';
    summary.textContent = [service.selectedOptions[0].textContent, plateValue(plate), day]
      .filter(Boolean)
      .join(' · ');
    swap(quoteForm, final, true);
  });
  final
    .querySelector('[data-restart]')
    .addEventListener('click', () => swap(quoteForm, final, false));

  const reminderForm = document.querySelector('#reminder-form');
  const reminderThanks = document.querySelector('#reminder-thanks');
  reminderForm.addEventListener('submit', (event) => {
    event.preventDefault();
    if (
      validate([
        [document.querySelector('#reminder-plate'), 'plate'],
        [document.querySelector('#reminder-phone'), 'phone'],
      ])
    )
      swap(reminderForm, reminderThanks, true);
  });
  document
    .querySelector('[data-reminder-again]')
    .addEventListener('click', () => swap(reminderForm, reminderThanks, false));

  // The map is third-party: it loads only when the visitor asks for it.
  mapLoad.addEventListener('click', () => {
    const frame = document.createElement('iframe');
    const src = new URL('https://www.google.com/maps');
    src.searchParams.set('q', mapQuery);
    src.searchParams.set('output', 'embed');
    frame.src = src.href;
    frame.title = c.visit.locationLabel + ': ' + mapQuery;
    frame.loading = 'lazy';
    frame.referrerPolicy = 'no-referrer';
    frame.className = 'map-frame';
    mapLoaded = mapQuery;
    mapLoad.hidden = true;
    mapLoad.nextElementSibling.hidden = true;
    mapLoad.closest('.map').append(frame);
    frame.focus();
  });
  function restore() {
    update();
    input.value = '';
    nameDialog.close();
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
