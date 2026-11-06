import { pricing, get, websiteStep } from './config';
import { initialAnswers, type Answers, type Line } from './calculate';
export function calculateFixedScope(a: Answers, pack: any) {
  const validationErrors: string[] = [];
  const brief = a.packageBriefs?.[a.packageId] ?? {};
  for (let step = 1; step < 6; step++)
    for (const q of websiteStep(step, a.packageId).questions) {
      const v = get(a, q.id);
      if (q.required && (typeof v !== 'string' || !v.trim())) validationErrors.push(q.label);
      if (
        typeof v === 'string' &&
        (v.length > 5000 || /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/u.test(v))
      )
        validationErrors.push(q.label);
      if (q.options && v !== undefined && !q.options.some((o: any) => o.id === v))
        validationErrors.push(q.label);
      if (q.type === 'email' && typeof v === 'string' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v))
        validationErrors.push(q.label);
      if (
        q.type === 'tel' &&
        typeof v === 'string' &&
        (!/^[+\d\s().-]+$/.test(v) ||
          v.replace(/\D/g, '').length < 7 ||
          v.replace(/\D/g, '').length > 15)
      )
        validationErrors.push(q.label);
    }
  const reviewFlags = [pack.timingNotice];
  if (brief.logo === 'not_ready') reviewFlags.push(pack.logoNotice);
  if (brief.outsideScope?.trim()) reviewFlags.push(pack.upgradeNotice);
  const lines: Line[] = [
    { id: a.packageId, label: pack.label, quantity: 1, amountMinor: pack.amountMinor },
  ];
  const fullTotalMinor =
    validationErrors.length || brief.logo === 'not_ready' || brief.outsideScope?.trim()
      ? null
      : (pack.amountMinor as number);
  const schedule = pricing.commercialTerms.paymentSchedule;
  const first =
    fullTotalMinor === null ? null : Math.round((fullTotalMinor * schedule[0].percent) / 100);
  const second =
    fullTotalMinor === null ? null : Math.round((fullTotalMinor * schedule[1].percent) / 100);
  return {
    answers: {
      ...initialAnswers(),
      packageId: a.packageId,
      packageBriefs: { [a.packageId]: structuredClone(brief) },
    },
    lines,
    reviewFlags,
    validationErrors,
    knownSubtotalMinor: pack.amountMinor as number,
    fullTotalMinor,
    monthlySubtotalMinor: 0,
    plan: pricing.monthlyPlans.none,
    pack,
    taxMinor: null,
    grossTotalMinor: null,
    milestonesMinor:
      fullTotalMinor === null ? null : [first!, second!, fullTotalMinor - first! - second!],
    status: validationErrors.length ? 'invalid_input' : 'requires_review',
  };
}
