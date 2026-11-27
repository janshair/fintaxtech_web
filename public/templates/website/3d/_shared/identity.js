// Shared personalisation for 3D template demos. Configure it on the script tag
// with data-sample-* attributes, data-template-id, data-title-suffix and
// data-loader-key. (Never reuse the hooks this script fills in, such as
// data-area or data-phone, on the script tag itself.)
(() => {
  'use strict';
  const config = document.currentScript.dataset;
  const root = document.documentElement;
  root.dataset.js = 'true';
  const sample = config.sampleName;
  const sampleArea = config.sampleArea;
  // Ofcom drama-range numbers are safe to show and never connect to anyone.
  const samplePhone = {
    display: config.samplePhone,
    tel: config.sampleTel,
    international: config.sampleIntl,
  };
  // The loader plays once per browser session and never under reduced motion.
  try {
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (config.loaderKey && !reduced && !sessionStorage.getItem(config.loaderKey)) {
      root.dataset.loader = 'on';
      sessionStorage.setItem(config.loaderKey, '1');
    }
  } catch {
    /* Storage blocked: skip the loader rather than replay it on every page. */
  }
  const clean = (value, limit) =>
    Array.from((value || '').trim().replace(/\s+/gu, ' '))
      .slice(0, limit)
      .join('');
  const initials = (name) =>
    (name.match(/[\p{L}\p{N}]+(?:['’][\p{L}\p{N}]+)*/gu) || [])
      .slice(0, 2)
      .map((word) => Array.from(word.toUpperCase())[0])
      .join('') || config.sampleInitials;
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
    const attr = (selector, key, value) =>
      document.querySelectorAll(selector).forEach((node) => {
        if (node.getAttribute(key) !== value) node.setAttribute(key, value);
      });
    put('[data-business]', name);
    put('[data-monogram]', initials(name));
    put('[data-area]', v.area || sampleArea);
    put('[data-phone]', v.phone || samplePhone.display);
    const title = name + ' — ' + config.titleSuffix;
    if (document.title !== title) document.title = title;
    attr(
      '[data-agency-link]',
      'href',
      '/contact/' + (v.ref ? '?ref=' + encodeURIComponent(v.ref) : ''),
    );
    // The final offer opens the template brief with this preview's values.
    const brief = new URLSearchParams({ template: config.templateId });
    for (const key of ['name', 'area', 'phone', 'ref']) if (v[key]) brief.set(key, v[key]);
    attr('[data-brief-link]', 'href', '/client/website-brief/templates/?' + brief);
    attr('[data-call]', 'href', 'tel:' + (v.international || samplePhone.tel));
    attr(
      '[data-whatsapp]',
      'href',
      'https://wa.me/' + (v.international ? v.international.slice(1) : samplePhone.international),
    );
  }
  // A blocking, local script plus mutation delivery before paint avoids sample-name flash.
  // Text nodes only: URL values never become markup, assets, telemetry or storage.
  const observer = new MutationObserver(hydrate);
  observer.observe(root, { childList: true, subtree: true });
  window.templateIdentity = {
    sample,
    clean,
    initials,
    read,
    hydrate,
    stop: () => observer.disconnect(),
  };
  hydrate();
})();
