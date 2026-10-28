(() => {
  'use strict';
  const identity = window.juiceIdentity;
  identity.stop();
  identity.hydrate();
  const nameDialog = document.querySelector('#name-dialog');
  const orderDialog = document.querySelector('#order-dialog');
  const edit = document.querySelector('[data-edit]');
  const input = document.querySelector('#business-name');
  const triggers = new WeakMap();
  let offered = Boolean(identity.read().name),
    timer;
  function cancelOffer() {
    offered = true;
    clearTimeout(timer);
    removeEventListener('scroll', offer);
  }
  function open(dialog, trigger) {
    cancelOffer();
    triggers.set(dialog, trigger || edit);
    dialog.showModal();
    dispatchEvent(new Event('juice-scene-change'));
  }
  function offer() {
    if (!offered && !document.querySelector('dialog[open]')) {
      open(nameDialog, edit);
      input.focus();
    }
  }
  document.querySelectorAll('dialog').forEach((dialog) => {
    dialog.querySelector('[data-close]').addEventListener('click', () => dialog.close());
    dialog.addEventListener('close', () => {
      triggers.get(dialog)?.focus({ preventScroll: true });
      dispatchEvent(new Event('juice-scene-change'));
    });
  });
  edit.addEventListener('click', () => {
    input.value = identity.read().name;
    open(nameDialog, edit);
    input.focus();
  });
  function setName(value) {
    const url = new URL(location.href);
    if (value) url.searchParams.set('name', value);
    else url.searchParams.delete('name');
    history.replaceState(history.state, '', url);
    identity.hydrate();
    nameDialog.close();
    document.querySelector('#announcement').textContent =
      'Preview updated for ' + (identity.read().name || identity.sample);
    dispatchEvent(new Event('juice-identity-change'));
  }
  document.querySelector('#name-form').addEventListener('submit', (event) => {
    event.preventDefault();
    const value = identity.clean(input.value, 100);
    document.querySelector('#name-error').textContent = value
      ? ''
      : 'Enter your business name, or explore the sample.';
    input.setAttribute('aria-invalid', String(!value));
    if (value) setName(value);
    else input.focus();
  });
  document.querySelector('#restore-name').addEventListener('click', () => {
    document.querySelector('#name-error').textContent = '';
    setName('');
  });
  if (!offered) {
    timer = setTimeout(offer, 5000);
    addEventListener('scroll', offer, { passive: true });
  }
  const forms = [
    document.querySelector('#type-form'),
    document.querySelector('#mix-form'),
    document.querySelector('#order-final'),
  ];
  const type = document.querySelector('#drink-type'),
    fruit = document.querySelector('#drink-fruit');
  function step(index) {
    forms.forEach((form, i) => (form.hidden = i !== index));
    document.querySelectorAll('[data-order-indicator]').forEach((node, i) => {
      if (i === index) node.setAttribute('aria-current', 'step');
      else node.removeAttribute('aria-current');
    });
    forms[index].querySelector('h3').focus();
  }
  function mix() {
    const colour =
      type.value === 'coffee'
        ? '#99623d'
        : fruit.value === 'berry'
          ? '#d77e91'
          : fruit.value === 'green'
            ? '#87aa52'
            : '#ee9239';
    document.documentElement.style.setProperty('--drink-colour', colour);
    const label =
      type.selectedOptions[0].textContent + ' · ' + fruit.selectedOptions[0].textContent;
    document.querySelector('[data-drink-description]').textContent = label;
    dispatchEvent(
      new CustomEvent('juice-mix-change', {
        detail: { colour, fruit: fruit.value, type: type.value },
      }),
    );
  }
  document.querySelectorAll('[data-order]').forEach((link) =>
    link.addEventListener('click', (event) => {
      event.preventDefault();
      open(orderDialog, link);
      step(0);
      mix();
    }),
  );
  forms[0].addEventListener('submit', (event) => {
    event.preventDefault();
    step(1);
    mix();
  });
  forms[1].addEventListener('submit', (event) => {
    event.preventDefault();
    const fields = ['drink-base', 'drink-fruit', 'drink-addon', 'collection-time'].map((id) =>
      document.getElementById(id),
    );
    if (fields.some((field) => !field.value)) {
      document.querySelector('#order-error').textContent =
        'Choose each example option to continue.';
      return;
    }
    document.querySelector('#order-error').textContent = '';
    document.querySelector('#order-summary').textContent = [
      type.selectedOptions[0].textContent,
      ...fields.map((field) => field.selectedOptions[0].textContent),
    ].join(' · ');
    step(2);
    mix();
  });
  document
    .querySelectorAll('[data-restart]')
    .forEach((button) => button.addEventListener('click', () => step(0)));
  [
    type,
    fruit,
    document.querySelector('#drink-base'),
    document.querySelector('#drink-addon'),
  ].forEach((field) => field.addEventListener('change', mix));
  document.querySelectorAll('[data-directions]').forEach((button) =>
    button.addEventListener('click', (event) => {
      event.preventDefault();
      open(document.querySelector('#directions-dialog'), button);
    }),
  );
  mix();
})();
