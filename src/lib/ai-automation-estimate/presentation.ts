import { aiEstimateCopy as c } from '../../content/ai-automation-estimate';
import { pricing as p } from './config';
import type { Estimate } from './calculate';
import { summary } from './answers';
export const money = (n: number | null) =>
  n === null
    ? c.pending
    : new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(n / 100);
export function supportDescription(plan: Estimate['plan']) {
  return `${c.supportDescriptions[plan.id]}${plan.minorChangesMinutesPerMonth ? ' ' + c.minutes(plan.minorChangesMinutesPerMonth) : ''}`;
}
export function estimateText(e: Estimate): string[] {
  return [
    c.disclaimer,
    `${c.reference}: ${e.reference}`,
    `${c.date}: ${new Date(e.preparedAt).toLocaleDateString('en-GB', { timeZone: 'Europe/London' })} (Europe/London)`,
    `${c.version}: ${e.versions.join(' / ')}`,
    e.service,
    ...e.lines.map(
      (l) =>
        `${l.label}: ${c.quantity} ${l.quantity} · ${c.unit} ${l.from ? c.from + ' ' : ''}${money(l.unitPence)} · ${c.lineTotal} ${l.from ? c.from + ' ' : ''}${money(l.amountPence)}`,
    ),
    `${c.implementation}: ${e.isStartingFrom ? c.from + ' ' : ''}${money(e.knownPence)}`,
    `${c.monthly}: ${e.plan.name} — ${money(e.monthlyPence)}/month`,
    supportDescription(e.plan),
    ...(e.isStartingFrom ? [c.minimum] : []),
    ...(!e.completePrice
      ? [
          c.status,
          c.incomplete,
          ...e.reviewFlags.map((id) => `${c.pending}: ${c.reviewReasons[id]}`),
        ]
      : []),
    c.thirdParty,
    c.vat,
    c.scopeCaveat,
    ...p.starter.includes.map((id) => c.starterInclusions[id as keyof typeof c.starterInclusions]),
    c.scopeNote,
    c.delivery(p.starter.targetDeliveryWorkingDays.min, p.starter.targetDeliveryWorkingDays.max),
    c.revision(p.starter.includedRevisions),
    c.warranty(p.starter.defectWarrantyDays),
    c.extraWork,
    c.safety,
    c.nextSteps,
    c.requirements,
    ...summary(e.answers),
  ];
}
