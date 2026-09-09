import { quizCopy as c } from '../content/questionnaire';
import { services } from '../content/services';
import { promoStatus } from '../content/promo';
import { consumePromoIntent } from '../lib/storage';
import {
  visibleQuestions,
  pruneHiddenAnswers,
  needsBranding,
  customerSuppliesContent,
  promoAllowed,
  routeService,
} from '../lib/rules';
import { validateAnswer, validEmail, validCompanyNumber, exclusive } from '../lib/validation';
import { emailHref, whatsappHref, download, canShare, share } from '../lib/sharing';
import { track } from '../lib/analytics';
import type { Journey, ServiceId, SummaryRow } from '../lib/types';
const root = document.querySelector<HTMLElement>('#questionnaire')!;
const selectionView = document.querySelector<HTMLElement>('#start-selection')!;
document.querySelector<HTMLElement>('#quiz-fallback')!.hidden = true;
const params = new URLSearchParams(location.search);
const requestedPromo = consumePromoIntent();
const isService = (value: string | null): value is ServiceId =>
  services.some((s) => s.id === value);
let journey: Journey = {
  service: 'websites',
  stage: params.get('stage') === '2' ? '2' : '1',
  answers: {},
  promo: promoAllowed(promoStatus, requestedPromo),
  short: params.get('brief') === 'short',
};
let position = 0;
let editing = false;
let pdf: Blob | undefined;
let partial = false;
let busy = false;
let assetDecision = false;
let customer: Record<string, string> = {
  name: '',
  company: '',
  email: '',
  phone: '',
  companyNumber: '',
};
let screen = 'selection';
// Text is always assigned with textContent, never interpreted as HTML.
function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  text?: string,
  className?: string,
): HTMLElementTagNameMap[K] {
  const n = document.createElement(tag);
  if (text !== undefined) n.textContent = text;
  if (className) n.className = className;
  return n;
}
function button(text: string, action: () => void, className = 'button') {
  const b = el('button', text, className);
  b.type = 'button';
  b.addEventListener('click', action);
  return b;
}
function link(text: string, href: string, className = 'button') {
  const a = el('a', text, className);
  a.href = href;
  return a;
}
function title(text: string) {
  const heading = el('h1', text);
  heading.tabIndex = -1;
  root.append(heading);
  queueMicrotask(() => heading.focus());
}
function paragraph(text: string, className?: string) {
  root.append(el('p', text, className));
}
function clear(next: string) {
  screen = next;
  selectionView.hidden = next !== 'selection';
  root.hidden = next === 'selection';
  root.replaceChildren();
}
function actions() {
  const a = el('div', undefined, 'actions quiz-actions');
  root.append(a);
  return a;
}
function errorNode() {
  const p = el('p', '', 'error');
  p.id = 'question-error';
  p.setAttribute('role', 'alert');
  root.append(p);
  return p;
}
function showError(node: HTMLElement, message: string) {
  node.textContent = message;
  node.tabIndex = -1;
  node.focus();
}
function selection() {
  clear('selection');
  queueMicrotask(() =>
    document.querySelector<HTMLElement>('#start-title')?.focus({ preventScroll: true }),
  );
}
// Enhance the server-rendered shared links without rebuilding their visual markup.
// Modified clicks keep normal link behaviour, including opening a questionnaire in a new tab.
selectionView.addEventListener('click', (event) => {
  if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey)
    return;
  const target =
    event.target instanceof Element ? event.target.closest<HTMLAnchorElement>('a') : null;
  if (!target) return;
  const service = target.dataset.startService ?? null;
  if (isService(service)) {
    event.preventDefault();
    start(service);
  } else if (target.hasAttribute('data-start-routing')) {
    event.preventDefault();
    routing();
  }
});
function routing() {
  clear('routing');
  title(c.routingTitle);
  paragraph(c.routingIntro, 'lead');
  const choices = el('div', undefined, 'choices');
  c.routingOptions.forEach((text, index) =>
    choices.append(button(text, () => start(routeService(index)), 'choice')),
  );
  root.append(choices);
  actions().append(button(c.back, selection), link(c.routingContact, '/contact/'));
}
function start(service: ServiceId) {
  journey = {
    ...journey,
    service,
    promo: journey.promo && service === 'websites',
    short: journey.short && service === 'branding',
    answers: {},
  };
  position = 0;
  track('service_selected');
  intro();
}
function intro() {
  clear('intro');
  title(services.find((s) => s.id === journey.service)!.name);
  paragraph(journey.short ? c.short : journey.stage === '2' ? c.stage2 : c.stage1, 'eyebrow');
  paragraph(c.intro, 'lead');
  paragraph(c.memory, 'notice');
  actions().append(
    button(c.back, selection),
    button(
      c.begin,
      () => {
        track('questionnaire_started');
        question();
      },
      'button primary',
    ),
  );
}
function question() {
  clear('question');
  const questions = visibleQuestions(journey);
  position = Math.min(position, questions.length - 1);
  const q = questions[position];
  const top = el('div', undefined, 'quiz-top');
  top.append(
    el('span', services.find((s) => s.id === journey.service)!.short, 'eyebrow'),
    button(c.exit, exit),
  );
  root.append(top);
  const progress = el('progress');
  progress.className = 'quiz-progress';
  progress.max = questions.length;
  progress.value = position + 1;
  progress.setAttribute('aria-label', c.progress(position + 1, questions.length));
  root.append(progress);
  paragraph(c.progress(position + 1, questions.length), 'eyebrow');
  const form = el('form');
  form.noValidate = true;
  const fieldset = el('fieldset');
  const legend = el('legend');
  const heading = el('h1', q.label);
  heading.tabIndex = -1;
  legend.append(heading);
  fieldset.append(legend);
  const helper = el(
    'p',
    q.type === 'text'
      ? c.optional
      : q.max
        ? c.chooseLimit(q.max)
        : q.type === 'multi'
          ? c.chooseMany
          : c.chooseOne,
    'muted',
  );
  helper.id = 'question-help';
  fieldset.append(helper);
  fieldset.setAttribute('aria-describedby', 'question-help question-error');
  if (q.type === 'text') {
    const input = el('textarea');
    input.value = String(journey.answers[q.id] ?? '');
    input.maxLength = 2000;
    input.setAttribute('aria-label', q.label);
    input.addEventListener('input', () => {
      journey.answers[q.id] = input.value;
    });
    fieldset.append(input);
  } else {
    const choices = el('div', undefined, 'choices');
    for (const [index, option] of (q.options ?? []).entries()) {
      const label = el('label', undefined, 'choice');
      const input = el('input');
      input.type = q.type === 'multi' ? 'checkbox' : 'radio';
      input.name = q.id;
      input.value = option;
      input.id = `answer-${index}`;
      const answer = journey.answers[q.id];
      input.checked = Array.isArray(answer) ? answer.includes(option) : answer === option;
      input.addEventListener('change', () => {
        const error = root.querySelector<HTMLElement>('#question-error')!;
        error.textContent = '';
        if (q.type === 'single') journey.answers[q.id] = option;
        else {
          let chosen = Array.isArray(journey.answers[q.id])
            ? [...(journey.answers[q.id] as string[])]
            : [];
          if (input.checked) {
            if (exclusive(option)) chosen = [];
            else chosen = chosen.filter((x) => !exclusive(x));
            if (q.max && chosen.length >= q.max) {
              input.checked = false;
              error.textContent = c.errorLimit(q.max);
              return;
            }
            chosen.push(option);
          } else chosen = chosen.filter((x) => x !== option);
          journey.answers[q.id] = chosen;
          choices
            .querySelectorAll<HTMLInputElement>('input')
            .forEach((i) => (i.checked = chosen.includes(i.value)));
        }
        journey.answers = pruneHiddenAnswers(journey);
      });
      label.append(input, el('span', option));
      choices.append(label);
    }
    fieldset.append(choices);
  }
  form.append(fieldset);
  root.append(form);
  if (q.id === 'websites-1-5' || q.id === 'websites-2-4') paragraph(c.assetsText, 'muted');
  if (
    journey.service === 'prompt-services' &&
    (q.id === 'prompt-services-1-8' || q.id === 'prompt-services-2-11')
  )
    paragraph(c.sensitiveNotice, 'notice');
  if (q.id === 'prompt-services-2-10') paragraph(c.authorityNotice, 'notice');
  const error = errorNode();
  const controls = actions();
  controls.append(
    button(c.back, () => {
      if (editing) {
        editing = false;
        review();
      } else if (position > 0) {
        position--;
        question();
      } else intro();
    }),
  );
  const next = el(
    'button',
    editing ? c.reviewTitle : position === questions.length - 1 ? c.continue : c.continue,
    'button primary',
  );
  next.type = 'submit';
  form.id = 'active-question';
  next.setAttribute('form', 'active-question');
  controls.append(
    next,
    button(c.later, () => review(true)),
  );
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const message = validateAnswer(q, journey.answers[q.id]);
    if (message) {
      showError(error, message);
      return;
    }
    track('question_step_completed');
    journey.answers = pruneHiddenAnswers(journey);
    if (
      needsBranding(journey) &&
      !assetDecision &&
      (q.id === 'websites-1-5' || q.id === 'websites-2-4')
    ) {
      assetBranch();
      return;
    }
    advance();
  });
  queueMicrotask(() => heading.focus());
}
function advance() {
  if (editing) {
    editing = false;
    review();
    return;
  }
  if (position < visibleQuestions(journey).length - 1) {
    position++;
    question();
  } else details();
}
function assetBranch() {
  clear('assets');
  title(c.assetsTitle);
  paragraph(c.assetsText, 'lead');
  const a = link(c.assetsOpen, '/enquiry/?service=branding&brief=short&stage=2', 'button primary');
  a.target = '_blank';
  a.rel = 'noopener';
  a.addEventListener('click', () => {
    assetDecision = true;
  });
  actions().append(
    a,
    button(c.assetsLater, () => {
      assetDecision = true;
      advance();
    }),
    button(c.continue, () => {
      assetDecision = true;
      advance();
    }),
  );
}
function details() {
  clear('details');
  title(c.customerTitle);
  paragraph(journey.promo ? c.promoFieldIntro : c.customerIntro, 'lead');
  const form = el('form');
  form.noValidate = true;
  const labels: Record<string, string> = {
    name: c.name,
    company: c.company,
    email: c.emailLabel,
    phone: c.phone,
    companyNumber: c.companyNumber,
  };
  for (const [key, labelText] of Object.entries(labels)) {
    if (key === 'companyNumber' && !journey.promo) continue;
    const label = el('label', undefined, 'field');
    label.append(el('span', labelText));
    const input = el('input');
    input.type = key === 'email' ? 'email' : 'text';
    input.name = key;
    input.maxLength = key === 'companyNumber' ? 8 : 150;
    input.value = customer[key];
    input.autocomplete =
      key === 'name'
        ? 'name'
        : key === 'email'
          ? 'email'
          : key === 'phone'
            ? 'tel'
            : key === 'company'
              ? 'organization'
              : 'off';
    input.addEventListener('input', () => (customer[key] = input.value));
    label.append(input);
    form.append(label);
  }
  const submit = el('button', c.contactContinue, 'button primary');
  submit.type = 'submit';
  form.append(submit);
  root.append(form);
  const error = errorNode();
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    if (!validEmail(customer.email)) {
      showError(error, c.emailError);
      return;
    }
    if (
      journey.promo &&
      (!customer.company.trim() || !validCompanyNumber(customer.companyNumber))
    ) {
      showError(error, c.companyError);
      return;
    }
    review();
  });
  actions().append(
    button(c.back, () => {
      position = visibleQuestions(journey).length - 1;
      question();
    }),
  );
}
function customerRows(): SummaryRow[] {
  const labels: Record<string, string> = {
    name: c.name,
    company: c.company,
    email: c.emailLabel,
    phone: c.phone,
    companyNumber: c.companyNumber,
  };
  return Object.entries(customer)
    .filter(([key, value]) => value.trim() && (key !== 'companyNumber' || journey.promo))
    .map(([key, value]) => ({ label: labels[key], value }));
}
function review(unfinished = false) {
  partial = unfinished;
  clear('review');
  title(unfinished ? c.partial : c.reviewTitle);
  paragraph(unfinished ? c.partialText : c.reviewIntro, 'lead');
  if (customerSuppliesContent(journey)) paragraph(c.contentNotice, 'notice');
  const questions = visibleQuestions(journey);
  for (const q of questions) {
    const answer = journey.answers[q.id];
    if (unfinished && (!answer || !answer.length)) continue;
    const row = el('div', undefined, 'review-row');
    const content = el('div');
    content.append(
      el('strong', q.label),
      el('p', Array.isArray(answer) ? answer.join(', ') : answer || c.notProvided),
    );
    const edit = button(c.edit, () => {
      position = visibleQuestions(journey).findIndex((x) => x.id === q.id);
      editing = true;
      question();
    });
    edit.setAttribute('aria-label', `${c.edit}: ${q.label}`);
    row.append(content, edit);
    root.append(row);
  }
  const contact = el('div', undefined, 'review-row');
  const text = el('div');
  text.append(el('h2', c.customerTitle));
  customerRows().forEach((row) => text.append(el('p', `${row.label}: ${row.value}`)));
  contact.append(text, button(c.edit, details));
  root.append(contact);
  const protection = el('label', undefined, 'choice');
  const check = el('input');
  check.type = 'checkbox';
  check.disabled = true;
  check.checked = false;
  check.setAttribute('aria-describedby', 'protection-note');
  protection.append(check, el('span', c.protect));
  root.append(protection);
  const note = el('p', c.protectionUnavailable, 'muted');
  note.id = 'protection-note';
  root.append(note);
  const error = errorNode();
  actions().append(
    button(c.resume, () => {
      editing = false;
      question();
    }),
    button(c.create, () => generate(error), 'button primary'),
  );
  if (!unfinished) track('questionnaire_completed');
}
async function generate(error: HTMLElement) {
  if (busy) return;
  journey.promo = promoAllowed(promoStatus, journey.promo);
  if (!partial) {
    const invalid = visibleQuestions(journey).find((q) => validateAnswer(q, journey.answers[q.id]));
    if (invalid) {
      position = visibleQuestions(journey).indexOf(invalid);
      editing = true;
      question();
      return;
    }
  }
  if (journey.promo && (!customer.company.trim() || !validCompanyNumber(customer.companyNumber))) {
    details();
    return;
  }
  busy = true;
  root.setAttribute('aria-busy', 'true');
  root.querySelectorAll('button').forEach((b) => (b.disabled = true));
  error.textContent = c.creating;
  track('pdf_generation_started');
  try {
    const { createPDF } = await import('../lib/pdf');
    pdf = await createPDF({ journey, customer: customerRows(), partial });
    track('pdf_generated');
    ready();
  } catch {
    track('pdf_generation_failed');
    error.textContent = c.pdfFailed;
    root.querySelectorAll('button').forEach((b) => (b.disabled = false));
    actions().append(link(c.email, emailHref()), link(c.whatsapp, whatsappHref()));
  } finally {
    busy = false;
    root.removeAttribute('aria-busy');
  }
}
function ready() {
  clear('ready');
  title(c.ready);
  paragraph(c.readyText, 'lead');
  paragraph(c.memory, 'notice');
  const error = errorNode();
  const controls = actions();
  controls.append(button(c.download, () => download(pdf!), 'button primary'));
  const email = link(c.email, emailHref());
  email.addEventListener('click', () => track('email_selected'));
  const wa = link(c.whatsapp, whatsappHref());
  wa.target = '_blank';
  wa.rel = 'noopener noreferrer';
  wa.addEventListener('click', () => track('whatsapp_selected'));
  controls.append(email, wa);
  const file = new File([pdf!], c.pdfFilename, { type: 'application/pdf' });
  if (canShare(file))
    controls.append(
      button(c.share, async () => {
        track('device_share_selected');
        try {
          await share(file);
        } catch (e) {
          error.textContent =
            e instanceof DOMException && e.name === 'AbortError' ? c.shareCancelled : c.shareFailed;
        }
      }),
    );
  controls.append(
    button(c.reviewTitle, () => review(partial)),
    button(c.newProject, exit),
  );
}
const exitDialog = document.querySelector<HTMLDialogElement>('#exit-dialog')!;
function exit() {
  exitDialog.showModal();
}
document.querySelector('#exit-stay')?.addEventListener('click', () => exitDialog.close());
document.querySelector('#exit-confirm')?.addEventListener('click', () => {
  journey.answers = {};
  journey.promo = false;
  customer = { name: '', company: '', email: '', phone: '', companyNumber: '' };
  pdf = undefined;
  exitDialog.close();
  selection();
});
window.addEventListener('beforeunload', (event) => {
  if (Object.keys(journey.answers).length && screen !== 'ready') {
    event.preventDefault();
  }
});
// URLs accept only non-personal routing values; no answers, campaign marker or customer fields.
const requestedService = params.get('service');
if (journey.promo) start('websites');
else if (isService(requestedService)) start(requestedService);
else if (params.get('route') === 'help') routing();
else selection();
