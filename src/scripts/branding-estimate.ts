import { brandingEstimateCopy as c } from '../content/branding-estimate';
import {
  OTHER,
  answerLabels,
  selected,
  visibleQuestions,
  validateEstimateQuestion,
  validateEstimate,
  validateCustomer,
  cleanCustomer,
} from '../lib/branding-estimate/rules';
import type {
  EstimateAnswers,
  EstimateCustomer,
  EstimateDocument,
  EstimateQuestion,
} from '../lib/branding-estimate/types';
import { download } from '../lib/sharing';

const root = document.querySelector<HTMLElement>('[data-branding-estimate]');
if (root) init(root);
function init(root: HTMLElement) {
  const host = root.querySelector<HTMLElement>('[data-estimate-form]')!;
  const begin = root.querySelector<HTMLButtonElement>('[data-estimate-begin]')!;
  const answers: EstimateAnswers = {};
  const customer: EstimateCustomer = { name: '', business: '', email: '', phone: '' };
  let step = 0;
  let consent = false;
  let busy = false;
  let file: Blob | undefined;
  let result: EstimateDocument | undefined;
  const el = <K extends keyof HTMLElementTagNameMap>(tag: K, text = '', className = '') => {
    const node = document.createElement(tag);
    node.textContent = text;
    node.className = className;
    return node;
  };
  const button = (label: string, action: () => void, primary = false) => {
    const node = el('button', label, primary ? 'button primary' : 'button');
    node.type = 'button';
    node.addEventListener('click', action);
    return node;
  };
  const focusHeading = () => {
    const heading = host.querySelector<HTMLElement>('h2');
    heading?.setAttribute('tabindex', '-1');
    heading?.focus();
  };
  const errorBox = () => {
    const box = el('p', '', 'error');
    box.id = 'estimate-error';
    box.setAttribute('role', 'alert');
    return box;
  };
  const showError = (box: HTMLElement, message: string) => {
    box.textContent = message;
    box.tabIndex = -1;
    box.focus();
  };
  function inputField(
    label: string,
    id: string,
    value: string,
    update: (value: string) => void,
    type = 'text',
    max = 300,
  ) {
    const wrap = el('label', '', 'field');
    wrap.htmlFor = id;
    wrap.append(el('span', label));
    const input = el('input');
    input.type = type;
    input.id = id;
    input.value = value;
    input.maxLength = max;
    input.autocomplete = 'off';
    input.setAttribute('aria-describedby', 'estimate-error');
    input.addEventListener('input', () => {
      update(input.value);
      input.removeAttribute('aria-invalid');
    });
    wrap.append(input);
    return { wrap, input };
  }
  function renderOther(q: EstimateQuestion, wrap: HTMLElement, focusIndex?: number) {
    wrap.replaceChildren();
    if (!selected(answers, q.id).includes(OTHER)) return;
    const a = answers[q.id];
    if (!a.other.length) a.other.push('');
    a.other.forEach((value, i) => {
      const row = el('div', '', 'estimate-custom-row');
      const { wrap: field, input } = inputField(
        `${q.otherOption.fieldLabel} ${i + 1}`,
        `${q.id}-other-${i}`,
        value,
        (v) => {
          a.other[i] = v;
        },
      );
      input.placeholder = q.otherOption.placeholder ?? '';
      input.required = true;
      row.append(field);
      if (q.otherOption.allowRemove)
        row.append(
          button(`${c.remove} ${i + 1}`, () => {
            a.other.splice(i, 1);
            renderOther(q, wrap, Math.min(i, Math.max(0, a.other.length - 1)));
          }),
        );
      wrap.append(row);
    });
    const add = button(q.otherOption.addButtonLabel!, () => {
      a.other.push('');
      renderOther(q, wrap, a.other.length - 1);
    });
    if (q.otherOption.maximumEntries != null)
      add.disabled = a.other.length >= q.otherOption.maximumEntries;
    wrap.append(add);
    if (focusIndex !== undefined)
      wrap.querySelector<HTMLInputElement>(`#${q.id}-other-${focusIndex}`)?.focus();
  }
  function renderQuestion(q: EstimateQuestion, total: number) {
    const form = el('form');
    form.noValidate = true;
    const progressText = el('p', c.progress(step + 1, total + 1));
    const progress = el('progress', '', 'quiz-progress');
    progress.max = total + 1;
    progress.value = step + 1;
    progress.setAttribute('aria-label', progressText.textContent!);
    const fieldset = el('fieldset');
    fieldset.dataset.section = q.sectionId;
    const legend = el('legend');
    legend.append(el('h2', q.label));
    const help = el('p', q.helpText);
    help.id = 'estimate-help';
    fieldset.setAttribute('aria-describedby', 'estimate-help estimate-error');
    fieldset.append(legend, help);
    const choices = el('div', '', 'choices');
    const otherWrap = el('div', '', 'estimate-other');
    const a = (answers[q.id] ??= { selected: [], other: [] });
    const options = [
      ...q.options.map(({ id, label }) => ({ id, label })),
      ...(q.otherOption.enabled ? [{ id: OTHER, label: q.otherOption.label! }] : []),
    ];
    options.forEach((option) => {
      const label = el('label', '', 'choice');
      const input = el('input');
      input.type = q.answerType === 'single_select' ? 'radio' : 'checkbox';
      input.name = q.id;
      input.value = option.id;
      input.checked = a.selected.includes(option.id);
      input.addEventListener('change', () => {
        if (q.answerType === 'single_select') a.selected = [option.id];
        else
          a.selected = input.checked
            ? [...new Set([...a.selected, option.id])]
            : a.selected.filter((id) => id !== option.id);
        if (option.id === OTHER) {
          if (!input.checked && q.otherOption.clearOnDeselect) a.other = [];
          renderOther(q, otherWrap);
        }
        const count = visibleQuestions(answers).length + 1;
        progress.max = count;
        progress.setAttribute('aria-label', c.progress(step + 1, count));
        progressText.textContent = c.progress(step + 1, count);
      });
      label.append(input, el('span', option.label));
      choices.append(label);
    });
    fieldset.append(choices, otherWrap);
    renderOther(q, otherWrap);
    const error = errorBox();
    const actions = el('div', '', 'actions quiz-actions');
    if (step > 0)
      actions.append(
        button(c.previous, () => {
          step--;
          render();
        }),
      );
    const next = el('button', c.next, 'button primary');
    next.type = 'submit';
    actions.append(next);
    form.append(progressText, progress, fieldset, error, actions);
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      const invalid = validateEstimateQuestion(q, answers);
      if (invalid) {
        fieldset.setAttribute('aria-invalid', 'true');
        showError(error, invalid);
        return;
      }
      step++;
      render();
    });
    host.append(form);
  }
  function renderReview() {
    host.append(el('h2', c.review), el('p', c.reviewHelp));
    const progressText = c.progress(
      visibleQuestions(answers).length + 1,
      visibleQuestions(answers).length + 1,
    );
    const progress = el('progress', '', 'quiz-progress');
    progress.max = 1;
    progress.value = 1;
    progress.setAttribute('aria-label', progressText);
    host.append(el('p', progressText), progress);
    const questions = visibleQuestions(answers);
    questions.forEach((q, index) => {
      const section = el('section', '', 'estimate-review-row');
      section.append(el('h3', q.label));
      const list = el('ul', '', 'estimate-items');
      answerLabels(q, answers).forEach((label) => list.append(el('li', label)));
      const edit = button(c.edit, () => {
        step = index;
        result = undefined;
        file = undefined;
        render();
      });
      edit.setAttribute('aria-label', `${c.edit}: ${q.label}`);
      section.append(list, edit);
      host.append(section);
    });
    const form = el('form', '', 'estimate-contact');
    form.noValidate = true;
    form.append(el('h3', c.customerHeading));
    for (const key of Object.keys(c.customer) as (keyof EstimateCustomer)[]) {
      const { wrap, input } = inputField(
        c.customer[key],
        `estimate-${key}`,
        customer[key],
        (v) => {
          customer[key] = v;
        },
        key === 'email' ? 'email' : key === 'phone' ? 'tel' : 'text',
        key === 'email' ? 254 : key === 'phone' ? 32 : 150,
      );
      input.autocomplete = (
        { name: 'name', business: 'organization', email: 'email', phone: 'tel' } as const
      )[key];
      input.required = key === 'name' || key === 'email';
      form.append(wrap);
    }
    const acknowledgement = el('label', '', 'choice estimate-consent');
    const check = el('input');
    check.type = 'checkbox';
    check.checked = consent;
    check.required = true;
    check.addEventListener('change', () => {
      consent = check.checked;
    });
    acknowledgement.append(check, el('span', c.consent));
    form.append(acknowledgement);
    const error = errorBox();
    const actions = el('div', '', 'actions quiz-actions');
    actions.append(
      button(c.previous, () => {
        step = questions.length - 1;
        render();
      }),
    );
    const submit = el('button', c.submit, 'button primary');
    submit.type = 'submit';
    actions.append(submit);
    form.append(error, actions);
    host.append(form);
    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      if (busy) return;
      const invalid = validateEstimate(answers);
      if (invalid) {
        step = questions.findIndex((q) => q.id === invalid.id);
        render();
        return;
      }
      const contactError = validateCustomer(customer);
      if (contactError || !consent) {
        showError(error, contactError ?? c.errorConsent);
        return;
      }
      busy = true;
      form.setAttribute('aria-busy', 'true');
      form.querySelectorAll<HTMLInputElement | HTMLButtonElement>('input, button').forEach((n) => {
        n.disabled = true;
      });
      host.querySelectorAll<HTMLButtonElement>('button').forEach((n) => {
        n.disabled = true;
      });
      submit.textContent = c.busy;
      try {
        // Pricing and PDF code are loaded only after a valid, explicit submission.
        const { calculateEstimate, money } = await import('../lib/branding-estimate/calculate');
        const { createEstimatePDF } = await import('../lib/branding-estimate/pdf');
        const document: EstimateDocument = {
          estimate: calculateEstimate(structuredClone(answers)),
          customer: cleanCustomer(customer),
          reference: `FTT-BR-${crypto.randomUUID().toUpperCase()}`,
          issued: new Date().toISOString(),
        };
        const pdf = await createEstimatePDF(document);
        result = document;
        file = pdf;
        renderComplete(money);
      } catch {
        form.removeAttribute('aria-busy');
        host
          .querySelectorAll<HTMLInputElement | HTMLButtonElement>('input, button')
          .forEach((n) => {
            n.disabled = false;
          });
        submit.textContent = c.submit;
        showError(error, c.errorGenerate);
      } finally {
        busy = false;
      }
    });
  }
  function renderComplete(money: (amount: number) => string) {
    host.replaceChildren(
      el('h2', c.thanks),
      el('p', c.ready),
      el('p', `${c.reference}: ${result!.reference}`),
    );
    const e = result!.estimate;
    if (e.reviewReasons.length) {
      host.append(
        el('h3', c.manual),
        el('p', e.incomplete ? c.incomplete : c.reviewNote, 'notice'),
      );
      const reasons = el('ul');
      e.reviewReasons.forEach((reason) => reasons.append(el('li', reason)));
      host.append(reasons);
    }
    const summary = el('dl', '', 'estimate-summary');
    for (const line of e.lines) {
      summary.append(
        el(
          'dt',
          `${line.name}${line.deliverables.length ? ` — ${c.quantity(line.quantity)}` : ''}`,
        ),
        el('dd', line.amountMinor === null ? c.pending : money(line.amountMinor)),
      );
    }
    summary.append(
      el('dt', e.incomplete ? c.knownSubtotal : c.subtotal),
      el('dd', money(e.subtotalMinor)),
      el('dt', c.vat(e.vatRatePercent)),
      el('dd', money(e.vatMinor)),
      el('dt', e.incomplete ? c.knownTotal : c.total),
      el('dd', money(e.knownTotalMinor)),
    );
    host.append(summary, el('p', c.indicative));
    const actions = el('div', '', 'actions');
    actions.append(
      button(
        c.download,
        () => {
          download(file!, `${result!.reference}.pdf`);
        },
        true,
      ),
      button(c.revise, () => {
        result = undefined;
        file = undefined;
        step = visibleQuestions(answers).length;
        render();
      }),
    );
    host.append(actions);
    focusHeading();
  }
  function render() {
    host.replaceChildren();
    const questions = visibleQuestions(answers);
    if (step < questions.length) renderQuestion(questions[step], questions.length);
    else renderReview();
    focusHeading();
  }
  begin.hidden = false;
  begin.addEventListener('click', () => {
    root.querySelector<HTMLElement>('[data-estimate-intro]')!.hidden = true;
    host.hidden = false;
    render();
  });
}
