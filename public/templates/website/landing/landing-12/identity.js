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
      area: clean(query.get('area'), 100),
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
  function links(values) {
    document.querySelectorAll('[data-email-link]').forEach((node) => {
      if (values.email) node.href = 'mailto:' + values.email;
    });
    // Without ?phone= the buttons keep the number rendered into the page.
    if (!values.phone) return;
    document.querySelectorAll('[data-whatsapp]').forEach((node) => {
      node.href = 'https://wa.me/' + values.phone.international;
    });
    document.querySelectorAll('[data-call]').forEach((node) => {
      node.href = 'tel:+' + values.phone.international;
    });
    document.querySelectorAll('[data-phone]').forEach((node) => {
      setText(node, values.phone.display);
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
      document.querySelectorAll('[data-area]').forEach((node) => setText(node, values.area));
    if (values.email)
      document.querySelectorAll('[data-email]').forEach((node) => setText(node, values.email));
    links(values);
  }
  if (values.name) document.title = values.name + ' — Landing page demo by FinTaxTech';
  const observer = new MutationObserver(hydrate);
  observer.observe(root, { childList: true, subtree: true });
  window.landingIdentity = {
    clean,
    read,
    initials,
    stop: () => observer.disconnect(),
  };
})();
