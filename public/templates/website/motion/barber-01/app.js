(() => {
  'use strict';
  const root = document.documentElement;
  const defaultName = 'The Brass Standard';
  const nameDialog = document.querySelector('#name-dialog');
  const bookingDialog = document.querySelector('#booking-dialog');
  const nameInput = document.querySelector('#business-name');
  const bookingService = document.querySelector('#booking-service');
  const bookingResult = document.querySelector('#booking-result');
  const announcement = document.querySelector('#announcement');
  let businessName = defaultName;
  let lastTrigger;

  // Browsers may restore form fields on reload even without application storage.
  // A fresh document starts a fresh preview; a back/forward memory snapshot may resume.
  window.addEventListener('pageshow', event => {
    if (!event.persisted) nameInput.value = '';
  });

  function applyName(name) {
    businessName = name;
    document.querySelectorAll('[data-business]').forEach(el => { el.textContent = name; });
    document.title = `${name} — Barber website demo by FinTaxTech`;
    document.querySelectorAll('[data-personalise]').forEach(button => {
      button.firstChild.textContent = name === defaultName ? 'Try your business name ' : 'Change business name ';
    });
    announcement.textContent = `Website preview updated for ${name}.`;
  }

  function closeMenu() {
    document.querySelector('#navigation').classList.remove('is-open');
    document.querySelector('.menu-toggle').setAttribute('aria-expanded', 'false');
  }

  function openDialog(dialog, trigger) {
    lastTrigger = trigger || document.querySelector('[data-personalise]');
    closeMenu();
    dialog.showModal();
    document.body.classList.add('dialog-open');
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
    const name = nameInput.value.trim().replace(/\s+/gu, ' ');
    if (!name) {
      nameInput.setCustomValidity('Please enter your business name.');
      nameInput.reportValidity();
      return;
    }
    applyName(name);
    nameDialog.close();
    window.scrollTo({ top: 0, behavior: 'instant' });
  });
  nameInput.addEventListener('input', () => nameInput.setCustomValidity(''));
  document.querySelector('#browse-default').addEventListener('click', () => {
    applyName(defaultName);
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
      lastTrigger?.focus({ preventScroll: true });
    });
  });

  function showBooking(trigger, service) {
    bookingResult.textContent = '';
    bookingService.value = service || 'The Signature Cut';
    openDialog(bookingDialog, trigger);
    bookingService.focus();
  }
  document.querySelectorAll('[data-book]').forEach(button => button.addEventListener('click', () => showBooking(button)));
  document.querySelectorAll('[data-service]').forEach(button => button.addEventListener('click', () => showBooking(button, button.dataset.service)));
  bookingService.addEventListener('change', () => { bookingResult.textContent = ''; });
  document.querySelector('#booking-form').addEventListener('submit', event => {
    event.preventDefault();
    bookingResult.textContent = `You selected ${bookingService.value}. On your finished website, this step could connect to your booking provider to choose a barber, date and time. No appointment has been made.`;
  });

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
  const steps = [
    ['01 / CONSULT', 'A moment to understand your style.'],
    ['02 / CRAFT', 'Precision, patience and a personal touch.'],
    ['03 / FINISH', 'The details that make it yours.']
  ];
  let currentStep = -1;
  let framePending = false;
  const clamp = value => Math.min(1, Math.max(0, value));
  function updateMotion() {
    framePending = false;
    if (motionPreference.matches) {
      root.style.setProperty('--ritual', '1');
      ritualStep.textContent = 'THE COMPLETE RITUAL';
      ritualCopy.textContent = 'Consult. Craft. Finish. All at your pace.';
      currentStep = -1;
      return;
    }
    root.style.setProperty('--scroll', clamp(window.scrollY / 850).toFixed(4));
    const bounds = ritual.getBoundingClientRect();
    const progress = clamp(-bounds.top / Math.max(1, ritual.offsetHeight - window.innerHeight));
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

  // Name input is deliberately kept in memory, never stored or sent to a server.
  openDialog(nameDialog);
  nameInput.focus();
})();
