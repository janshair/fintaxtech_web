(() => {
  'use strict';
  const root = document.documentElement;
  root.classList.add('js');
  // The hero signature waits, undrawn, until motion.js draws it on screen.
  if (!matchMedia('(prefers-reduced-motion: reduce)').matches) {
    root.classList.add('sign-pending');
    setTimeout(() => window.consultantMotion || root.classList.remove('sign-pending'), 4000);
  }
  const clean = (value, limit) =>
    Array.from((value || '').trim().replace(/\s+/gu, ' '))
      .slice(0, limit)
      .join('');
  // UK numbers display nationally (07526 699217) and link internationally (+447526699217).
  function phone(raw) {
    const value = (raw || '').trim();
    if (!value || value.length > 20 || !/^[+\d ()]+$/.test(value)) return null;
    let digits = value.replace(/\D/g, '');
    if (value.startsWith('+')) {
      if (digits.startsWith('44')) digits = digits.slice(2).replace(/^0/, '');
      else if (digits.length >= 8 && digits.length <= 15)
        return { display: value, international: digits };
      else return null;
    } else if (digits.startsWith('44') && digits.length === 12) digits = digits.slice(2);
    else if (digits.startsWith('0')) digits = digits.slice(1);
    else return null;
    if (digits.length < 9 || digits.length > 10) return null;
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
  function read() {
    const query = new URL(location.href).searchParams;
    const ref = (query.get('ref') || '').trim();
    return {
      name: clean(query.get('name'), 100),
      area: clean(query.get('area'), 100),
      role: clean(query.get('role'), 60),
      phone: phone(query.get('phone')),
      ref: /^[A-Za-z0-9_-]{1,32}$/.test(ref) ? ref : '',
    };
  }
  const initials = (name) =>
    (name.match(/[\p{L}\p{N}]+(?:['’][\p{L}\p{N}]+)*/gu) || [])
      .slice(0, 2)
      .map((word) => Array.from(word.toUpperCase())[0])
      .join('') || 'ME';
  const setText = (node, value) => {
    if (node.textContent !== value) node.textContent = value;
  };
  function links(value) {
    document.querySelectorAll('[data-call]').forEach((node) => {
      node.href = value ? 'tel:+' + value.international : '#contact';
    });
    document.querySelectorAll('[data-whatsapp]').forEach((node) => {
      node.href = value ? 'https://wa.me/' + value.international : '#contact';
      if (value) node.rel = 'noopener';
    });
  }
  // Role presets (from the JSON in <head>): the first pattern found in the role
  // text, ignoring case, picks the copy; anything else keeps the consultant copy.
  const presets = JSON.parse(document.getElementById('role-presets').textContent);
  const presetFor = (role) =>
    Object.keys(presets).find((key) => role && new RegExp(presets[key].match, 'i').test(role)) ||
    'consultant';
  function applyCopy(key) {
    const preset = presets[key];
    root.dataset.preset = key;
    document.querySelectorAll('[data-copy]').forEach((node) => {
      const value = node.dataset.copy.split('.').reduce((item, part) => item && item[part], preset);
      if (typeof value === 'string') setText(node, value);
    });
  }
  const values = read();
  const preset = presetFor(values.role);
  // Mutation callbacks run before rendering; a streamed default identity is never painted.
  function hydrate() {
    if (values.name) {
      document.querySelectorAll('[data-business]').forEach((node) => setText(node, values.name));
      document
        .querySelectorAll('[data-monogram]')
        .forEach((node) => setText(node, initials(values.name)));
    }
    if (values.role)
      document.querySelectorAll('[data-role]').forEach((node) => setText(node, values.role));
    if (preset !== 'consultant') applyCopy(preset);
    if (values.area)
      document
        .querySelectorAll('[data-area], [data-hero-area]')
        .forEach((node) => setText(node, values.area));
    if (values.phone) {
      document
        .querySelectorAll('[data-phone]')
        .forEach((node) => setText(node, values.phone.display));
      links(values.phone);
    }
  }
  // Personalised titles read "Name · Role — Website demo by FinTaxTech".
  if (values.name || values.role)
    document.title =
      (values.name || 'Morgan Ellis') +
      ' · ' +
      (values.role || 'Business consultant') +
      ' — Website demo by FinTaxTech';
  const observer = new MutationObserver(hydrate);
  observer.observe(root, { childList: true, subtree: true });
  root.dataset.preset = preset;
  window.consultantIdentity = {
    clean,
    read,
    initials,
    links,
    presetFor,
    applyCopy,
    stop: () => observer.disconnect(),
  };
})();
