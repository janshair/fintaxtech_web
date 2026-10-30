import { services, pricing, get, condition } from '../lib/website-estimate/config';
import { initialAnswers, calculate, type Answers } from '../lib/website-estimate/calculate';
import { money, estimateText } from '../lib/website-estimate/presentation';
import { websiteEstimateCopy as c } from '../content/website-estimate';
import { answerSummary } from '../lib/website-estimate/answers';
import { download } from '../lib/sharing';
const root = document.querySelector<HTMLElement>('[data-website-estimate]');
if (root) {
  const host = root.querySelector<HTMLElement>('[data-estimate-form]')!;
  let a = initialAnswers(),
    step = 0;
  const el = (tag: string, text = '', cls = '') => {
    const n = document.createElement(tag);
    n.textContent = text;
    n.className = cls;
    return n;
  };
  const set = (obj: any, path: string, v: any) => {
    const parts = path.split('.');
    const last = parts.pop()!;
    let o = obj;
    for (const k of parts) o = o[k] ??= {};
    o[last] = v;
  };
  const button = (label: string, fn: () => void) => {
    const b = el('button', label, 'button') as HTMLButtonElement;
    b.type = 'button';
    b.onclick = fn;
    return b;
  };
  const summary = () => {
    const box = el('aside', '', 'estimate-summary');
    box.setAttribute('aria-label', c.live);
    const e = calculate(a);
    box.append(
      el('h3', c.live),
      el('p', `${c.known}: ${money(e.knownSubtotalMinor)}`),
      el('p', `${c.monthly}: ${money(e.monthlySubtotalMinor)}/month`),
    );
    if (e.fullTotalMinor === null) box.append(el('p', c.fullPending));
    return box;
  };
  const finalContent = () => {
    const box = el('section');
    box.dataset.result = '';
    const e = calculate(a);
    const sections = estimateText(e);
    box.append(el('h3', c.pdfTitle), el('p', services.steps[5].notice!, 'notice'));
    const breakdown = el('section', '', 'estimate-summary');
    breakdown.append(el('h4', c.known));
    for (const line of e.lines) {
      const row = el('div', '', 'estimate-line');
      row.append(
        el('p', `${line.label}${line.quantity > 1 ? ` × ${line.quantity}` : ''}`),
        el(
          'p',
          `${money(line.amountMinor)}${line.startingAtMinor ? ` (${c.from} ${money(line.startingAtMinor)})` : ''}`,
        ),
      );
      breakdown.append(row);
    }
    breakdown.append(el('p', money(e.knownSubtotalMinor), 'estimate-total'));
    box.append(breakdown);
    const monthly = el('section', '', 'estimate-summary');
    monthly.append(
      el('h4', c.monthly),
      el('p', `${money(e.monthlySubtotalMinor)}/month`, 'estimate-total'),
    );
    box.append(monthly);
    if (e.fullTotalMinor === null) box.append(el('p', c.fullPending, 'notice'));
    for (const text of sections.slice(1 + (e.fullTotalMinor === null ? 1 : 0) + e.lines.length + 2))
      box.append(el('p', text));
    box.append(el('h3', c.requirements));
    for (const text of answerSummary(a)) box.append(el('p', text));
    return box;
  };
  const refresh = () => {
    host.querySelector('[data-live]')?.replaceChildren(summary());
    host.querySelector('[data-result]')?.replaceWith(finalContent());
  };
  function field(q: any, obj: any = a, prefix = ''): HTMLElement {
    const wrap = el('fieldset', '', 'mobile-question');
    wrap.append(el('legend', q.label));
    if (q.help) wrap.append(el('p', q.help));
    const path = prefix + q.id;
    const update = (v: any, rerender = false) => {
      set(obj, path, v);
      if (
        path === 'packageId' &&
        !(pricing.monthlyPlans as any)[a.support.planId]?.allowedPackages.includes(v)
      )
        a.support.planId = 'none';
      if (rerender) {
        const active = document.activeElement as HTMLInputElement;
        const value = active?.value;
        const activeName = active?.name;
        render(false);
        host
          .querySelector<HTMLInputElement>(
            `input[name="${activeName ?? path}"][value="${CSS.escape(value ?? '')}"]`,
          )
          ?.focus();
      } else refresh();
    };
    const context = { ...a, $row: obj };
    if (!condition(q.visibleWhen, context)) {
      wrap.hidden = true;
      return wrap;
    }
    if (q.type === 'repeatable_pages') {
      const suggested = el('div', '', 'actions website-page-suggestions');
      suggested.append(el('p', c.suggestions));
      for (const name of q.suggestions)
        suggested.append(
          button(name, () => {
            if (!a.pages.some((r) => r.name.toLowerCase() === name.toLowerCase()))
              a.pages.push({
                id: crypto.randomUUID(),
                name,
                layoutNeeds: 'standard',
                contentMode: 'supplied',
                extraWordBlocks: 0,
              });
            render(false);
          }),
        );
      wrap.append(suggested);
      a.pages.forEach((row, i) => {
        const block = el('div', '', 'estimate-custom-row');
        for (const f of q.rowFields.filter((f: any) => f.type !== 'generated_id')) {
          if (condition(f.visibleWhen, { ...a, $row: row }))
            block.append(field({ ...f, visibleWhen: undefined }, row));
        }
        block.append(
          button(`${c.remove}: ${row.name || i + 1}`, () => {
            a.pages.splice(i, 1);
            render(false);
          }),
        );
        wrap.append(block);
      });
      wrap.append(
        button(c.add, () => {
          a.pages.push({
            id: crypto.randomUUID(),
            name: '',
            layoutNeeds: 'standard',
            contentMode: 'supplied',
            extraWordBlocks: 0,
          });
          render(false);
        }),
      );
      return wrap;
    }
    if (q.type === 'selected_feature_details') {
      for (const id of a.features) {
        const box = el('div', '', 'estimate-custom-row');
        box.append(el('h3', (pricing.items as any)[id].label));
        a.featureDetails[id] ??= {};
        for (const f of q.fieldsForEverySelection) {
          if (f.type === 'selected_feature_reference')
            box.append(
              field(
                {
                  ...f,
                  type: 'single_choice',
                  options: [
                    { id: '', label: c.no },
                    ...a.features
                      .filter((v) => v !== id)
                      .map((v) => ({ id: v, label: (pricing.items as any)[v].label })),
                  ],
                },
                a.featureDetails[id],
              ),
            );
          else box.append(field(f, a.featureDetails[id]));
        }
        for (const prompt of q.followupsByItem[id] ?? []) box.append(el('p', prompt));
        if (id === 'booking_embed')
          box.append(
            field(
              {
                id: 'bookingProviderIncludesPayment',
                label: q.followupsByItem[id][1],
                type: 'boolean',
              },
              a.featureDetails[id],
            ),
          );
        if (id.startsWith('payment_'))
          box.append(
            field(
              {
                id: 'paymentPurpose',
                label: c.details,
                type: 'single_choice',
                options: [
                  { id: 'standard_store_checkout', label: c.storeCheckout },
                  { id: 'same_booking', label: c.sameBooking },
                  { id: 'separate', label: c.separatePayment },
                ],
              },
              a.featureDetails[id],
            ),
          );
        wrap.append(box);
      }
      return wrap;
    }
    if (q.fields) {
      let target = get(obj, path);
      if (!target || typeof target !== 'object') {
        target = {};
        set(obj, path, target);
      }
      for (const f of q.fields) wrap.append(field(f, obj, path + '.'));
      return wrap;
    }
    let value = get(obj, path);
    if (value === undefined && q.default !== undefined) {
      value = structuredClone(q.default);
      set(obj, path, value);
    }
    if (['single_choice', 'multi_choice', 'boolean'].includes(q.type)) {
      let options = q.optionsRef
        ? services.packageOptions
        : q.type === 'boolean'
          ? [
              { id: true, label: c.yes },
              { id: false, label: c.no },
            ]
          : q.options;
      const choices = el('div', '', 'choices');
      for (const option of options ?? []) {
        if (!condition(option.visibleWhen, a)) continue;
        const label = el('label', '', 'choice');
        const input = document.createElement('input');
        input.type = q.type === 'multi_choice' ? 'checkbox' : 'radio';
        input.name =
          obj === a
            ? path
            : `${obj.id ?? Object.entries(a.featureDetails).find(([, v]) => v === obj)?.[0] ?? prefix}-${path}`;
        input.required = !!q.required && q.type !== 'multi_choice';
        input.value = String(option.id);
        input.checked =
          q.type === 'multi_choice' ? (value ?? []).includes(option.id) : value === option.id;
        let labelText = option.label;
        const price = option.priceRef ? get(pricing, option.priceRef) : undefined;
        if (price)
          labelText += ` — ${price.kind === 'manual' ? c.pending : (price.kind === 'from' || q.optionsRef ? c.from + ' ' : '') + money(price.amountMinor)}${price.billing === 'monthly' ? '/month' : ''}`;
        input.setAttribute('aria-label', labelText);
        input.onchange = () =>
          update(
            q.type === 'multi_choice'
              ? input.checked
                ? [...new Set([...(get(obj, path) ?? []), option.id])]
                : (get(obj, path) ?? []).filter((v: any) => v !== option.id)
              : option.id,
            true,
          );
        const copy = el('span', '', 'mobile-option');
        copy.append(el(q.optionsRef ? 'strong' : 'span', q.optionsRef ? option.label : labelText));
        if (q.optionsRef)
          copy.append(
            el(
              'span',
              price?.kind === 'manual'
                ? c.quotationReview
                : `${c.from} ${money(price.amountMinor)}`,
              'estimate-option-price',
            ),
          );
        if (option.summary) copy.append(el('small', option.summary));
        label.append(input, copy);
        if (q.optionsRef) {
          const pack = (pricing.packages as any)[option.id];
          const capabilities = pack.includedCapabilities as string[];
          const keyList = el('span', '', 'estimate-key-inclusions');
          keyList.setAttribute('role', 'list');
          for (const id of c.keyCapabilityIds
            .filter((id) => capabilities.includes(id))
            .slice(0, 6)) {
            const item = el('span', (services.capabilityLabels as any)[id]);
            item.setAttribute('role', 'listitem');
            keyList.append(item);
          }
          copy.append(keyList);
          const card = el('div', '', 'choice-card');
          card.append(label);
          if (capabilities.length) {
            const details = el('details', '', 'estimate-option-details');
            details.dataset.detailKey = option.id;
            details.append(el('summary', c.viewIncluded));
            const list = el('ul');
            for (const id of capabilities)
              list.append(el('li', (services.capabilityLabels as any)[id]));
            details.append(list);
            card.append(details);
          }
          choices.append(card);
        } else choices.append(label);
      }
      wrap.append(choices);
    } else {
      const input = document.createElement(q.type === 'textarea' ? 'textarea' : 'input') as
        HTMLInputElement | HTMLTextAreaElement;
      input.setAttribute('aria-label', q.label);
      if (input instanceof HTMLInputElement)
        input.type = q.type === 'integer' ? 'number' : q.type === 'url' ? 'url' : 'text';
      input.value = String(value ?? '');
      input.required = !!q.required;
      input.maxLength = q.type === 'textarea' ? 5000 : 200;
      if (q.type === 'integer') {
        input.setAttribute('min', '0');
        input.setAttribute('step', '1');
      }
      input.oninput = () => {
        const before = get(obj, path);
        set(
          obj,
          path,
          q.type === 'integer'
            ? input.value === ''
              ? undefined
              : Number(input.value)
            : input.value,
        );
        refresh();
        if (path === 'content.blogArticleCount' && Boolean(before) !== Boolean(get(obj, path))) {
          render(false);
          host.querySelector<HTMLInputElement>(`input[aria-label="${q.label}"]`)?.focus();
        }
      };
      wrap.append(input);
    }
    return wrap;
  }
  function render(move = true) {
    const expanded = new Set(
      Array.from(host.querySelectorAll<HTMLDetailsElement>('details[open]')).map(
        (d) => d.dataset.detailKey,
      ),
    );
    host.replaceChildren(el('h2', services.steps[step].title));
    const h = host.querySelector('h2')!;
    h.tabIndex = -1;
    if (move) h.focus();
    const progress = document.createElement('progress');
    progress.className = 'quiz-progress';
    progress.max = 6;
    progress.value = step + 1;
    progress.setAttribute('aria-label', `${step + 1} / 6`);
    host.append(el('p', c.progress(step + 1)), progress);
    const form = document.createElement('form');
    const current = services.steps[step] as any;
    if (step === 2 && a.packageId !== 'custom_web_app') {
      const included = el('details', '', 'estimate-summary');
      included.dataset.detailKey = 'included';
      included.append(el('summary', c.included));
      const list = el('ul');
      for (const id of (pricing.packages as any)[a.packageId]?.includedCapabilities ?? [])
        list.append(el('li', (services.capabilityLabels as any)[id]));
      included.append(list);
      form.append(included);
    }
    for (const q of current.questions) {
      if (step === 2 && q.id === 'features') {
        for (const group of current.groups) {
          const box = group.collapsed ? el('details') : el('section');
          if (group.collapsed) box.dataset.detailKey = group.id;
          box.append(el(group.collapsed ? 'summary' : 'h3', group.title));
          box.append(
            field({ ...q, options: q.options.filter((o: any) => group.optionIds.includes(o.id)) }),
          );
          form.append(box);
        }
      } else form.append(field(q));
    }
    if (current.scopeNote) form.append(el('p', current.scopeNote));
    if (current.policyCopy) form.append(el('p', current.policyCopy));
    const live = el('div');
    live.dataset.live = '';
    live.append(summary());
    form.append(live);
    const error = el('p', '', 'error');
    error.setAttribute('role', 'alert');
    form.append(error);
    if (step === 5) {
      form.append(finalContent());
      const save = button(c.download, async () => {
        save.disabled = true;
        try {
          const { createWebsitePDF } = await import('../lib/website-estimate/pdf');
          download(
            await createWebsitePDF(calculate(a)),
            `FinTaxTech-Website-Estimate-${crypto.randomUUID()}.pdf`,
          );
        } catch {
          error.textContent = c.pdfError;
        } finally {
          save.disabled = false;
        }
      });
      form.append(save, el('h3', c.brandingTitle), el('p', c.brandingBody));
      const link = el('a', c.brandingLink) as HTMLAnchorElement;
      link.href = c.brandingRoute;
      form.append(link);
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
      const next = el('button', c.next, 'button primary') as HTMLButtonElement;
      next.type = 'submit';
      actions.append(next);
    }
    form.append(actions);
    form.onsubmit = (ev) => {
      ev.preventDefault();
      if (step === 5) return;
      if (!a.packageId || (step === 1 && a.packageId !== 'custom_web_app' && !a.pages.length)) {
        error.textContent = c.error;
        return;
      }
      step++;
      render();
    };
    host.append(form);
    host.querySelectorAll<HTMLDetailsElement>('details').forEach((d) => {
      d.open = expanded.has(d.dataset.detailKey);
    });
  }
  const begin = root.querySelector<HTMLButtonElement>('[data-estimate-begin]')!;
  begin.hidden = false;
  begin.onclick = () => {
    root.querySelector<HTMLElement>('[data-estimate-intro]')!.hidden = true;
    host.hidden = false;
    render();
  };
}
export function activeAnswers(a: Answers) {
  const result = structuredClone(a);
  if (a.packageId !== 'shopify') delete result.shopify;
  if (a.migration.required === 'no') result.migration = { required: 'no' };
  if (a.visibility.mode !== 'advanced') result.visibility.services = [];
  result.featureDetails = Object.fromEntries(
    a.features.map((id) => [id, a.featureDetails[id] ?? {}]),
  );
  return result;
}
