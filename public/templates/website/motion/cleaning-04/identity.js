(() => {
  'use strict';
  const clean = (value, limit) =>
    Array.from((value || '').trim().replace(/\s+/gu, ' '))
      .slice(0, limit)
      .join('');
  function read() {
    const query = new URL(location.href).searchParams;
    const raw = (query.get('phone') || '').trim();
    return {
      name: clean(query.get('name'), 100),
      area: clean(query.get('area'), 100),
      phone: raw.length <= 20 && /^[+\d ()]+$/.test(raw) && /\d/.test(raw) ? raw : '',
      ref: /^[A-Za-z0-9_-]{1,32}$/.test((query.get('ref') || '').trim())
        ? query.get('ref').trim()
        : '',
    };
  }
  const initials = (name) =>
    (name.match(/[\p{L}\p{N}]+(?:['’][\p{L}\p{N}]+)*/gu) || [])
      .slice(0, 2)
      .map((word) => Array.from(word.toUpperCase())[0])
      .join('') || 'LS';
  const setText = (node, value) => {
    if (node.textContent !== value) node.textContent = value;
  };
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
    if (values.phone)
      document.querySelectorAll('[data-phone]').forEach((node) => setText(node, values.phone));
  }
  if (values.name) document.title = values.name + ' — Cleaning website demo by FinTaxTech';
  const observer = new MutationObserver(hydrate);
  observer.observe(document.documentElement, { childList: true, subtree: true });
  window.cleaningIdentity = { clean, read, initials, stop: () => observer.disconnect() };
})();
