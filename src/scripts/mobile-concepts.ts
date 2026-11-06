function initialise(root: HTMLElement) {
  const id = root.dataset.concept;
  const actions: string[] = JSON.parse(root.dataset.actions!);
  const phones = root.querySelectorAll<HTMLElement>('[data-platform]');
  const status = root.querySelector<HTMLElement>('[data-status]')!;
  const checks = new Set<string>();
  const defaults = { condition: 'Routine review', reward: 'Flat white', answer: '' };
  const values: Record<string, string> = { ...defaults };
  let step = 0;
  let unlocked = 0;
  let feedback = '';

  function ready() {
    if (id === 'field' && step === 1) return checks.has('asset') && checks.has('gauge');
    if (id === 'learning' && step === 1) return Boolean(values.answer);
    if (id === 'learning' && step === 3) return checks.has('observed');
    return true;
  }

  function render() {
    root.querySelectorAll<HTMLButtonElement>('[data-step]').forEach((button) => {
      const index = Number(button.dataset.step);
      button.disabled = index > unlocked || step === 4;
      if (index === Math.min(step, 3)) button.setAttribute('aria-current', 'step');
      else button.removeAttribute('aria-current');
    });
    for (const phone of phones) {
      phone
        .querySelectorAll<HTMLElement>('[data-panel]')
        .forEach((p) => (p.hidden = Number(p.dataset.panel) !== step));
      phone
        .querySelectorAll<HTMLInputElement>('[data-check]')
        .forEach((input) => (input.checked = checks.has(input.dataset.check!)));
      phone
        .querySelectorAll<HTMLSelectElement>('[data-choice]')
        .forEach((select) => (select.value = values[select.dataset.choice!]));
      phone
        .querySelectorAll<HTMLElement>('[data-value]')
        .forEach((el) => (el.textContent = values[el.dataset.value!]));
      const hint = phone.querySelector<HTMLElement>('[data-hint]');
      if (hint) hint.textContent = feedback;
      const next = phone.querySelector<HTMLButtonElement>('[data-next]')!;
      next.textContent = actions[step] ?? 'Start again';
      next.disabled = !ready();
      phone.querySelector<HTMLButtonElement>('[data-back]')!.disabled = step === 0 || step === 4;
    }
  }

  root.addEventListener('change', (event) => {
    const control = event.target;
    if (control instanceof HTMLSelectElement && control.dataset.choice)
      values[control.dataset.choice] = control.value;
    else if (control instanceof HTMLInputElement && control.dataset.check) {
      if (control.checked) checks.add(control.dataset.check);
      else checks.delete(control.dataset.check);
    } else return;
    // Revising an earlier answer requires reviewing subsequent steps again.
    unlocked = step;
    if (id === 'learning' && step === 1) checks.delete('observed');
    feedback = '';
    render();
  });
  root.addEventListener('click', (event) => {
    const button = (event.target as Element).closest<HTMLButtonElement>('button');
    if (!button || button.disabled) return;
    if (button.dataset.show) {
      root.dataset.visiblePlatform = button.dataset.show;
      root
        .querySelectorAll<HTMLButtonElement>('[data-show]')
        .forEach((tab) => tab.setAttribute('aria-pressed', String(tab === button)));
      return;
    }
    if (button.dataset.step !== undefined) step = Number(button.dataset.step);
    else if (button.hasAttribute('data-back')) step--;
    else if (button.hasAttribute('data-next')) {
      if (step === 4) {
        step = 0;
        unlocked = 0;
        checks.clear();
        Object.assign(values, defaults);
      } else if (id === 'learning' && step === 1 && values.answer !== 'even') {
        feedback = 'Try again. Look for an even film across the plate.';
        status.textContent = feedback;
        render();
        return;
      } else {
        step++;
        unlocked = Math.max(step, unlocked);
      }
    } else return;
    feedback = '';
    render();
    status.textContent = phones[0].querySelector<HTMLElement>(
      '[data-panel]:not([hidden]) h3',
    )!.textContent;
    button
      .closest('[data-platform]')
      ?.querySelector<HTMLElement>('[data-panel]:not([hidden]) h3')
      ?.focus({ preventScroll: true });
  });
  root.dataset.visiblePlatform = 'android';
  render();
}
document.querySelectorAll<HTMLElement>('[data-concept]').forEach(initialise);
