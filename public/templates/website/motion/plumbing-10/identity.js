(() => {
  'use strict';
  // Personalisation shared by the motion templates: ?name=, &area= and &phone=.
  // Loaded blocking in <head>; a MutationObserver fills identity nodes as they stream in,
  // so the default business name is never painted. Values are set only as text, or as
  // tel: links built from digits. No query data enters requests or storage.
  const root = document.documentElement;
  root.classList.add('js');
  const clean = (value, limit) =>
    Array.from((value || '').trim().replace(/\s+/gu, ' '))
      .slice(0, limit)
      .join('');
  // UK numbers display nationally (01632 960123) and link as tel:+44…
  function phone(raw) {
    const value = (raw || '').trim();
    if (!value || value.length > 20 || !/^[+\d ()]+$/.test(value)) return null;
    let digits = value.replace(/\D/g, '');
    if (value.startsWith('+')) {
      if (digits.startsWith('44')) digits = digits.slice(2).replace(/^0/, '');
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
  const query = new URL(location.href).searchParams;
  const values = {
    name: clean(query.get('name'), 100),
    area: clean(query.get('area'), 100),
    phone: phone(query.get('phone')),
    // A letter reference is carried to the brief and contact links only.
    ref: /^[A-Za-z0-9_-]{1,32}$/.test(query.get('ref') || '') ? query.get('ref') : '',
  };
  const setText = (node, value) => {
    if (node.textContent !== value) node.textContent = value;
  };
  let business = false;
  function hydrate() {
    if (values.name)
      document.querySelectorAll('[data-business]').forEach((node) => setText(node, values.name));
    if (values.area)
      document.querySelectorAll('[data-area]').forEach((node) => setText(node, values.area));
    if (values.phone) {
      document
        .querySelectorAll('[data-phone]')
        .forEach((node) => setText(node, values.phone.display));
      document.querySelectorAll('[data-call]').forEach((node) => {
        node.href = 'tel:+' + values.phone.international;
      });
    }
    // Keep the sample business's structured data in step with the preview.
    const ld = !business && document.getElementById('ld-business');
    if (ld && (values.name || values.area || values.phone)) {
      try {
        const data = JSON.parse(ld.textContent);
        const node = data['@graph'].find((item) => item['@type'] === 'Plumber');
        if (values.name) node.name = values.name;
        if (values.area) node.areaServed = values.area;
        if (values.phone) node.telephone = values.phone.display;
        ld.textContent = JSON.stringify(data);
        business = true;
      } catch {
        business = true;
      }
    }
  }
  if (values.name) document.title = values.name + ' — Website demo by FinTaxTech';
  const observer = new MutationObserver(hydrate);
  observer.observe(root, { childList: true, subtree: true });
  window.plumbingIdentity = { values, hydrate, stop: () => observer.disconnect() };
})();
