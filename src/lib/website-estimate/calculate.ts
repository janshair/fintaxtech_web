import { pricing as p, services as s } from './config';
export interface Answers {
  packageId: string;
  pages: any[];
  features: string[];
  featureDetails: Record<string, any>;
  content: any;
  migration: any;
  visibility: any;
  support: any;
  projectExtras: any;
  [key: string]: any;
}
export interface Line {
  id: string;
  label: string;
  quantity: number;
  amountMinor: number | null;
  startingAtMinor?: number | null;
}
export function initialAnswers(): Answers {
  return {
    packageId: '',
    pages: [],
    features: [],
    featureDetails: {},
    content: { blogArticleCount: 0, publishArticles: false, stockImageCount: 0, editImageCount: 0 },
    migration: { required: 'no' },
    visibility: { mode: 'essential', services: [] },
    support: { planId: 'none' },
    projectExtras: { extraRevisionRounds: 0, extraConcepts: 0 },
  };
}
export function calculate(a: Answers) {
  const lines: Line[] = [],
    reviewFlags: string[] = [],
    validationErrors: string[] = [];
  const review = (id: string) => {
    if (!reviewFlags.includes(id)) reviewFlags.push(id);
  };
  const qty = (v: unknown, key: string) => {
    if (typeof v !== 'number' || !Number.isSafeInteger(v) || v < 0) {
      validationErrors.push(key);
      return 0;
    }
    return v;
  };
  const items = p.items as Record<string, any>,
    packages = p.packages as Record<string, any>,
    plans = p.monthlyPlans as Record<string, any>;
  const pack = packages[a.packageId];
  const add = (id: string, q = 1, hold = false) => {
    const item = items[id];
    if (!item) {
      validationErrors.push(id);
      return;
    }
    if (!q) return;
    const pending = hold || ['manual', 'from'].includes(item.kind);
    lines.push({
      id,
      label: item.label,
      quantity: q,
      amountMinor: pending ? null : item.amountMinor * q,
      startingAtMinor: pending ? item.amountMinor : undefined,
    });
    if (pending) review(id);
  };
  const detail = (id: string) => a.featureDetails[id] ?? {};
  if (!pack) validationErrors.push('packageId');
  for (const key of Object.keys(a))
    if (!Object.hasOwn(s.answerModel, key) || key === 'trustedAssessment')
      validationErrors.push(`Unknown answer: ${key}`);
  const custom = a.packageId === 'custom_web_app';
  if (pack && !custom)
    lines.push({ id: a.packageId, label: pack.label, quantity: 1, amountMinor: pack.amountMinor });
  if (custom) review('custom_web_app');
  const features = new Set(a.features);
  if (features.size !== a.features.length) validationErrors.push('Duplicate feature ID');
  const allowed = (s.steps[2].questions[0] as any).options.map((o: any) => o.id);
  for (const f of features)
    if (!allowed.includes(f)) validationErrors.push(`Unknown feature: ${f}`);
  if (features.has('blog_custom')) features.delete('blog_basic');
  if (
    features.has('form_multistep') &&
    !detail('form_advanced').sameWorkflowAs?.includes('distinct')
  )
    features.delete('form_advanced');
  for (const rule of p.dependencyRules) {
    if ('whenAnySelected' in rule && rule.whenAnySelected?.some((id) => features.has(id))) {
      const ref = (rule.addPriceRefByPackage as any)?.[a.packageId];
      if (ref) features.add(ref.split('.')[1]);
    }
  }
  if (pack?.cmsIncluded) features.delete('cms');
  const pages = a.pages.filter(
    (row) =>
      !(a.packageId === 'shopify' && p.pageRules.excludedShopifyScreenRoles.includes(row.role)),
  );
  if (new Set(a.pages.map((row) => row.id)).size !== a.pages.length)
    validationErrors.push('Duplicate page ID');
  if (pack && !custom) {
    if (!pages.length) validationErrors.push('pages');
    const blog = features.has('blog_basic') || features.has('blog_custom');
    const count =
      pages.length +
      (blog &&
      !pages.some((row) => row.role === 'blog_listing' || row.name?.trim().toLowerCase() === 'blog')
        ? 1
        : 0);
    add('page_standard', Math.max(0, count - pack.standardPageAllowance));
    for (const row of pages) {
      if (!row.name?.trim()) validationErrors.push('Page name');
      if (row.layoutNeeds !== 'standard') add('page_review');
      const mode = row.contentMode;
      const contentId = (p.contentRules.perPageModes as any)[mode];
      if (contentId) add(contentId);
      else if (mode !== 'supplied') add('content_review');
      qty(row.extraWordBlocks ?? 0, 'extraWordBlocks');
      if (mode === 'write') add('long_form', qty(row.extraWordBlocks ?? 0, 'extraWordBlocks'));
      if (mode !== 'supplied' && !row.contentBrief?.trim()) review('Content brief required');
    }
    add('blog_article', qty(a.content.blogArticleCount, 'blogArticleCount'));
    if (a.content.blogArticleCount && a.content.publishArticles && !blog)
      review('Blog publishing destination required');
    for (const [key, id] of [
      ['stockImageCount', 'stock_images'],
      ['editImageCount', 'image_editing'],
    ]) {
      const n = qty(a.content[key], key);
      if (n > items[id].maxQuantity) add('content_review');
      else if (n) add(id);
    }
    if (a.content.otherDetails?.trim()) add('content_review');
    for (const id of features) {
      if (!allowed.includes(id)) continue;
      const d = detail(id);
      let hold = false;
      if (
        id === 'payment_hosted' &&
        ((a.packageId === 'shopify' && d.paymentPurpose === 'standard_store_checkout') ||
          (features.has('booking_embed') &&
            detail('booking_embed').bookingProviderIncludesPayment &&
            d.paymentPurpose === 'same_booking'))
      )
        continue;
      if (
        d.sameWorkflowAs &&
        features.has(d.sameWorkflowAs) &&
        ['crm', 'api', 'automation'].includes(id)
      )
        hold = true;
      if (
        ['payment_hosted', 'payment_custom', 'payment_subscriptions', 'payment_complex'].includes(
          id,
        ) &&
        [...features].filter((f) =>
          ['payment_hosted', 'payment_custom', 'payment_subscriptions', 'payment_complex'].includes(
            f,
          ),
        ).length > 1
      )
        hold = true;
      add(id, 1, hold);
      if (a.features.includes(id) && (!d.purpose?.trim() || !d.scope?.trim()))
        review(`${items[id]?.label}: details required`);
      if (
        [
          'newsletter',
          'live_chat',
          'reviews',
          'booking_embed',
          'payment_hosted',
          'payment_custom',
          'crm',
          'api',
          'automation',
        ].includes(id) &&
        !d.provider?.trim()
      )
        review(`${items[id]?.label}: provider required`);
      if (['api', 'payment_custom'].includes(id) || d.customSynchronisation) review(id);
    }
    if (a.packageId === 'shopify') {
      const sh = a.shopify;
      if (!sh) validationErrors.push('shopify');
      else {
        const ins =
          qty(sh.includedSimple, 'includedSimple') + qty(sh.includedVariable, 'includedVariable');
        const ex = qty(sh.extraSimple, 'extraSimple') + qty(sh.extraVariable, 'extraVariable');
        if (
          ins > p.shopifyRules.includedInitialProducts ||
          (ex && ins < p.shopifyRules.includedInitialProducts)
        )
          review('Product allowance allocation');
        if (sh.method === 'manual') {
          add(
            'product_simple',
            qty(sh.extraSimple, 'extraSimple'),
            ins !== p.shopifyRules.includedInitialProducts,
          );
          add(
            'product_variable',
            qty(sh.extraVariable, 'extraVariable'),
            ins !== p.shopifyRules.includedInitialProducts,
          );
        } else add(sh.method === 'csv' ? 'product_csv' : 'product_complex');
        if (qty(sh.complexCount, 'complexCount')) add('product_complex');
      }
    }
    const m = a.migration;
    if (m.required === 'yes') {
      const d = m.details ?? {};
      for (const key of ['pageCount', 'articleCount', 'redirectCount']) qty(d[key], key);
      const band = p.migrationRules.contentPageBands.find(
        (b) => d.pageCount >= b.min && d.pageCount <= b.max,
      );
      if (d.pageCount) band ? add(band.priceRef.split('.')[1]) : add('migration_complex');
      if (d.articleCount) {
        if (d.articleCount <= p.migrationRules.blogBand.max) add('migration_blog');
        else add('migration_complex');
        if (!blog) review('Blog migration destination required');
      }
      if (d.moveExistingService)
        a.packageId === 'shopify' ? add('migration_complex') : add('migration_hosting');
      if (
        d.redirectCount > 10 ||
        d.accessConfirmed !== 'yes' ||
        d.complex ||
        d.redirectsSupported === false
      )
        add('migration_complex');
    } else if (m.required !== 'no') add('migration_complex');
    if (a.visibility.mode === 'recommend') add('visibility_review');
    if (a.visibility.mode === 'advanced') {
      const vs = a.visibility.services;
      if (new Set(vs).size !== vs.length) validationErrors.push('Duplicate visibility service');
      const overlap = p.overlapRules.find((r) => r.id === 'visibility_overlap')!.itemIds!;
      const hold = vs.filter((id: string) => overlap.includes(id)).length > 1;
      for (const id of vs) {
        if (!(s.steps[3].questions[1] as any).options.some((o: any) => o.id === id)) {
          validationErrors.push(id);
          continue;
        }
        add(id, 1, hold && overlap.includes(id));
      }
    }
    add('revision_extra', qty(a.projectExtras.extraRevisionRounds, 'extraRevisionRounds'));
    add('design_concept', qty(a.projectExtras.extraConcepts, 'extraConcepts'));
    if (a.otherRequirements?.trim()) add('custom_requirement');
    if (a.support.additionalNeeds?.trim()) add('support_review');
    if (a.deadline?.trim()) review('Delivery feasibility');
  }
  const plan = plans[a.support.planId];
  const compatible = plan?.allowedPackages.includes(a.packageId);
  if (!compatible) validationErrors.push('Incompatible support plan');
  const knownSubtotalMinor =
    custom || !pack ? null : lines.reduce((sum, l) => sum + (l.amountMinor ?? 0), 0);
  const fullTotalMinor = validationErrors.length || reviewFlags.length ? null : knownSubtotalMinor;
  const percentages = p.commercialTerms.paymentSchedule.map((v) => v.percent);
  const first =
      fullTotalMinor === null ? null : Math.round((fullTotalMinor * percentages[0]) / 100),
    second = fullTotalMinor === null ? null : Math.round((fullTotalMinor * percentages[1]) / 100);
  return {
    answers: structuredClone(a),
    lines,
    reviewFlags,
    validationErrors,
    knownSubtotalMinor,
    fullTotalMinor,
    monthlySubtotalMinor: compatible ? plan.amountMinor : null,
    plan: compatible ? plan : null,
    pack,
    taxMinor: null,
    grossTotalMinor: null,
    milestonesMinor:
      fullTotalMinor === null ? null : [first!, second!, fullTotalMinor - first! - second!],
    status: validationErrors.length
      ? 'invalid_input'
      : reviewFlags.length
        ? 'requires_review'
        : 'estimated',
  };
}
export type Estimate = ReturnType<typeof calculate>;
