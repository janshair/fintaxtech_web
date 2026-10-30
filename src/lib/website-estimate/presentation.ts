import { pricing as p, services as s } from './config';
import { websiteEstimateCopy as c } from '../../content/website-estimate';
import type { Estimate } from './calculate';
export const money = (n: number | null) =>
  n === null
    ? c.pending
    : new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(n / 100);
export function estimateText(e: Estimate): string[] {
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
    ...e.reviewFlags.map((v) => `${c.pending}: ${v}`),
    ...e.validationErrors.map((v) => `${c.error} ${v}`),
    `${c.timeline}: ${e.pack?.timelineWeeks ? `${e.pack.timelineWeeks.min}–${e.pack.timelineWeeks.max} ${c.weeks}` : c.pending}`,
    p.commercialTerms.timelineQualification,
    ...p.commercialTerms.timelineStartsAfter,
    `${c.milestones}: ${e.milestonesMinor ? e.milestonesMinor.map((n, i) => `${p.commercialTerms.paymentSchedule[i].percent}% — ${money(n)} (${p.commercialTerms.paymentSchedule[i].due})`).join('; ') : c.milestonePending}`,
    `${c.warranty}: ${p.commercialTerms.warranty.covers}. ${p.commercialTerms.warranty.starts}.`,
    ...p.commercialTerms.warranty.excludes,
    p.commercialTerms.revisionDefinition,
    `${c.includedRevisions}: ${e.pack?.designRevisionRounds ?? c.pending}`,
    p.commercialTerms.scopeChanges,
    s.steps[4].policyCopy!,
    ...p.commercialTerms.excludedUnlessStated,
    ...(e.plan?.includes ?? []),
    ...(e.pack?.includedCapabilities ?? []).map((id: string) => (s.capabilityLabels as any)[id]),
    ...p.commercialTerms.customerResponsibilities,
  ];
}
