import { aiEstimateCopy as c, questions, type Question } from '../content/ai-automation-estimate';
import { services, pricing } from '../lib/ai-automation-estimate/config';
import { initialAnswers, questionError, type Answers } from '../lib/ai-automation-estimate/answers';
import { calculate, type Estimate } from '../lib/ai-automation-estimate/calculate';
import {
  estimateText,
  money,
  supportDescription,
} from '../lib/ai-automation-estimate/presentation';
import { download } from '../lib/sharing';
const root = document.querySelector<HTMLElement>('[data-ai-automation-estimate]');
if (root) {
  let a = initialAnswers(),
    step = 0,
    result: Estimate | undefined;
  const host = root.querySelector<HTMLElement>('[data-estimate-form]')!;
  const el = <K extends keyof HTMLElementTagNameMap>(tag: K, text = '', cls = '') => {
    const n = document.createElement(tag);
    n.textContent = text;
    n.className = cls;
    return n;
  };
  const button = (label: string, action: () => void, primary = false) => {
    const b = el('button', label, primary ? 'button primary' : 'button');
    b.type = 'button';
    b.onclick = action;
    return b;
  };
  function choices(q: Question) {
    const fs = el('fieldset', '', 'mobile-question');
    fs.append(el('legend', q.label));
    if (q.help) fs.append(el('p', q.help));
    const value = a[q.id as keyof Answers];
    if (q.type === 'one' || q.type === 'many') {
      const group = el('div', '', 'choices');
      let opts = q.options ?? [];
      if (q.id === 'support')
        opts = pricing.supportPlans.map((p) => ({
          id: p.id,
          label: `${p.name} — ${money(p.monthlyPrice * 100)}/month`,
          description: supportDescription(p),
        }));
      for (const o of opts) {
        const label = el('label', '', 'choice');
        const input = el('input');
        input.type = q.type === 'many' ? 'checkbox' : 'radio';
        input.name = q.id;
        input.value = o.id;
        input.checked = Array.isArray(value) ? value.includes(o.id) : value === o.id;
        input.setAttribute('aria-label', o.label);
        input.required = !!q.required && q.type === 'one';
        const copy = el('span', '', 'mobile-option');
        copy.append(el('span', o.label));
        if (o.description) copy.append(el('small', o.description));
        input.onchange = () => {
          let v: string | string[] = o.id;
          if (q.type === 'many') {
            const old = (a[q.id as keyof Answers] as string[]) ?? [];
            v = input.checked ? [...new Set([...old, o.id])] : old.filter((id) => id !== o.id);
            if (q.id === 'tools') {
              if (o.id === 'none' && input.checked) v = ['none'];
              else v = v.filter((id) => id !== 'none');
            }
          }
          (a as Record<string, unknown>)[q.id] = v;
          if (q.id === 'service') a.outcomes = [];
          result = undefined;
          render(false);
          host.querySelector<HTMLInputElement>(`input[name="${q.id}"][value="${o.id}"]`)?.focus();
        };
        label.append(input, copy);
        group.append(label);
      }
      fs.append(group);
    } else {
      const field = q.type === 'long' ? el('textarea') : el('input');
      field.setAttribute('aria-label', q.label);
      if (field instanceof HTMLInputElement) field.type = q.type === 'number' ? 'number' : 'text';
      field.value = String(value ?? '');
      field.required = !!q.required;
      field.maxLength = q.type === 'long' ? 5000 : 500;
      if (q.type === 'number') {
        field.setAttribute('min', '0');
        field.setAttribute('max', '1000');
        field.setAttribute('step', '1');
      }
      field.oninput = () => {
        (a as Record<string, unknown>)[q.id] =
          q.type === 'number'
            ? field.value === ''
              ? undefined
              : Number(field.value)
            : field.value;
        result = undefined;
        if (q.type === 'number') {
          render(false);
          host.querySelector<HTMLInputElement>(`input[aria-label="${q.label}"]`)?.focus();
        }
      };
      fs.append(field);
    }
    return fs;
  }
  function render(move = true) {
    host.replaceChildren(el('h2', services.steps[step].title));
    const heading = host.querySelector('h2')!;
    heading.tabIndex = -1;
    if (move) heading.focus();
    host.append(el('p', c.progress(step + 1)));
    const progress = el('progress', '', 'quiz-progress');
    progress.max = 6;
    progress.value = step + 1;
    progress.setAttribute('aria-label', c.progress(step + 1));
    host.append(progress);
    const form = el('form');
    form.noValidate = true;
    const error = el('p', '', 'error');
    error.setAttribute('role', 'alert');
    form.append(error);
    if (step === 0)
      form.append(el('p', `${c.from} ${money(pricing.starter.price * 100)}. ${c.scopeCaveat}`));
    if (step === 3)
      form.append(
        el('p', c.scopeNote, 'notice'),
        el(
          'p',
          `${c.faqSetup}: ${money(pricing.addOns.knowledgeBaseSetup.price * 100)} · ${c.extraWorkflows}: ${c.from} ${money(pricing.addOns.additionalIndependentWorkflow.startingPrice * 100)} · ${c.extraTemplates}: ${money(pricing.addOns.additionalDocumentTemplate.price * 100)}`,
        ),
      );
    for (const q of questions(step, a)) if (!q.show || q.show(a)) form.append(choices(q));
    if (step === 4) form.append(el('p', c.thirdParty, 'notice'), el('p', c.extraWork));
    if (step === 5) {
      result ??= calculate(a);
      const e = result;
      const box = el('section', '', 'estimate-summary');
      box.append(el('h3', c.implementation));
      for (const line of e.lines) {
        const row = el('div', '', 'estimate-line');
        row.append(
          el('p', `${line.label} × ${line.quantity}`),
          el('p', `${line.from ? c.from + ' ' : ''}${money(line.amountPence)}`),
        );
        box.append(row);
      }
      box.append(
        el('p', `${e.isStartingFrom ? c.from + ' ' : ''}${money(e.knownPence)}`, 'estimate-total'),
        ...(!e.completePrice ? [el('p', c.status, 'notice'), el('p', c.incomplete)] : []),
        el('h3', c.monthly),
        el('p', e.plan.name),
        el('p', `${money(e.monthlyPence)}/month`, 'estimate-total'),
      );
      form.append(box);
      form.append(el('p', c.disclaimer, 'notice'));
      for (const line of estimateText(e).slice(1, 5)) form.append(el('p', line));
      for (const line of estimateText(e).slice(5 + e.lines.length + 2)) form.append(el('p', line));
      const save = button(
        c.download,
        async () => {
          save.disabled = true;
          try {
            const { createAIEstimatePDF } = await import('../lib/ai-automation-estimate/pdf');
            download(
              await createAIEstimatePDF(e),
              `FinTaxTech-AI-Automation-Estimate-${e.preparedAt.slice(0, 10)}.pdf`,
            );
          } catch {
            error.textContent = c.downloadError;
            error.tabIndex = -1;
            error.focus();
          } finally {
            save.disabled = false;
          }
        },
        true,
      );
      form.append(save);
    }
    const actions = el('div', '', 'actions quiz-actions');
    if (step > 0)
      actions.append(
        button(c.back, () => {
          step--;
          render();
        }),
      );
    if (step < 5) {
      const next = el('button', c.next, 'button primary');
      next.type = 'submit';
      actions.append(next);
    }
    form.append(actions);
    form.onsubmit = (ev) => {
      ev.preventDefault();
      if (step === 5) return;
      for (const q of questions(step, a)) {
        if (questionError(q, a)) {
          error.textContent = c.error;
          error.tabIndex = -1;
          error.focus();
          return;
        }
      }
      step++;
      render();
    };
    host.append(form);
  }
  const begin = root.querySelector<HTMLButtonElement>('[data-estimate-begin]')!;
  begin.hidden = false;
  begin.onclick = () => {
    root.querySelector<HTMLElement>('[data-estimate-intro]')!.hidden = true;
    host.hidden = false;
    render();
  };
}
