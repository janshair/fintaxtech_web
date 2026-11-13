(() => {
  'use strict';
  const c = JSON.parse(document.querySelector('#template-copy').textContent);
  const { clean, read, initials, size, stop } = window.placeholderIdentity;
  stop();
  const $ = (selector) => document.querySelector(selector);
  const dialog = $('#name-dialog');
  const nameInput = $('#business-name');
  const taglineInput = $('#business-tagline');
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
  function update() {
    current = read();
    const name = current.name || c.name;
    document.querySelectorAll('[data-business]').forEach((node) => {
      node.textContent = name;
    });
    document.querySelectorAll('[data-monogram]').forEach((node) => {
      node.textContent = initials(name);
    });
    document.querySelectorAll('[data-tagline]').forEach((node) => {
      node.textContent = current.tagline || (current.name ? '' : c.tagline);
      node.hidden = !node.textContent;
    });
    document.querySelectorAll('[data-email]').forEach((node) => {
      node.textContent = current.email || c.email;
    });
    document.querySelectorAll('[data-email-link]').forEach((node) => {
      node.href = 'mailto:' + (current.email || c.email);
    });
    const phone = current.phone || c.phone;
    document.querySelectorAll('[data-phone]').forEach((node) => {
      node.textContent = phone.display;
    });
    document.querySelectorAll('[data-call]').forEach((node) => {
      node.href = 'tel:+' + phone.international;
    });
    document.querySelectorAll('[data-whatsapp]').forEach((node) => {
      node.href = 'https://wa.me/' + phone.international;
    });
    size(name);
    // The footnote stays until every example detail has been replaced.
    document.querySelectorAll('[data-example-note]').forEach((node) => {
      node.textContent = current.phone && current.email ? c.footnoteOwnDetails : c.footnote;
      node.hidden = Boolean(current.name && current.email && current.phone);
    });
    document.title = current.name
      ? name + c.titleSuffix
      : document.querySelector('meta[property="og:title"]').content;
    const contact = new URL(c.contact, location.origin);
    if (current.ref) contact.searchParams.set('ref', current.ref);
    document.querySelectorAll('[data-agency-link]').forEach((node) => {
      node.href = contact.pathname + contact.search;
    });
  }
  update();

  // Details: edits replace the URL (keeping email, phone and ref) so the link can be shared.
  function showError(message) {
    nameError.textContent = message;
    nameInput.setAttribute('aria-invalid', message ? 'true' : 'false');
  }
  function setDetails(name, tagline) {
    const url = new URL(location.href);
    for (const [key, value] of [
      ['name', name],
      ['tagline', tagline],
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
    taglineInput.value = current.tagline;
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
    setDetails(name, clean(taglineInput.value, 120));
  });
  nameInput.addEventListener('input', () => showError(''));
  $('#restore-name').addEventListener('click', () => setDetails('', ''));
})();
