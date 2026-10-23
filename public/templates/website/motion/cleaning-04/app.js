(() => {
  'use strict';
  const c = JSON.parse(document.querySelector('#template-copy').textContent);
  const { clean, read, initials, stop } = window.cleaningIdentity;
  stop();
  const nameDialog = document.querySelector('#name-dialog');
  const quoteDialog = document.querySelector('#quote-dialog');
  const contactDialog = document.querySelector('#contact-dialog');
  const input = document.querySelector('#business-name');
  const edit = document.querySelector('[data-edit]');
  const dialogs = [nameDialog, quoteDialog, contactDialog];
  const triggers = new WeakMap();
  let offered = Boolean(read().name);
  let timer;
  let current;
  function update() {
    current = read();
    const name = current.name || c.name;
    document.querySelectorAll('[data-business]').forEach((node) => {
      node.textContent = name;
    });
    document.querySelectorAll('[data-monogram]').forEach((node) => {
      node.textContent = initials(name);
    });
    document.querySelectorAll('[data-area], [data-hero-area]').forEach((node) => {
      node.textContent = current.area || 'Dundee & Tayside';
    });
    document.querySelectorAll('[data-phone]').forEach((node) => {
      node.textContent = current.phone || 'Your number here';
    });
    document.title = name + c.titleSuffix;
    const contact = new URL('/contact/', location.origin);
    if (current.ref) contact.searchParams.set('ref', current.ref);
    document.querySelectorAll('[data-agency-link], .agency-contact').forEach((node) => {
      node.href = contact.href;
    });
    input.value = current.name;
  }
  update();
  function cancelOffer() {
    offered = true;
    clearTimeout(timer);
    removeEventListener('scroll', offer);
  }
  function open(dialog, trigger) {
    cancelOffer();
    triggers.set(dialog, trigger instanceof HTMLElement ? trigger : edit);
    dialog.showModal();
    document.body.classList.add('dialog-open');
  }
  function offer() {
    if (!offered && !dialogs.some((dialog) => dialog.open)) {
      open(nameDialog, edit);
      input.focus();
    }
  }
  dialogs.forEach((dialog) => {
    dialog.querySelector('[data-close]').addEventListener('click', () => dialog.close());
    dialog.addEventListener('close', () => {
      document.body.classList.remove('dialog-open');
      triggers.get(dialog)?.focus({ preventScroll: true });
    });
  });
  edit.addEventListener('click', () => {
    input.value = read().name;
    open(nameDialog, edit);
    input.focus();
  });
  function setName(value) {
    const url = new URL(location.href);
    if (value) url.searchParams.set('name', value);
    else url.searchParams.delete('name');
    history.replaceState(history.state, '', url);
    update();
    nameDialog.close();
    document.querySelector('#announcement').textContent =
      'Preview updated for ' + (current.name || c.name);
  }
  document.querySelector('#name-form').addEventListener('submit', (event) => {
    event.preventDefault();
    const name = clean(input.value, 100);
    if (!name) {
      input.setCustomValidity('Enter your business name, or choose the sample.');
      input.reportValidity();
      return;
    }
    setName(name);
  });
  input.addEventListener('input', () => input.setCustomValidity(''));
  document.querySelector('#restore-name').addEventListener('click', () => {
    input.setCustomValidity('');
    setName('');
  });
  const forms = [
    document.querySelector('#service-form'),
    document.querySelector('#space-form'),
    document.querySelector('#quote-final'),
  ];
  const service = document.querySelector('#quote-service');
  function step(index) {
    forms.forEach((form, i) => {
      form.hidden = i !== index;
    });
    document.querySelectorAll('[data-step-indicator]').forEach((node, i) => {
      if (i === index) node.setAttribute('aria-current', 'step');
      else node.removeAttribute('aria-current');
    });
    forms[index].querySelector('h3').focus();
  }
  document.querySelectorAll('[data-quote], [data-service]').forEach((link) =>
    link.addEventListener('click', (event) => {
      event.preventDefault();
      forms[1].reset();
      document.querySelector('#quote-summary').textContent = '';
      service.value = link.dataset.service || c.services[0].id;
      open(quoteDialog, link);
      step(0);
    }),
  );
  forms[0].addEventListener('submit', (event) => {
    event.preventDefault();
    step(1);
  });
  forms[1].addEventListener('submit', (event) => {
    event.preventDefault();
    document.querySelector('#quote-summary').textContent = [
      service.selectedOptions[0].textContent,
      document.querySelector('#quote-size').value,
      document.querySelector('#quote-frequency').value,
    ].join(' · ');
    step(2);
  });
  document
    .querySelectorAll('[data-restart]')
    .forEach((button) => button.addEventListener('click', () => step(0)));
  document.querySelectorAll('[data-contact]').forEach((button) =>
    button.addEventListener('click', () => {
      const kind = button.dataset.contact;
      document.querySelector('#contact-title').textContent = {
        call: 'Call preview',
        message: 'WhatsApp preview',
        directions: 'Your local area',
      }[kind];
      document.querySelector('#contact-explanation').textContent = c.contactNotes[kind];
      document.querySelector('.contact-preview-value').textContent =
        kind === 'directions'
          ? current.area || 'Your address here'
          : current.phone || 'Your number here';
      open(contactDialog, button);
    }),
  );
  function restore() {
    cancelOffer();
    dialogs.forEach((dialog) => dialog.close());
    update();
  }
  addEventListener('popstate', restore);
  addEventListener('pageshow', (event) => {
    if (event.persisted) restore();
  });
  if (!offered) {
    timer = setTimeout(offer, 5000);
    addEventListener('scroll', offer, { passive: true });
  }
})();
