import { clientBriefDefinitions } from '../lib/client-brief/definitions';
import { company } from '../content/site';
import {
  createBriefRules,
  emptyBrief,
  hasOther,
  includesAnswer,
  isVisible,
  limits,
  toggleChoice,
} from '../lib/client-brief/rules';
import { prepareReference } from '../lib/logo-brief/images';
import { download } from '../lib/sharing';
import type { BriefField } from '../lib/client-brief/types';

const shell = document.querySelector<HTMLElement>('[data-client-brief]')!;
const definition =
  clientBriefDefinitions[shell.dataset.clientBrief as keyof typeof clientBriefDefinitions];
const { copy: c } = definition;
const { briefSummary, invalidSection, pruneBrief, validateField, visibleSections } =
  createBriefRules(definition.sections);
let sections = visibleSections({});
const root = shell.querySelector<HTMLElement>('[data-brief-form]')!;
const intro = shell.querySelector<HTMLElement>('[data-brief-intro]')!;
const begin = shell.querySelector<HTMLButtonElement>('[data-brief-begin]')!;
let state = emptyBrief();
let position = 0;
let dirty = false;
let busy = false;
let lifetime = 0;
let errors: Record<string, string> = {};
let imageMessage = '';
function el<K extends keyof HTMLElementTagNameMap>(tag: K, text?: string, className?: string) {
  const node = document.createElement(tag);
  if (text !== undefined) node.textContent = text;
  if (className) node.className = className;
  return node;
}
function button(label: string, action: () => void, primary = false) {
  const node = el('button', label, primary ? 'button primary' : 'button');
  node.type = 'button';
  node.disabled = busy;
  node.addEventListener('click', action);
  return node;
}
function update(id: string, value: string | string[] | boolean) {
  dirty = true;
  state.answers[id] = value;
  pruneBrief(state);
}
function focusHeading() {
  root.querySelector<HTMLElement>('h2')?.focus();
}
function textField(
  id: string,
  label: string,
  value: string,
  onInput: (value: string) => void,
  type = 'text',
  max: number = limits.short,
) {
  const wrap = el('label', undefined, 'field');
  wrap.htmlFor = id;
  wrap.append(el('span', label));
  const input = type === 'textarea' ? el('textarea') : el('input');
  if (input instanceof HTMLInputElement) input.type = type;
  input.id = id;
  input.value = value;
  input.maxLength = max;
  input.autocomplete = 'off';
  input.addEventListener('input', () => {
    dirty = true;
    onInput(input.value);
  });
  wrap.append(input);
  return wrap;
}
function renderField(field: BriefField) {
  const wrap = el('fieldset', undefined, 'brief-field');
  wrap.id = `field-${field.id}`;
  const legend = el('legend', field.label);
  legend.append(el('small', field.optional ? c.optional : c.required));
  wrap.append(legend);
  if (field.help) {
    const help = el('p', field.help, 'muted');
    help.id = `help-${field.id}`;
    wrap.append(help);
    wrap.setAttribute('aria-describedby', help.id);
  }
  if (field.type === 'single' || field.type === 'multi') {
    if (field.max) {
      const count = el(
        'p',
        c.count((state.answers[field.id] as string[] | undefined)?.length ?? 0, field.max),
        'muted',
      );
      count.setAttribute('role', 'status');
      wrap.append(count);
    }
    const choices = el('div', undefined, field.examples ? 'choices brief-examples' : 'choices');
    field.options!.forEach((option, index) => {
      const example = field.examples?.[option];
      const label = el('label', undefined, example ? 'choice brief-example' : 'choice');
      const input = el('input');
      input.type = field.type === 'multi' ? 'checkbox' : 'radio';
      input.name = field.id;
      input.id = `${field.id}-${index}`;
      input.value = option;
      input.checked = includesAnswer(state.answers[field.id], option);
      input.addEventListener('change', () => {
        if (busy) return;
        if (field.type === 'multi') {
          const selected = (state.answers[field.id] as string[] | undefined) ?? [];
          const next = toggleChoice(field, selected, option);
          if (next === selected && field.max) errors[field.id] = c.tooMany(field.max);
          else {
            delete errors[field.id];
            update(field.id, next);
          }
        } else {
          delete errors[field.id];
          update(field.id, option);
        }
        render(false, input.id);
      });
      label.append(input, el('span', option));
      if (example) {
        const image = el('img');
        image.src = `/images/logo-brief/${example.file}`;
        image.alt = example.alt;
        image.width = 640;
        image.height = 400;
        label.append(image);
      }
      choices.append(label);
    });
    wrap.append(choices);
    if (hasOther(field, state.answers)) {
      const other = textField(
        `${field.id}Other`,
        c.specify,
        String(state.answers[`${field.id}Other`] ?? ''),
        (value) => update(`${field.id}Other`, value),
      );
      other.classList.add('brief-other');
      other.querySelector('input')!.required = true;
      wrap.append(other);
    }
  } else if (
    field.type === 'text' ||
    field.type === 'long' ||
    field.type === 'date' ||
    field.type === 'url'
  ) {
    const label = textField(
      field.id,
      field.label,
      String(state.answers[field.id] ?? ''),
      (value) => {
        update(field.id, value);
        if (field.id === 'trading') {
          state.answers.nameConfirmed = false;
          const check = root.querySelector<HTMLInputElement>('#nameConfirmed');
          if (check) check.checked = false;
          const confirmation = root.querySelector('#name-confirmation');
          if (confirmation) confirmation.textContent = c.confirmation(value);
        }
      },
      field.type === 'long'
        ? 'textarea'
        : field.type === 'date'
          ? 'date'
          : field.type === 'url'
            ? 'url'
            : 'text',
      field.type === 'long' ? limits.long : limits.short,
    );
    label.querySelector('span')!.classList.add('sr-only');
    const control = label.querySelector('input, textarea')!;
    if (!field.optional) control.setAttribute('required', '');
    wrap.append(label);
  } else if (field.type === 'confirm') {
    const label = el('label', undefined, 'choice');
    const input = el('input');
    input.type = 'checkbox';
    input.id = field.id;
    input.required = true;
    input.checked = state.answers[field.id] === true;
    input.addEventListener('change', () => update(field.id, input.checked));
    const span = el('span', c.confirmation(String(state.answers.trading ?? '')));
    span.id = 'name-confirmation';
    label.append(input, span);
    wrap.append(label);
  } else if (field.type === 'competitors') {
    state.competitors.forEach((competitor, index) => {
      const item = el('div', undefined, 'brief-competitor');
      item.append(el('h3', c.competitor(index + 1)));
      item.append(
        textField(
          `competitor-name-${competitor.id}`,
          c.competitorName,
          competitor.name,
          (value) => (competitor.name = value),
        ),
      );
      item.append(
        textField(
          `competitor-website-${competitor.id}`,
          c.competitorWebsite,
          competitor.website,
          (value) => (competitor.website = value),
          'url',
        ),
      );
      const remove = button(c.remove, () => {
        dirty = true;
        state.competitors.splice(index, 1);
        render(false, 'add-competitor');
      });
      remove.setAttribute('aria-label', c.removeCompetitor(index + 1));
      item.append(remove);
      wrap.append(item);
    });
    const add = button(c.addCompetitor, () => {
      if (state.competitors.length >= limits.competitors) return;
      const id = crypto.randomUUID();
      dirty = true;
      state.competitors.push({ id, name: '', website: '' });
      render(false, `competitor-name-${id}`);
    });
    add.id = 'add-competitor';
    add.disabled = busy || state.competitors.length >= limits.competitors;
    wrap.append(add);
  } else if (field.type === 'pages') {
    state.additionalPages.forEach((page, index) => {
      const item = el('div', undefined, 'brief-page');
      item.append(el('h3', c.additionalPage(index + 1)));
      const name = textField(
        `page-name-${page.id}`,
        c.pageName,
        page.name,
        (value) => (page.name = value),
      );
      name.querySelector('input')!.required = true;
      item.append(
        name,
        textField(
          `page-purpose-${page.id}`,
          c.pagePurpose,
          page.purpose,
          (value) => (page.purpose = value),
        ),
      );
      const remove = button(c.remove, () => {
        dirty = true;
        state.additionalPages.splice(index, 1);
        delete errors[field.id];
        render(false, 'add-page');
      });
      remove.setAttribute('aria-label', c.removePage(index + 1));
      item.append(remove);
      wrap.append(item);
    });
    const add = button(c.addPage, () => {
      if (state.additionalPages.length >= limits.additionalPages) return;
      const id = crypto.randomUUID();
      dirty = true;
      state.additionalPages.push({ id, name: '', purpose: '' });
      render(false, `page-name-${id}`);
    });
    add.id = 'add-page';
    add.disabled = busy || state.additionalPages.length >= limits.additionalPages;
    wrap.append(add);
  } else if (field.type === 'images') {
    state.images.forEach((reference, index) => {
      const item = el('div', undefined, 'brief-reference');
      item.append(el('h3', c.reference(index + 1)), referencePreview(reference, index));
      item.append(
        textField(
          `explanation-${reference.id}`,
          c.explanation,
          reference.explanation,
          (value) => (reference.explanation = value),
        ),
      );
      item.querySelector<HTMLInputElement>('input')!.required = true;
      item.append(imagePicker(reference.id, c.replaceImageLabel(index + 1)));
      const remove = button(c.remove, () => {
        dirty = true;
        state.images.splice(index, 1);
        imageMessage = c.imageReady;
        render(false, 'reference-upload');
      });
      remove.setAttribute('aria-label', c.removeImage(index + 1));
      item.append(remove);
      wrap.append(item);
    });
    wrap.append(imagePicker());
    const status = el('p', imageMessage, 'brief-status');
    status.setAttribute('role', 'status');
    wrap.append(status);
  }
  if (field.followUp?.values.some((value) => includesAnswer(state.answers[field.id], value))) {
    const notice = el('div', undefined, 'notice');
    notice.append(el('p', field.followUp.text));
    if (field.followUp.link) {
      const link = el('a', field.followUp.link.label);
      link.href = field.followUp.link.href;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      notice.append(link);
    }
    wrap.append(notice);
  }
  if (errors[field.id]) {
    const error = el('p', errors[field.id], 'error');
    error.id = `error-${field.id}`;
    error.setAttribute('role', 'alert');
    error.tabIndex = -1;
    wrap.append(error);
    wrap.querySelectorAll('input, textarea').forEach((control) => {
      control.setAttribute('aria-invalid', 'true');
      control.setAttribute('aria-describedby', error.id);
    });
  }
  return wrap;
}
function referencePreview(reference: (typeof state.images)[number], index: number) {
  const image = el('img');
  image.src = reference.data;
  image.alt = c.referenceAlt(index + 1);
  image.width = reference.width;
  image.height = reference.height;
  return image;
}
function imagePicker(replaceId?: string, label = c.addImages) {
  const wrap = el('label', undefined, 'field');
  wrap.append(el('span', label));
  const input = el('input');
  input.type = 'file';
  input.accept = 'image/png,image/jpeg,image/webp';
  input.multiple = !replaceId;
  input.id = replaceId ? `replace-${replaceId}` : 'reference-upload';
  input.disabled = busy || (!replaceId && state.images.length >= limits.images);
  input.addEventListener('change', async () => {
    const files = Array.from(input.files ?? []);
    if (!files.length || busy) return;
    if (!replaceId && state.images.length + files.length > limits.images) {
      imageMessage = c.imageLimit;
      render(false, input.id);
      return;
    }
    const operationLifetime = lifetime;
    busy = true;
    imageMessage = c.processing;
    render(false);
    try {
      // Process sequentially to bound peak image memory; apply the batch only on success.
      const prepared = [];
      for (const file of files) prepared.push(await prepareReference(file));
      if (operationLifetime !== lifetime) return;
      if (replaceId) {
        const index = state.images.findIndex((image) => image.id === replaceId);
        if (index !== -1)
          state.images[index] = {
            ...prepared[0],
            id: replaceId,
            explanation: state.images[index].explanation,
          };
      } else state.images.push(...prepared);
      dirty = true;
      imageMessage = c.imageReady;
    } catch (error) {
      imageMessage = error instanceof Error ? error.message : c.imageInvalid;
    } finally {
      if (operationLifetime !== lifetime) return;
      busy = false;
      render(
        false,
        replaceId
          ? `replace-${replaceId}`
          : state.images.length
            ? `explanation-${state.images.at(-1)!.id}`
            : 'reference-upload',
      );
    }
  });
  wrap.append(input);
  return wrap;
}
function render(focus = true, focusId?: string) {
  sections = visibleSections(state.answers);
  root.hidden = false;
  intro.hidden = true;
  root.replaceChildren();
  const section = sections[position];
  const progress = el('progress', undefined, 'quiz-progress');
  progress.max = sections.length;
  progress.value = position + 1;
  progress.setAttribute('aria-label', c.progress(position + 1, sections.length));
  const heading = el('h2', section.title);
  heading.tabIndex = -1;
  root.append(el('p', c.progress(position + 1, sections.length), 'eyebrow'), progress, heading);
  const form = el('form');
  form.noValidate = true;
  form.autocomplete = 'off';
  for (const field of section.fields.filter((field) => isVisible(field, state.answers)))
    form.append(renderField(field));
  if (busy)
    form
      .querySelectorAll<HTMLInputElement | HTMLButtonElement | HTMLTextAreaElement>(
        'input, textarea, button',
      )
      .forEach((control) => (control.disabled = true));
  const actions = el('div', undefined, 'actions quiz-actions');
  if (position > 0)
    actions.append(
      button(c.back, () => {
        errors = {};
        position--;
        render();
      }),
    );
  const next = button(position === sections.length - 1 ? c.review : c.next, () => {}, true);
  next.type = 'submit';
  actions.append(next);
  form.append(actions);
  root.append(form);
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    if (busy) return;
    errors = {};
    for (const field of section.fields) {
      const error = validateField(field, state);
      if (error) errors[field.id] = error;
    }
    if (Object.keys(errors).length) {
      render(false);
      (
        root.querySelector<HTMLElement>('[aria-invalid]') ??
        root.querySelector<HTMLElement>('[role=alert]')
      )?.focus();
    } else if (position < sections.length - 1) {
      position++;
      render();
    } else review();
  });
  if (focusId) document.getElementById(focusId)?.focus({ preventScroll: true });
  else if (focus) focusHeading();
}
function review() {
  const invalid = invalidSection(state);
  if (invalid !== -1) {
    position = invalid;
    render();
    return;
  }
  root.replaceChildren();
  const heading = el('h2', c.reviewTitle);
  heading.tabIndex = -1;
  root.append(heading, el('p', c.reviewIntro));
  const summary = el('div', undefined, 'brief-review');
  briefSummary(state).forEach((section, index) => {
    const item = el('section');
    item.append(el('h3', section.title));
    const list = el('dl');
    section.rows.forEach((row) => list.append(el('dt', row.label), el('dd', row.value)));
    item.append(list);
    if (
      sections[index].fields.some((field) => field.type === 'images') &&
      state.answers.references === 'Yes'
    ) {
      state.images.forEach((reference, i) => {
        const figure = el('figure', undefined, 'brief-reference');
        figure.append(
          el('p', c.reference(i + 1)),
          referencePreview(reference, i),
          el('figcaption', reference.explanation),
        );
        item.append(figure);
      });
    }
    const edit = button(c.edit, () => {
      position = index;
      errors = {};
      render();
    });
    edit.setAttribute('aria-label', `${c.edit}: ${section.title}`);
    item.append(edit);
    summary.append(item);
  });
  root.append(summary, el('p', c.disclaimer, 'notice'), el('p', c.shareHelp));
  const status = el('p', '', 'brief-status');
  status.setAttribute('role', 'status');
  const actions = el('div', undefined, 'actions');
  actions.append(
    button(c.back, () => {
      position = sections.length - 1;
      render();
    }),
  );
  const save = button(
    c.download,
    async () => {
      if (busy) return;
      const operationLifetime = lifetime;
      busy = true;
      status.textContent = c.downloading;
      root
        .querySelectorAll<HTMLButtonElement>('button')
        .forEach((button) => (button.disabled = true));
      try {
        const { createClientBriefPDF } = await import('../lib/client-brief/pdf');
        const blob = await createClientBriefPDF(definition, state);
        if (operationLifetime !== lifetime) return;
        download(blob, c.pdfFilename);
        // Do not retain a Blob in journey state. Recreate it from current answers for each download.
        status.textContent = c.downloaded;
      } catch {
        status.textContent = c.pdfError;
      } finally {
        busy = false;
        root
          .querySelectorAll<HTMLButtonElement>('button')
          .forEach((button) => (button.disabled = false));
      }
    },
    true,
  );
  actions.append(save);
  root.append(actions, status);
  const sharing = el('div', undefined, 'actions');
  for (const [label, href] of [
    [c.email, `mailto:${company.email}`],
    [c.whatsapp, `https://wa.me/${company.whatsapp}`],
  ]) {
    const link = el('a', label, 'button');
    link.href = href;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    sharing.append(link);
  }
  root.append(sharing);
  focusHeading();
}
begin.hidden = false;
begin.addEventListener('click', () => render());
window.addEventListener('beforeunload', (event) => {
  if (dirty) {
    event.preventDefault();
    event.returnValue = '';
  }
});
// Clear answers on navigation, including browsers that restore a page from their back/forward cache.
window.addEventListener('pagehide', () => {
  lifetime++;
  state = emptyBrief();
  dirty = false;
});
window.addEventListener('pageshow', (event) => {
  if (event.persisted) {
    state = emptyBrief();
    position = 0;
    dirty = false;
    busy = false;
    errors = {};
    imageMessage = '';
    root.replaceChildren();
    root.hidden = true;
    intro.hidden = false;
  }
});
