(() => {
  'use strict';
  // Business name dialog: the same behaviour as the other FinTaxTech templates.
  const identity = window.juiceIdentity;
  identity.stop();
  identity.hydrate();
  const dialog = document.querySelector('#name-dialog');
  const edit = document.querySelector('[data-edit]');
  const input = document.querySelector('#business-name');
  let offered = Boolean(identity.read().name),
    timer;
  function cancelOffer() {
    offered = true;
    clearTimeout(timer);
    removeEventListener('scroll', offer);
  }
  function open() {
    cancelOffer();
    input.value = identity.read().name;
    dialog.showModal();
    input.focus();
  }
  function offer() {
    // Never interrupt the loader, the drink builder or an open dialog.
    const busy =
      document.querySelector('dialog[open]') ||
      document.querySelector('.loader:not(.is-done)')?.offsetParent ||
      document.querySelector('#build')?.contains(document.activeElement);
    if (!offered && !busy) open();
  }
  dialog.querySelector('[data-close]').addEventListener('click', () => dialog.close());
  dialog.addEventListener('close', () => edit.focus({ preventScroll: true }));
  edit.addEventListener('click', open);
  function setName(value) {
    const url = new URL(location.href);
    if (value) url.searchParams.set('name', value);
    else url.searchParams.delete('name');
    history.replaceState(history.state, '', url);
    identity.hydrate();
    dialog.close();
    document.querySelector('#announcement').textContent =
      'Preview updated for ' + (identity.read().name || identity.sample);
    dispatchEvent(new Event('juice-identity-change'));
  }
  document.querySelector('#name-form').addEventListener('submit', (event) => {
    event.preventDefault();
    const value = identity.clean(input.value, 100);
    document.querySelector('#name-error').textContent = value
      ? ''
      : 'Enter your business name, or go back to the sample.';
    input.setAttribute('aria-invalid', String(!value));
    if (value) setName(value);
    else input.focus();
  });
  document.querySelector('#restore-name').addEventListener('click', () => {
    document.querySelector('#name-error').textContent = '';
    setName('');
  });
  if (!offered) {
    timer = setTimeout(offer, 6500);
    addEventListener('scroll', offer, { passive: true, once: true });
  }
})();
