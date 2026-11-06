import {
  bookingDate,
  bookingSteps,
  bookingTimes,
  treatments,
} from '../content/mobile-app-templates';

function initialiseBooking(root: HTMLElement) {
  let step = 1;
  let service = 0;
  let time = bookingTimes[1];
  let saved: { service: number; time: string } | undefined;
  let showingReceipt = false;
  let moved = false;
  const phones = root.querySelectorAll<HTMLElement>('[data-platform]');
  const status = root.querySelector<HTMLElement>('[data-booking-status]')!;

  function render() {
    root.querySelectorAll<HTMLButtonElement>('[data-step]').forEach((button) => {
      if (Number(button.dataset.step) === step) button.setAttribute('aria-current', 'step');
      else button.removeAttribute('aria-current');
    });
    for (const phone of phones) {
      phone.querySelectorAll<HTMLElement>('[data-panel]').forEach((panel) => {
        panel.hidden = Number(panel.dataset.panel) !== step;
      });
      phone.querySelector<HTMLElement>('.time-choices')!.hidden = step !== 1 && step !== 3;
      phone.querySelectorAll<HTMLButtonElement>('[data-time]').forEach((button) => {
        button.setAttribute('aria-pressed', String(button.dataset.time === time));
        button.disabled = step === 3 && button.dataset.time === saved?.time;
      });
      phone
        .querySelectorAll<HTMLButtonElement>('[data-service]')
        .forEach((button) =>
          button.setAttribute('aria-pressed', String(Number(button.dataset.service) === service)),
        );
      const treatment = treatments[service];
      phone.querySelector<HTMLElement>('[data-name]')!.textContent = treatment.name;
      phone.querySelector<HTMLElement>('[data-duration]')!.textContent = treatment.details;
      phone.querySelector<HTMLElement>('[data-appointment]')!.textContent =
        treatment.name + ' · ' + treatment.details;
      phone.querySelector<HTMLElement>('[data-review-time]')!.textContent = time;
      phone.querySelector<HTMLElement>('[data-current]')!.textContent = saved
        ? 'Currently booked: ' + saved.time + ' · ' + bookingDate
        : '';
      phone.querySelector<HTMLElement>('[data-review-title]')!.textContent = showingReceipt
        ? moved
          ? 'Appointment moved'
          : 'Booking confirmed'
        : 'Review booking';
      const next = phone.querySelector<HTMLButtonElement>('[data-next]')!;
      next.textContent =
        step === 3
          ? 'Save new time'
          : step === 2
            ? showingReceipt
              ? 'Reschedule'
              : 'Confirm booking'
            : 'Continue';
      next.disabled = step === 3 && time === saved?.time;
      phone.querySelector<HTMLButtonElement>('[data-back]')!.disabled = step === 0;
    }
  }

  function go(target: number, receipt = false) {
    if (target === 3) {
      saved ??= { service, time };
      service = saved.service;
      time = saved.time;
    }
    step = target;
    showingReceipt = receipt;
    render();
    status.textContent = receipt
      ? `${moved ? 'Appointment moved' : 'Booking confirmed'}: ${treatments[service].name}, ${time}.`
      : bookingSteps[step];
  }

  root.addEventListener('click', (event) => {
    const button = (event.target as Element).closest<HTMLButtonElement>('button');
    if (!button || button.disabled) return;
    const { show, step: chosenStep, service: chosenService, time: chosenTime } = button.dataset;
    if (show) {
      root.dataset.visiblePlatform = show;
      root
        .querySelectorAll<HTMLButtonElement>('[data-show]')
        .forEach((tab) => tab.setAttribute('aria-pressed', String(tab.dataset.show === show)));
    } else if (chosenStep !== undefined) {
      go(Number(chosenStep));
    } else if (chosenService !== undefined) {
      service = Number(chosenService);
      render();
    } else if (chosenTime !== undefined) {
      time = chosenTime;
      render();
    } else {
      if (button.hasAttribute('data-back')) {
        if (step === 3 && saved) {
          time = saved.time;
          go(2, true);
        } else go(Math.max(0, step - 1));
      } else if (button.hasAttribute('data-next')) {
        if (step === 2 && showingReceipt) go(3);
        else if (step === 2 || step === 3) {
          moved = step === 3;
          saved = { service, time };
          go(2, true);
        } else go(step + 1);
      }
      button
        .closest('[data-platform]')
        ?.querySelector<HTMLElement>('[data-panel]:not([hidden]) h3')
        ?.focus({ preventScroll: true });
    }
  });
  root.dataset.visiblePlatform = 'android';
  render();
}

document.querySelectorAll<HTMLElement>('[data-booking-demo]').forEach(initialiseBooking);
