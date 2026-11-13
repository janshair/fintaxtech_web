(() => {
  'use strict';
  const root = document.documentElement;
  root.classList.add('js');
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
    return { display: '0' + digits, international: '44' + digits };
  }
  // A plain address only: no display names, spaces, quotes or mailto parameters.
  function email(raw) {
    const value = (raw || '').trim();
    return value.length <= 100 && /^[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(\.[A-Za-z0-9-]+)+$/.test(value)
      ? value
      : '';
  }
  function read() {
    const query = new URL(location.href).searchParams;
    const ref = (query.get('ref') || '').trim();
    return {
      name: clean(query.get('name'), 100),
      tagline: clean(query.get('tagline'), 120),
      email: email(query.get('email')),
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
  // Long names step down in size so they still sit on the stage.
  const size = (name) => {
    const length = Array.from(name).length;
    root.dataset.nameSize = length > 34 ? 'small' : length > 16 ? 'medium' : 'large';
  };
  function links(values) {
    document.querySelectorAll('[data-email-link]').forEach((node) => {
      if (values.email) node.href = 'mailto:' + values.email;
    });
    document.querySelectorAll('[data-whatsapp]').forEach((node) => {
      node.href = values.phone ? 'https://wa.me/' + values.phone.international : '#whatsapp-note';
      if (values.phone) node.rel = 'noopener';
      else node.removeAttribute('rel');
    });
  }
  const values = read();
  // Mutation callbacks run before rendering; a streamed default identity is never painted.
  function hydrate() {
    if (values.name) {
      document.querySelectorAll('[data-business]').forEach((node) => setText(node, values.name));
      document
        .querySelectorAll('[data-monogram]')
        .forEach((node) => setText(node, initials(values.name)));
    }
    if (values.tagline)
      document.querySelectorAll('[data-tagline]').forEach((node) => setText(node, values.tagline));
    if (values.email)
      document.querySelectorAll('[data-email]').forEach((node) => setText(node, values.email));
    links(values);
  }
  if (values.name) {
    size(values.name);
    document.title = values.name + ' — Placeholder website demo by FinTaxTech';
  }
  const observer = new MutationObserver(hydrate);
  observer.observe(root, { childList: true, subtree: true });
  window.placeholderIdentity = {
    clean,
    read,
    initials,
    links,
    size,
    stop: () => observer.disconnect(),
  };
})();
