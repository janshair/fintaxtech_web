import { mobileServices as services, mobileEstimateCopy as c } from '../content/mobile-estimate';
import {
  initialAnswers,
  normalize,
  questionError,
  visible,
  answerLabel,
  validateAnswers,
  type Answers,
} from '../lib/mobile-estimate/answers';
import type { Question, CalculationConfig } from '../lib/mobile-estimate/schema';
import type { MobileEstimate } from '../lib/mobile-estimate/types';
import { validateCustomer, cleanCustomer } from '../lib/branding-estimate/rules';
import type { EstimateCustomer } from '../lib/branding-estimate/types';
import { download } from '../lib/sharing';
import {
  issueDate,
  lineAmount,
  monthlyAmount,
  money,
  pendingMessages,
  maintenanceDescription,
} from '../lib/mobile-estimate/presentation';
const root = document.querySelector<HTMLElement>('[data-mobile-estimate]');
if (root) initialize(root);
function initialize(root: HTMLElement) {
  let answers: Answers = initialAnswers();
  let step = 0,
    busy = false,
    confirmed = false;
  let config: CalculationConfig | undefined;
  let estimate: MobileEstimate | undefined;
  let reference = '',
    issued = '';
  const customer: EstimateCustomer = { name: '', business: '', email: '', phone: '' };
  const host = root.querySelector<HTMLElement>('[data-estimate-form]')!;
  const el = <K extends keyof HTMLElementTagNameMap>(tag: K, text = '', className = '') => {
    const node = document.createElement(tag);
    node.textContent = text;
    node.className = className;
    return node;
  };
  const button = (label: string, action: () => void, primary = false) => {
    const b = el('button', label, primary ? 'button primary' : 'button');
    b.type = 'button';
    b.onclick = action;
    return b;
  };
  const focus = () => {
    const h = host.querySelector<HTMLElement>('h2')!;
    h.tabIndex = -1;
    h.focus();
  };
  const showError = (box: HTMLElement, message: string) => {
    box.textContent = message;
    box.tabIndex = -1;
    box.focus();
  };
  const errorBox = () => {
    const p = el('p', '', 'error');
    p.id = 'mobile-estimate-error';
    p.setAttribute('role', 'alert');
    return p;
  };
  const resetEstimate = () => {
    estimate = undefined;
    reference = '';
    issued = '';
    confirmed = false;
  };
  function input(
    label: string,
    id: string,
    value: string,
    update: (v: string) => void,
    type = 'text',
  ) {
    const wrap = el('label', '', 'field');
    wrap.append(el('span', label));
    const field = el('input');
    field.id = id;
    field.type = type;
    field.value = value;
    field.maxLength = type === 'email' ? 254 : type === 'tel' ? 32 : 150;
    field.oninput = () => update(field.value);
    field.setAttribute('aria-describedby', 'mobile-estimate-error');
    wrap.append(field);
    return { wrap, field };
  }
  function question(q: Question): HTMLElement {
    const fieldset = el('fieldset', '', 'mobile-question');
    fieldset.id = `mobile-question-${q.id}`;
    const legend = el('legend', q.label);
    fieldset.append(legend);
    if (q.help_text) fieldset.append(el('p', q.help_text));
    if (q.notice) fieldset.append(el('p', q.notice, 'notice'));
    fieldset.setAttribute('aria-describedby', 'mobile-estimate-error');
    if (q.type === 'textarea') {
      const area = el('textarea');
      area.value = String(answers[q.id] ?? '');
      area.maxLength = q.max_length!;
      area.setAttribute('aria-label', q.label);
      area.oninput = () => {
        answers[q.id] = area.value;
        resetEstimate();
      };
      fieldset.append(area);
      return fieldset;
    }
    const choices = el('div', '', 'choices');
    const suggestions =
      services.steps[step].suggestions?.by_app_type[String(answers.app_type)] ?? [];
    const rank = (id: string) =>
      suggestions.includes(id) ? suggestions.indexOf(id) : suggestions.length;
    const options = [...q.options!].sort((a, b) => rank(a.id) - rank(b.id));
    for (const option of options) {
      const label = el('label', '', 'choice');
      const field = el('input');
      field.type = q.type === 'multi_select' ? 'checkbox' : 'radio';
      field.name = q.id;
      field.value = option.id;
      field.checked = Array.isArray(answers[q.id])
        ? (answers[q.id] as string[]).includes(option.id)
        : answers[q.id] === option.id;
      const copy = el('span', '', 'mobile-option');
      copy.append(el('span', option.label));
      if (option.description) copy.append(el('small', option.description));
      field.setAttribute('aria-label', option.label);
      field.onchange = () => {
        const old = services.steps[step].questions
          .filter((q) => visible(q, answers))
          .map((q) => q.id)
          .join();
        answers[q.id] =
          q.type === 'multi_select'
            ? field.checked
              ? [...new Set([...(answers[q.id] as string[]), option.id])]
              : (answers[q.id] as string[]).filter((v) => v !== option.id)
            : option.id;
        answers = normalize(answers);
        resetEstimate();
        const current = services.steps[step].questions
          .filter((q) => visible(q, answers))
          .map((q) => q.id)
          .join();
        if (old !== current) {
          renderStep(false);
          host
            .querySelector<HTMLInputElement>(`input[name="${q.id}"][value="${option.id}"]`)
            ?.focus();
        }
      };
      label.append(field, copy);
      choices.append(label);
    }
    fieldset.append(choices);
    return fieldset;
  }
  function renderStep(moveFocus = true) {
    const section = services.steps[step];
    host.replaceChildren(el('h2', section.title));
    const form = el('form');
    form.noValidate = true;
    const progress = el('progress', '', 'quiz-progress');
    progress.value = step + 1;
    progress.max = 5;
    progress.setAttribute('aria-label', c.progress(step + 1));
    form.append(el('p', c.progress(step + 1)), progress);
    for (const q of section.questions) if (visible(q, answers)) form.append(question(q));
    const error = errorBox();
    form.append(error);
    const actions = el('div', '', 'actions quiz-actions');
    if (step > 0)
      actions.append(
        button(c.back, () => {
          step--;
          renderStep();
        }),
      );
    const next = el('button', c.next, 'button primary');
    next.type = 'submit';
    actions.append(next);
    form.append(actions);
    form.onsubmit = (event) => {
      event.preventDefault();
      for (const q of section.questions) {
        const message = questionError(q, answers);
        if (message) {
          host.querySelector(`#mobile-question-${q.id}`)?.setAttribute('aria-invalid', 'true');
          showError(error, `${q.label} ${message}`);
          return;
        }
      }
      step++;
      if (step === 5) renderReview();
      else renderStep();
    };
    host.append(form);
    if (moveFocus) focus();
  }
  function renderReview() {
    host.replaceChildren(el('h2', c.review), el('p', c.reviewIntro));
    services.steps.forEach((section, i) => {
      const block = el('section', '', 'estimate-review-row');
      block.append(el('h3', section.title));
      const list = el('dl');
      for (const q of section.questions)
        list.append(el('dt', q.label), el('dd', answerLabel(q, answers)));
      const edit = button(`${c.edit}: ${section.title}`, () => {
        resetEstimate();
        step = i;
        renderStep();
      });
      block.append(list, edit);
      host.append(block);
    });
    for (const inclusion of services.automatic_inclusions)
      host.append(el('p', inclusion.customer_label));
    const form = el('form');
    form.noValidate = true;
    form.append(el('h3', c.details));
    for (const [key, label, type, autocomplete] of [
      ['name', c.name, 'text', 'name'],
      ['business', c.business, 'text', 'organization'],
      ['email', c.email, 'email', 'email'],
      ['phone', c.phone, 'tel', 'tel'],
    ] as const) {
      const { wrap, field } = input(
        label,
        `mobile-${key}`,
        customer[key],
        (v) => {
          customer[key] = v;
        },
        type,
      );
      field.autocomplete = autocomplete;
      field.required = ['name', 'email'].includes(key);
      form.append(wrap);
    }
    const consent = el('label', '', 'choice estimate-consent');
    const check = el('input');
    check.type = 'checkbox';
    check.checked = confirmed;
    check.onchange = () => {
      confirmed = check.checked;
    };
    consent.append(check, el('span', c.consent));
    form.append(consent);
    const error = errorBox();
    form.append(error);
    const actions = el('div', '', 'actions quiz-actions');
    actions.append(
      button(services.final_review.actions.find((a) => a.id === 'edit')!.label, () => {
        resetEstimate();
        step = 0;
        renderStep();
      }),
    );
    const submit = el(
      'button',
      services.final_review.actions.find((a) => a.id === 'confirm')!.label,
      'button primary',
    );
    submit.type = 'submit';
    actions.append(submit);
    form.append(actions);
    host.append(form);
    focus();
    form.onsubmit = async (event) => {
      event.preventDefault();
      if (busy) return;
      if (validateCustomer(customer)) {
        showError(error, c.errorContact);
        return;
      }
      if (!confirmed) {
        showError(error, c.errorConsent);
        return;
      }
      try {
        validateAnswers(answers);
      } catch {
        showError(error, c.errorInvalid);
        return;
      }
      busy = true;
      host.setAttribute('aria-busy', 'true');
      host.querySelectorAll<HTMLInputElement | HTMLButtonElement>('input,button').forEach((b) => {
        b.disabled = true;
      });
      submit.textContent = c.busy;
      try {
        const [{ calculateMobileEstimate }, { calculationConfigSchema }] = await Promise.all([
          import('../lib/mobile-estimate/calculate'),
          import('../lib/mobile-estimate/schema'),
        ]);
        if (!config) {
          const response = await fetch('/estimate/mobile/catalogue.json');
          if (!response.ok) throw new Error('Configuration unavailable');
          config = calculationConfigSchema.parse(await response.json());
        }
        estimate = calculateMobileEstimate(answers, config);
        reference = `FTT-MA-${crypto.randomUUID().toUpperCase()}`;
        issued = new Date().toISOString();
        renderEstimate();
      } catch {
        host.querySelectorAll<HTMLInputElement | HTMLButtonElement>('input,button').forEach((b) => {
          b.disabled = false;
        });
        submit.textContent = services.final_review.actions.find((a) => a.id === 'confirm')!.label;
        showError(error, c.errorGenerate);
      } finally {
        busy = false;
        host.removeAttribute('aria-busy');
      }
    };
  }
  function renderEstimate() {
    const e = estimate!;
    host.replaceChildren(
      el('h2', c.resultTitle),
      el('p', c.nonBinding, 'notice'),
      el('p', `${c.reference}: ${reference}`),
      el('p', `${c.issued}: ${issueDate(issued)}`),
      el('p', c.status[e.state]),
    );
    for (const [type, heading] of [
      ['one_time', c.oneTime],
      ['monthly', c.monthly],
    ] as const) {
      const group = el('section', '', 'estimate-summary');
      group.append(el('h3', heading));
      for (const line of e.lines.filter((line) => line.charge_type === type)) {
        const row = el('div', '', 'estimate-line');
        row.dataset.line = line.id;
        row.append(el('p', line.label), el('p', lineAmount(line)));
        group.append(row);
      }
      group.append(
        el('p', type === 'one_time' ? c.subtotal : c.monthlySubtotal),
        el(
          'p',
          type === 'one_time' ? money(e.one_time_subtotal_pence) : monthlyAmount(e),
          'estimate-total',
        ),
      );
      if (type === 'monthly') group.append(el('p', maintenanceDescription(e)));
      host.append(group);
    }
    if (e.has_pending_scope) {
      host.append(el('h3', c.pendingTitle), el('p', c.pendingNote));
      const list = el('ul');
      pendingMessages(e).forEach((message) => list.append(el('li', message)));
      host.append(list);
    }
    if (e.is_lower_bound) host.append(el('p', c.lowerBound, 'notice'));
    host.append(el('h3', c.vat), el('p', e.tax.message));
    if (e.tax.status === 'calculated')
      for (const [label, amount] of [
        [c.oneTax, e.tax.one_time_vat_pence],
        [c.monthlyTax, e.tax.monthly_vat_pence],
        [c.oneIncluding, e.tax.one_time_including_vat_pence],
        [c.monthlyIncluding, e.tax.monthly_including_vat_pence],
      ] as const)
        host.append(el('p', `${label}: ${money(amount!)}`));
    for (const [label, messages] of [
      [c.assumptions, e.assumptions],
      [c.exclusions, e.exclusions],
    ] as const) {
      host.append(el('h3', label));
      const list = el('ul');
      messages.forEach((message) => list.append(el('li', message)));
      host.append(list);
    }
    host.append(el('p', services.delivery.customer_status_label));
    if (['apple', 'google', 'both'].includes(String(answers.publishing)))
      host.append(el('p', services.steps[4].questions[0].notice!, 'notice'));
    const error = errorBox();
    const actions = el('div', '', 'actions');
    const save = button(
      c.download,
      async () => {
        save.disabled = true;
        error.textContent = '';
        try {
          const { createMobileEstimatePDF } = await import('../lib/mobile-estimate/pdf');
          const blob = await createMobileEstimatePDF(e, cleanCustomer(customer), reference, issued);
          download(blob, `${c.pdfFilename}-${reference}.pdf`);
        } catch {
          showError(error, c.downloadError);
        } finally {
          save.disabled = false;
        }
      },
      true,
    );
    actions.append(
      save,
      button(services.final_review.actions.find((a) => a.id === 'edit')!.label, () => {
        resetEstimate();
        step = 0;
        renderStep();
      }),
    );
    host.append(error, actions);
    focus();
  }
  const begin = root.querySelector<HTMLButtonElement>('[data-estimate-begin]')!;
  begin.hidden = false;
  begin.onclick = () => {
    root.querySelector<HTMLElement>('[data-estimate-intro]')!.hidden = true;
    host.hidden = false;
    renderStep();
  };
}
