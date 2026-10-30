(() => {
  'use strict';
  const c = JSON.parse(document.querySelector('#template-copy').textContent);
  const { clean, read, initials, links, stop } = window.gymIdentity;
  stop();
  const $ = (selector) => document.querySelector(selector);
  const nameDialog = $('#name-dialog');
  const visitDialog = $('#visit-dialog');
  const contactDialog = $('#contact-dialog');
  const input = $('#business-name');
  const nameError = $('#name-error');
  const edit = $('[data-edit]');
  const dialogs = [nameDialog, visitDialog, contactDialog];
  const triggers = new WeakMap();
  // The name offer appears at most once. The flag also rides on history.state (not storage),
  // so a page the browser reloads on its own, such as iOS Safari restoring a discarded tab
  // or a back/forward return, does not offer again; only an explicit reload does.
  const reloaded = performance.getEntriesByType('navigation')[0]?.type === 'reload';
  let offered = Boolean(read().name) || (!reloaded && Boolean(history.state?.gymNameOffered));
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
      node.textContent = current.area || c.area;
    });
    document.querySelectorAll('[data-phone]').forEach((node) => {
      node.textContent = current.phone ? current.phone.display : 'Your number here';
    });
    links(current.phone);
    document.title = name + c.titleSuffix;
    const contact = new URL('/contact/', location.origin);
    if (current.ref) contact.searchParams.set('ref', current.ref);
    document.querySelectorAll('[data-agency-link]').forEach((node) => {
      node.href = contact.pathname + contact.search;
    });
    input.value = current.name;
  }
  update();

  function cancelOffer() {
    offered = true;
    clearTimeout(timer);
    removeEventListener('scroll', offer);
    if (!history.state?.gymNameOffered)
      history.replaceState({ ...history.state, gymNameOffered: true }, '', location.href);
  }
  function open(dialog, trigger) {
    cancelOffer();
    dialogs.forEach((other) => other !== dialog && other.open && other.close());
    triggers.set(dialog, trigger instanceof HTMLElement ? trigger : edit);
    if (!dialog.open) dialog.showModal();
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
      if (!dialogs.some((other) => other.open)) document.body.classList.remove('dialog-open');
      const trigger = triggers.get(dialog);
      if (trigger && trigger.isConnected) trigger.focus({ preventScroll: true });
    });
  });

  // Business name: edits replace the URL so the personalised link can be shared.
  function showError(message) {
    nameError.textContent = message;
    input.setAttribute('aria-invalid', message ? 'true' : 'false');
  }
  edit.addEventListener('click', () => {
    input.value = read().name;
    showError('');
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
    $('#announcement').textContent = 'Preview updated for ' + (current.name || c.name);
  }
  $('#name-form').addEventListener('submit', (event) => {
    event.preventDefault();
    const name = clean(input.value, 100);
    if (!name) {
      showError('Enter your business name, or explore the sample.');
      input.focus();
      return;
    }
    setName(name);
  });
  input.addEventListener('input', () => showError(''));
  $('#restore-name').addEventListener('click', () => {
    showError('');
    setName('');
  });
  const copy = $('#copy-link');
  copy.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(location.href);
      copy.textContent = 'Link copied';
    } catch {
      copy.textContent = 'Copy the address bar link';
    }
    setTimeout(() => {
      copy.textContent = 'Copy your link';
    }, 2500);
  });

  // The hero card's "Next · example" tag follows the visitor's clock.
  const nextTag = $('[data-next-tag]');
  const minutes = new Date().getHours() * 60 + new Date().getMinutes();
  const heroRows = [...document.querySelectorAll('[data-class-at]')];
  const nextRow =
    heroRows.find((row) => {
      const [hour, minute] = row.dataset.classAt.split(':').map(Number);
      return hour * 60 + minute > minutes;
    }) || heroRows[0];
  if (nextTag && nextRow) nextRow.append(nextTag);

  // Timetable days are progressive enhancement: without JavaScript every day is listed.
  // The highlight slides between days and the list slides out and in, in the
  // direction of travel. Reduced motion switches instantly.
  const still = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
  const dayButtons = [...document.querySelectorAll('[data-day]')];
  const dayPanels = [...document.querySelectorAll('[data-day-panel]')];
  const indicator = $('.day-indicator');
  function placeIndicator() {
    const button = dayButtons.find((node) => node.getAttribute('aria-pressed') === 'true');
    indicator.style.width = button.offsetWidth + 'px';
    indicator.style.transform = `translateX(${button.offsetLeft}px)`;
  }
  placeIndicator();
  indicator.classList.add('is-ready');
  addEventListener('resize', () => {
    indicator.classList.remove('is-moving');
    placeIndicator();
  });
  function showPanel(next) {
    dayPanels.forEach((panel) => panel.classList.toggle('is-active', panel === next));
    document.dispatchEvent(new Event('gym:day'));
  }
  dayButtons.forEach((button) =>
    button.addEventListener('click', () => {
      const current = dayPanels.find((panel) => panel.classList.contains('is-active'));
      const next = dayPanels.find((panel) => panel.dataset.dayPanel === button.dataset.day);
      dayButtons.forEach((other) =>
        other.setAttribute('aria-pressed', String(other === button)),
      );
      indicator.classList.toggle('is-moving', !still());
      placeIndicator();
      if (next === current) return;
      if (still()) return showPanel(next);
      const direction = dayPanels.indexOf(next) > dayPanels.indexOf(current) ? 1 : -1;
      current
        .animate(
          [
            { opacity: 1, transform: 'translateX(0px)' },
            { opacity: 0, transform: `translateX(${-24 * direction}px)` },
          ],
          { duration: 120, easing: 'ease-in' },
        )
        .finished.then(() => {
          showPanel(next);
          next.animate(
            [
              { opacity: 0, transform: `translateX(${24 * direction}px)` },
              { opacity: 1, transform: 'translateX(0px)' },
            ],
            { duration: 240, easing: 'cubic-bezier(.2,.7,.2,1)' },
          );
        });
    }),
  );

  // "What's included" opens each membership card; its perks tick in.
  document.querySelectorAll('.perks-toggle').forEach((toggle) =>
    toggle.addEventListener('click', () => {
      const card = toggle.closest('.membership');
      const open = !card.classList.contains('is-open');
      card.classList.toggle('is-open', open);
      toggle.setAttribute('aria-expanded', String(open));
      if (!open || still()) return;
      card.querySelectorAll('.perks li').forEach((item, i) =>
        item.animate(
          [
            { opacity: 0, transform: 'translateY(8px)' },
            { opacity: 1, transform: 'translateY(0px)' },
          ],
          { duration: 220, delay: i * 70, easing: 'ease-out', fill: 'backwards' },
        ),
      );
    }),
  );

  // Three-step visit demo. Every field is pre-filled, so Next always reaches the end.
  const steps = [$('#try-form'), $('#when-form'), $('#visit-final')];
  const service = $('#visit-service');
  const day = $('#visit-day');
  const time = $('#visit-time');
  const level = $('#visit-level');
  const classNote = $('#visit-class');
  let chosenClass = '';
  function step(index) {
    steps.forEach((node, i) => {
      node.hidden = i !== index;
    });
    document.querySelectorAll('[data-step-indicator]').forEach((node, i) => {
      if (i === index) node.setAttribute('aria-current', 'step');
      else node.removeAttribute('aria-current');
    });
    steps[index].querySelector('h3').focus();
    // The pass slides out and its tick draws itself.
    if (index === 2 && !still()) {
      $('.pass-card').animate(
        [
          { opacity: 0, transform: 'translateY(32px)' },
          { opacity: 1, transform: 'translateY(0px)' },
        ],
        { duration: 420, easing: 'cubic-bezier(.2,.8,.2,1.15)', fill: 'backwards' },
      );
      $('.pass-tick path').animate([{ strokeDashoffset: 100 }, { strokeDashoffset: 0 }], {
        duration: 380,
        delay: 320,
        easing: 'ease-out',
        fill: 'backwards',
      });
    }
  }
  function bucket(clock) {
    const hour = Number(clock.split(':')[0]);
    return hour < 9 ? 'early' : hour < 16 ? 'day' : 'evening';
  }
  function showClass() {
    const visible = Boolean(chosenClass) && service.value === 'classes';
    classNote.hidden = !visible;
    classNote.textContent = visible ? 'Taster: ' + chosenClass : '';
  }
  function startFlow(trigger) {
    $('#when-form').reset();
    $('#visit-summary').textContent = '';
    chosenClass = '';
    service.value = trigger.dataset.service || c.services[0].id;
    if (trigger.dataset.class) {
      service.value = 'classes';
      chosenClass = trigger.dataset.class;
      day.value = trigger.dataset.classDay;
      time.value = bucket(trigger.dataset.classTime);
    }
    showClass();
    open(visitDialog, trigger);
    step(0);
  }
  document.querySelectorAll('[data-book], [data-service], [data-class]').forEach((trigger) =>
    trigger.addEventListener('click', (event) => {
      event.preventDefault();
      startFlow(trigger);
    }),
  );
  service.addEventListener('change', showClass);
  steps[0].addEventListener('submit', (event) => {
    event.preventDefault();
    step(1);
  });
  steps[1].addEventListener('submit', (event) => {
    event.preventDefault();
    $('#visit-summary').textContent = [
      service.selectedOptions[0].textContent + (classNote.hidden ? '' : ' · ' + chosenClass),
      day.value,
      time.selectedOptions[0].textContent,
      level.value,
    ].join(' · ');
    step(2);
  });
  document
    .querySelectorAll('[data-restart]')
    .forEach((button) => button.addEventListener('click', () => step(0)));

  // Without ?phone, Call and WhatsApp explain the preview instead of dialling nothing.
  function preview(kind, trigger) {
    $('#contact-title').textContent = {
      call: 'Call preview',
      message: 'WhatsApp preview',
      directions: 'Directions preview',
    }[kind];
    $('#contact-explanation').textContent = c.contactNotes[kind];
    $('.contact-preview-value').textContent =
      kind === 'directions' ? current.area || 'Your address here' : 'Your number here';
    open(contactDialog, trigger);
  }
  document.querySelectorAll('[data-call], [data-whatsapp]').forEach((link) =>
    link.addEventListener('click', (event) => {
      if (current.phone) return;
      event.preventDefault();
      preview(link.hasAttribute('data-call') ? 'call' : 'message', link);
    }),
  );
  $('[data-directions]').addEventListener('click', (event) =>
    preview('directions', event.currentTarget),
  );

  function restore() {
    cancelOffer();
    dialogs.forEach((dialog) => dialog.open && dialog.close());
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
