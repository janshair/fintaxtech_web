(() => {
  'use strict';
  const root = document.documentElement;
  root.classList.add('js');
  // The hero underline waits, unpainted, until motion.js paints it with the brush.
  if (!matchMedia('(prefers-reduced-motion: reduce)').matches) {
    root.classList.add('paint-pending');
    setTimeout(() => window.beautyMotion || root.classList.remove('paint-pending'), 4000);
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
      phone: phone(query.get('phone')),
      ref: /^[A-Za-z0-9_-]{1,32}$/.test(ref) ? ref : '',
    };
  }
  const initials = (name) =>
    (name.match(/[\p{L}\p{N}]+(?:['’][\p{L}\p{N}]+)*/gu) || [])
      .slice(0, 2)
      .map((word) => Array.from(word.toUpperCase())[0])
      .join('') || 'PP';
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
  const values = read();
  // Mutation callbacks run before rendering; a streamed default identity is never painted.
  function hydrate() {
    if (values.name) {
      document.querySelectorAll('[data-business]').forEach((node) => setText(node, values.name));
      document
        .querySelectorAll('[data-monogram]')
        .forEach((node) => setText(node, initials(values.name)));
    }
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
  if (values.name) document.title = values.name + ' — Website demo by FinTaxTech';
  const observer = new MutationObserver(hydrate);
  observer.observe(root, { childList: true, subtree: true });
  window.beautyIdentity = { clean, read, initials, links, stop: () => observer.disconnect() };
})();
