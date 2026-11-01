(() => {
  'use strict';
  const root = document.documentElement;
  const copy = JSON.parse(document.querySelector('#barber-copy').textContent);
  const defaultName = copy.defaultName;
  const nameDialog = document.querySelector('#name-dialog');
  const bookingDialog = document.querySelector('#booking-dialog');
  const nameInput = document.querySelector('#business-name');
  const bookingService = document.querySelector('#booking-service');
  const announcement = document.querySelector('#announcement');
  const params = new URL(window.location.href).searchParams;
  // All URL text is bounded and rendered as text, never parsed as HTML.
  const clean = value => Array.from((value || '').trim().replace(/\s+/gu, ' ')).slice(0, 100).join('');
  let businessName = defaultName;
  let lastTrigger;
  let autoShown = params.has('name');
  let autoTimer;
  let scrollIntent = false;
  function armScroll(event) {
    if (event.type !== 'keydown' || ['ArrowDown', 'PageDown', 'End', ' '].includes(event.key)) scrollIntent = true;
  }
  function onFirstScroll() { if (scrollIntent) offerName(); }

  function stopAutomaticPrompt() {
    autoShown = true;
    window.clearTimeout(autoTimer);
    window.removeEventListener('scroll', onFirstScroll);
    for (const event of ['wheel', 'touchmove', 'pointerdown', 'keydown']) window.removeEventListener(event, armScroll);
  }
  function updateShareURL(name) {
    const url = new URL(window.location.href);
    if (name) url.searchParams.set('name', name);
    else url.searchParams.delete('name');
    window.history.replaceState(window.history.state, '', url);
  }
  function applyName(value) {
    const name = clean(value);
    businessName = name || defaultName;
    document.querySelectorAll('[data-business]').forEach(el => { el.textContent = businessName; });
    const words = name.match(/[\p{L}\p{N}]+(?:['’][\p{L}\p{N}]+)*/gu) || [];
    const initials = words.slice(0, 2).map(word => Array.from(word.toUpperCase())[0]).join(' / ');
    document.querySelectorAll('[data-monogram]').forEach(el => { el.textContent = name && initials ? initials : 'B / S'; });
    document.title = businessName + copy.client.titleSuffix;
    document.querySelectorAll('[data-personalise]').forEach(button => {
      button.firstChild.textContent = name ? copy.client.changeName : copy.client.tryName;
    });
    announcement.textContent = copy.client.updated + businessName + '.';
    if (briefReady) updateBriefLinks();
  }
  // The template brief opens with this preview's values already filled in.
  let briefReady = false;
  function updateBriefLinks() {
    const url = new URL(copy.briefRoute, window.location.origin);
    if (businessName !== defaultName) url.searchParams.set('name', businessName);
    if (area) url.searchParams.set('area', area);
    // Phone characters only; the brief applies its own UK phone check.
    const briefPhone = clean(params.get('phone'));
    if (/^\+?[\d ()-]{6,20}$/.test(briefPhone)) url.searchParams.set('phone', briefPhone);
    const ref = (params.get('ref') || '').trim();
    if (/^[A-Za-z0-9_-]{1,32}$/.test(ref)) url.searchParams.set('ref', ref);
    document.querySelectorAll('[data-brief-link]').forEach(el => { el.href = url.pathname + url.search; });
  }
  applyName(params.get('name'));
  const area = clean(params.get('area'));
  document.querySelectorAll('[data-area]').forEach(el => { el.textContent = area || copy.addressPlaceholder; });
  const heroArea = document.querySelector('[data-hero-area]');
  if (area) { heroArea.textContent = copy.heroSeparator + area; heroArea.hidden = false; }
  const phone = clean(params.get('phone')).replace(/[ ()-]/g, '');
  // International digits only: a query cannot inject a URL scheme into contact links.
  const validPhone = /^\+?[1-9]\d{6,14}$/.test(phone);
  if (validPhone) {
    const digits = phone.replace(/^\+/, '');
    document.querySelectorAll('[data-call]').forEach(el => { el.href = `tel:+${digits}`; });
    document.querySelectorAll('[data-whatsapp]').forEach(el => {
      el.href = `https://wa.me/${digits}`;
      el.target = '_blank'; el.rel = 'noopener noreferrer';
    });
    // Display grouping only; validated contact URLs above remain untouched.
    document.querySelector('[data-phone-text]').textContent = /^44\d{10}$/.test(digits)
      ? '+44 ' + digits.slice(2, 6) + ' ' + digits.slice(6)
      : '+' + digits;
  }
  briefReady = true;
  updateBriefLinks();
  if (area) document.querySelectorAll('[data-directions]').forEach(el => {
    el.href = 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(area);
    el.target = '_blank'; el.rel = 'noopener noreferrer';
  });

  window.addEventListener('pageshow', event => {
    if (!event.persisted) nameInput.value = '';
  });
  function closeMenu() {
    document.querySelector('#navigation').classList.remove('is-open');
    document.querySelector('.menu-toggle').setAttribute('aria-expanded', 'false');
  }
  function openDialog(dialog, trigger) {
    stopAutomaticPrompt();
    lastTrigger = trigger || document.activeElement;
    closeMenu();
    dialog.showModal();
    document.body.classList.add('dialog-open');
  }
  function offerName() {
    if (autoShown) return;
    openDialog(nameDialog);
    nameInput.focus();
  }
  document.querySelectorAll('[data-personalise]').forEach(button => {
    button.addEventListener('click', () => {
      nameInput.value = businessName === defaultName ? '' : businessName;
      openDialog(nameDialog, button);
      nameInput.focus();
    });
  });
  document.querySelector('#name-form').addEventListener('submit', event => {
    event.preventDefault();
    const name = clean(nameInput.value);
    if (!name) {
      nameInput.setCustomValidity(copy.client.invalidName);
      nameInput.reportValidity();
      return;
    }
    applyName(name);
    updateShareURL(name);
    nameDialog.close();
    window.scrollTo({ top: 0, behavior: 'instant' });
  });
  nameInput.addEventListener('input', () => nameInput.setCustomValidity(''));
  document.querySelector('#browse-default').addEventListener('click', () => {
    applyName('');
    updateShareURL('');
    nameDialog.close();
  });
  [nameDialog, bookingDialog].forEach(dialog => {
    dialog.querySelector('[data-close]').addEventListener('click', () => dialog.close());
    dialog.addEventListener('click', event => {
      if (event.target !== dialog) return;
      const box = dialog.getBoundingClientRect();
      if (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) dialog.close();
    });
    dialog.addEventListener('close', () => {
      document.body.classList.remove('dialog-open');
      if (lastTrigger instanceof HTMLElement) lastTrigger.focus({ preventScroll: true });
    });
  });

  const bookingForm = document.querySelector('#booking-form');
  const slotsForm = document.querySelector('#booking-slots');
  const confirmation = document.querySelector('#booking-confirmation');
  function bookingStep(step) {
    [bookingForm, slotsForm, confirmation].forEach((panel, index) => { panel.hidden = index !== step; });
    (step === 0 ? bookingService : [slotsForm, confirmation][step - 1].querySelector('h3')).focus();
  }
  function showBooking(trigger, service) {
    bookingService.value = service || copy.services[0].name;
    slotsForm.reset();
    openDialog(bookingDialog, trigger);
    bookingStep(0);
  }
  document.querySelectorAll('[data-book]').forEach(button => button.addEventListener('click', () => showBooking(button)));
  document.querySelectorAll('[data-service]').forEach(button => button.addEventListener('click', () => showBooking(button, button.dataset.service)));
  bookingForm.addEventListener('submit', event => { event.preventDefault(); bookingStep(1); });
  slotsForm.addEventListener('submit', event => {
    event.preventDefault();
    document.querySelector('#booking-summary').textContent = [bookingService.value, document.querySelector('#booking-day').value, document.querySelector('#booking-time').value].join(' · ');
    bookingStep(2);
  });
  document.querySelectorAll('[data-booking-back], [data-booking-restart]').forEach(button => button.addEventListener('click', () => bookingStep(0)));
  const menuToggle = document.querySelector('.menu-toggle');
  menuToggle.addEventListener('click', () => {
    const isOpen = document.querySelector('#navigation').classList.toggle('is-open');
    menuToggle.setAttribute('aria-expanded', String(isOpen));
  });
  document.querySelectorAll('#navigation a').forEach(link => link.addEventListener('click', closeMenu));
  document.addEventListener('keydown', event => { if (event.key === 'Escape') closeMenu(); });

  const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
  const ritual = document.querySelector('#ritual');
  const ritualStep = document.querySelector('#ritual-step');
  const ritualCopy = document.querySelector('#ritual-copy');
  const steps = copy.ritual;
  let currentStep = -1;
  let framePending = false;
  const clamp = value => Math.min(1, Math.max(0, value));
  function updateMotion() {
    framePending = false;
    if (motionPreference.matches) {
      root.style.setProperty('--ritual', '1');
      ritualStep.textContent = copy.client.ritualTitle;
      ritualCopy.textContent = copy.client.ritualSummary;
      currentStep = -1;
      return;
    }
    root.style.setProperty('--scroll', clamp(window.scrollY / 850).toFixed(4));
    const bounds = ritual.getBoundingClientRect();
    const progress = window.innerWidth < 768
      ? clamp((window.innerHeight - bounds.top) / (window.innerHeight + ritual.offsetHeight))
      : clamp(-bounds.top / Math.max(1, ritual.offsetHeight - window.innerHeight));
    root.style.setProperty('--ritual', progress.toFixed(4));
    const step = Math.min(2, Math.floor(progress * 3));
    if (step !== currentStep) {
      ritualStep.textContent = steps[step][0];
      ritualCopy.textContent = steps[step][1];
      currentStep = step;
    }
  }
  function requestMotionFrame() {
    if (framePending) return;
    framePending = true;
    window.requestAnimationFrame(updateMotion);
  }
  window.addEventListener('scroll', requestMotionFrame, { passive: true });
  window.addEventListener('resize', requestMotionFrame);
  motionPreference.addEventListener('change', requestMotionFrame);
  updateMotion();

  if ('IntersectionObserver' in window) {
    root.classList.add('has-js');
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) { entry.target.classList.add('is-visible'); observer.unobserve(entry.target); }
      });
    }, { threshold: 0.08 });
    document.querySelectorAll('.reveal').forEach(element => observer.observe(element));
  }

  // Per-document memory only. No cookies, storage, tracking or booking requests.
  if (!autoShown) {
    autoTimer = window.setTimeout(offerName, 5000);
    // Do not treat initial fragment positioning as a visitor's first scroll.
    for (const event of ['wheel', 'touchmove', 'pointerdown', 'keydown']) window.addEventListener(event, armScroll, { passive: true });
    window.addEventListener('scroll', onFirstScroll, { passive: true });
  }
})();
