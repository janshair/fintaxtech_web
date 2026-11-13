(() => {
  'use strict';
  const c = JSON.parse(document.querySelector('#template-copy').textContent);
  const { clean, read, initials, stop } = window.landingIdentity;
  stop();
  const $ = (selector) => document.querySelector(selector);
  const $$ = (selector) => Array.from(document.querySelectorAll(selector));
  const root = document.documentElement;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const dialog = $('#name-dialog');
  const nameInput = $('#business-name');
  const areaInput = $('#business-area');
  const nameError = $('#name-error');
  const edit = $('[data-edit]');
  const status = $('#announcement');
  let current;
  let toastTimer;

  function announce(message) {
    status.textContent = message;
    status.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => status.classList.remove('show'), 4000);
  }

  // The footer wordmark is sized to fill the page width, whatever the name.
  const giant = $('[data-fit]');
  function fit() {
    const box = giant.parentElement;
    const width = box.clientWidth - parseFloat(getComputedStyle(box).paddingLeft) * 2;
    giant.style.fontSize = '100px';
    const natural = giant.getBoundingClientRect().width || 1;
    giant.style.fontSize = Math.min(360, (100 * width) / natural) + 'px';
  }

  function update() {
    current = read();
    const name = current.name || c.name;
    $$('[data-business]').forEach((node) => {
      node.textContent = name;
    });
    $$('[data-monogram]').forEach((node) => {
      node.textContent = initials(name).slice(0, 1);
    });
    $$('[data-area]').forEach((node) => {
      node.textContent = current.area || c.area;
    });
    const email = current.email || c.email;
    const phone = current.phone || c.phone;
    $$('[data-email]').forEach((node) => {
      node.textContent = email;
    });
    $$('[data-email-link]').forEach((node) => {
      node.href = 'mailto:' + email;
    });
    $$('[data-phone]').forEach((node) => {
      node.textContent = phone.display;
    });
    $$('[data-call]').forEach((node) => {
      node.href = 'tel:+' + phone.international;
    });
    $$('[data-whatsapp]').forEach((node) => {
      node.href = 'https://wa.me/' + phone.international;
    });
    $$('[data-example-note]').forEach((node) => {
      node.textContent = current.phone && current.email ? c.footer.noteOwnDetails : c.footer.note;
      node.hidden = Boolean(current.name && current.email && current.phone);
    });
    document.title = current.name
      ? name + c.titleSuffix
      : document.querySelector('meta[property="og:title"]').content;
    const contact = new URL(c.contact, location.origin);
    if (current.ref) contact.searchParams.set('ref', current.ref);
    $$('[data-agency-link]').forEach((node) => {
      node.href = contact.pathname + contact.search;
    });
    fit();
  }
  update();
  new ResizeObserver(fit).observe(giant.parentElement);
  document.fonts.ready.then(fit);

  // Statement: words light up as the paragraph scrolls through the screen.
  const words = $$('[data-reveal] .word');
  const reveal = $('[data-reveal]');
  function paintWords() {
    if (reduced.matches) {
      words.forEach((word) => word.classList.add('lit'));
      return;
    }
    const box = reveal.getBoundingClientRect();
    const start = innerHeight * 0.85;
    const end = innerHeight * 0.35;
    const progress = Math.min(1, Math.max(0, (start - box.top) / (start - end + box.height * 0.5)));
    const count = Math.round(progress * words.length);
    words.forEach((word, i) => word.classList.toggle('lit', i < count));
  }

  // Services: on wide screens the list stays in view and the scroll position picks
  // the active service and its illustration. Hover and focus pick one too.
  const services = $$('.service');
  const frames = $$('.art-frame');
  const track = $('.services');
  const wide = matchMedia('(min-width: 900px)');
  let active = 0;
  function setActive(index) {
    if (index === active) return;
    active = index;
    services.forEach((item, i) => item.classList.toggle('active', i === index));
    frames.forEach((frame, i) => frame.classList.toggle('active', i === index));
  }
  function pickService() {
    if (!wide.matches) return;
    const box = track.getBoundingClientRect();
    const travel = box.height - innerHeight;
    const progress = travel > 0 ? Math.min(0.999, Math.max(0, -box.top / travel)) : 0;
    setActive(Math.floor(progress * services.length));
  }
  services.forEach((item, i) => {
    item.addEventListener('pointerenter', () => setActive(i));
  });

  let queued = false;
  function onScroll() {
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => {
      queued = false;
      paintWords();
      pickService();
    });
  }
  addEventListener('scroll', onScroll, { passive: true });
  addEventListener('resize', onScroll);
  reduced.addEventListener('change', onScroll);
  root.classList.add('ready');
  onScroll();

  // Details: edits replace the URL (keeping email, phone and ref) so the link can be shared.
  function showError(message) {
    nameError.textContent = message;
    nameInput.setAttribute('aria-invalid', message ? 'true' : 'false');
  }
  function setDetails(name, area) {
    const url = new URL(location.href);
    for (const [key, value] of [
      ['name', name],
      ['area', area],
    ]) {
      if (value) url.searchParams.set(key, value);
      else url.searchParams.delete(key);
    }
    history.replaceState(history.state, '', url);
    update();
    dialog.close();
    announce(c.updated + (current.name || c.name));
  }
  edit.addEventListener('click', () => {
    nameInput.value = current.name;
    areaInput.value = current.area;
    showError('');
    dialog.showModal();
    nameInput.focus();
  });
  dialog.querySelector('[data-close]').addEventListener('click', () => dialog.close());
  dialog.addEventListener('close', () => edit.focus({ preventScroll: true }));
  $('#name-form').addEventListener('submit', (event) => {
    event.preventDefault();
    const name = clean(nameInput.value, 100);
    if (!name) {
      showError(c.nameDialog.error);
      nameInput.focus();
      return;
    }
    setDetails(name, clean(areaInput.value, 100));
  });
  nameInput.addEventListener('input', () => showError(''));
  $('#restore-name').addEventListener('click', () => setDetails('', ''));
})();
