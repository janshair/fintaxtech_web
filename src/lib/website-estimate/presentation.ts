import { formatMoney, convertedParts, type EstimateCurrency } from '../estimate-currency';
import { pricing as p, services as s } from './config';
import { websiteEstimateCopy as c } from '../../content/website-estimate';
import type { Estimate } from './calculate';
export const money = (n: number | null, currency: EstimateCurrency = 'GBP') =>
  n === null ? c.pending : formatMoney(n, currency);
export function estimateText(e: Estimate, currency: EstimateCurrency = 'GBP'): string[] {
  const money = (v: number | null) => (v === null ? c.pending : formatMoney(v, currency));
  return [
    s.steps[5].notice!,
    ...(e.fullTotalMinor === null ? [c.fullPending] : []),
    ...e.lines.map(
      (l) =>
        `${l.label}${l.quantity > 1 ? ` × ${l.quantity}` : ''}: ${money(l.amountMinor)}${l.startingAtMinor ? ` (${c.from} ${money(l.startingAtMinor)})` : ''}`,
    ),
    `${c.known}: ${money(e.knownSubtotalMinor)}`,
    `${c.monthly}: ${money(e.monthlySubtotalMinor)}/month`,
    p.tax.display,
    ...e.reviewFlags.map((v) => `${e.pack?.fixedScope ? c.fixedReview : c.pending}: ${v}`),
    ...e.validationErrors.map((v) => `${c.error} ${v}`),
    `${c.timeline}: ${e.pack?.timelineWeeks ? `${e.pack.timelineWeeks.min}–${e.pack.timelineWeeks.max} ${c.weeks}` : e.pack?.fixedScope ? c.timingPending : c.pending}`,
    p.commercialTerms.timelineQualification,
    ...p.commercialTerms.timelineStartsAfter,
    `${c.milestones}: ${
      e.milestonesMinor
        ? convertedParts(e.milestonesMinor, currency)
            .map(
              (n, i) =>
                `${p.commercialTerms.paymentSchedule[i].percent}% — ${new Intl.NumberFormat('en-GB', { style: 'currency', currency, currencyDisplay: currency === 'GBP' ? 'symbol' : 'code', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n / 100)} (${p.commercialTerms.paymentSchedule[i].due})`,
            )
            .join('; ')
        : c.milestonePending
    }`,
    `${c.warranty}: ${p.commercialTerms.warranty.covers}. ${p.commercialTerms.warranty.starts}.`,
    ...p.commercialTerms.warranty.excludes,
    p.commercialTerms.revisionDefinition,
    `${c.includedRevisions}: ${e.pack?.designRevisionRounds ?? c.pending}`,
    p.commercialTerms.scopeChanges,
    ...(e.pack?.fixedScope ? [c.notIncluded, ...e.pack.exclusions] : [s.steps[4].policyCopy!]),
    ...(e.pack?.fixedScope ? [] : p.commercialTerms.excludedUnlessStated),
    ...(e.plan?.includes ?? []),
    ...(e.pack?.fixedScope ? [c.included] : []),
    ...(e.pack?.includedCapabilities ?? []).map((id: string) => (s.capabilityLabels as any)[id]),
    ...p.commercialTerms.customerResponsibilities,
  ];
}
