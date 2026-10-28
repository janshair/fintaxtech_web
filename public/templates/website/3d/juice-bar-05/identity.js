(() => {
  'use strict';
  document.documentElement.dataset.js = 'true';
  const sample = 'Daybreak Juice Club';
  const clean = (value, limit) =>
    Array.from((value || '').trim().replace(/\s+/gu, ' '))
      .slice(0, limit)
      .join('');
  const initials = (name) =>
    (name.match(/[\p{L}\p{N}]+(?:['’][\p{L}\p{N}]+)*/gu) || [])
      .slice(0, 2)
      .map((word) => Array.from(word.toUpperCase())[0])
      .join('') || 'DJ';
  function read() {
    const q = new URL(location.href).searchParams;
    const raw = (q.get('phone') || '').trim();
    const digits = raw.replace(/[^\d]/g, '');
    const national = digits.startsWith('0044')
      ? '0' + digits.slice(4)
      : digits.startsWith('44')
        ? '0' + digits.slice(2)
        : digits;
    const valid = raw.length <= 20 && /^[+\d ()]+$/.test(raw) && /^0\d{10}$/.test(national);
    return {
      name: clean(q.get('name'), 100),
      area: clean(q.get('area'), 100),
      phone: valid ? national.slice(0, 5) + ' ' + national.slice(5) : '',
      international: valid ? '+44' + national.slice(1) : '',
      ref: /^[A-Za-z0-9_-]{1,32}$/.test((q.get('ref') || '').trim()) ? q.get('ref').trim() : '',
    };
  }
  function hydrate() {
    const v = read(),
      name = v.name || sample;
    const put = (selector, value) =>
      document.querySelectorAll(selector).forEach((node) => {
        if (node.textContent !== value) node.textContent = value;
      });
    put('[data-business]', name);
    put('[data-monogram]', initials(name));
    document.querySelectorAll('[data-area-prefix]').forEach((node) => {
      const value = v.area ? 'in' : 'near';
      if (node.textContent.toLowerCase() !== value) node.textContent = value;
    });
    put('[data-area]', v.area || 'Dundee & Tayside');
    put('[data-map-area]', v.area || 'Your address here');
    put('[data-phone]', v.phone || 'Your number here');
    const title = name + ' — Juice bar website demo by FinTaxTech';
    if (document.title !== title) document.title = title;
    document
      .querySelectorAll('[data-agency-link]')
      .forEach((node) =>
        node.setAttribute('href', '/contact/' + (v.ref ? '?ref=' + encodeURIComponent(v.ref) : '')),
      );
    document
      .querySelectorAll('[data-call]')
      .forEach((node) =>
        node.setAttribute('href', v.international ? 'tel:' + v.international : '#contact'),
      );
    document
      .querySelectorAll('[data-whatsapp]')
      .forEach((node) =>
        node.setAttribute(
          'href',
          v.international ? 'https://wa.me/' + v.international.slice(1) : '#contact',
        ),
      );
  }
  // A blocking, local script plus mutation delivery before paint avoids sample-name flash.
  // Text nodes only: URL values never become markup, assets, telemetry or storage.
  const observer = new MutationObserver(hydrate);
  observer.observe(document.documentElement, { childList: true, subtree: true });
  window.juiceIdentity = {
    sample,
    clean,
    initials,
    read,
    hydrate,
    stop: () => observer.disconnect(),
  };
  hydrate();
})();
