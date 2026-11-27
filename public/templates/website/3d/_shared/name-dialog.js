(() => {
  'use strict';
  // Shared business name dialog for 3D template demos. It opens only when the
  // visitor asks: the "Change business name" button, or a link that ends in
  // #change-name. (It used to open by itself on the first scroll or after
  // 6.5 seconds; that interrupted people exploring the page, so it is gone.)
  const identity = window.templateIdentity;
  identity.stop();
  identity.hydrate();
  const dialog = document.querySelector('#name-dialog');
  const edit = document.querySelector('[data-edit]');
  const input = document.querySelector('#business-name');
  function open() {
    input.value = identity.read().name;
    dialog.showModal();
    input.focus();
  }
  dialog.querySelector('[data-close]').addEventListener('click', () => dialog.close());
  dialog.addEventListener('close', () => edit.focus({ preventScroll: true }));
  edit.addEventListener('click', open);
  function setName(value) {
    const url = new URL(location.href);
    if (value) url.searchParams.set('name', value);
    else url.searchParams.delete('name');
    if (url.hash === '#change-name') url.hash = '';
    history.replaceState(history.state, '', url);
    identity.hydrate();
    dialog.close();
    document.querySelector('#announcement').textContent =
      'Preview updated for ' + (identity.read().name || identity.sample);
    dispatchEvent(new Event('template-identity-change'));
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
  // A link that explicitly asks for the dialog opens it once the page is ready.
  if (location.hash === '#change-name')
    addEventListener('load', () => setTimeout(open, 300), { once: true });
})();
