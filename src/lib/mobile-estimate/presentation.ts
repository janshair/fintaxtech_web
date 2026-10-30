import { mobileEstimateCopy as c, mobileServices } from '../../content/mobile-estimate';
import type { Line, MobileEstimate } from './types';
export const money = (pence: number) =>
  new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(pence / 100);
export const issueDate = (iso: string) =>
  new Intl.DateTimeFormat('en-GB', { dateStyle: 'long', timeZone: 'Europe/London' }).format(
    new Date(iso),
  );
export function lineAmount(line: Line): string {
  if (line.amount_pence === null) return line.price_mode === 'manual_quote' ? c.manual : c.pending;
  if (line.price_mode === 'included') return c.included;
  let value = money(line.amount_pence);
  if (line.price_mode === 'from') value = c.from(value);
  if (line.price_mode === 'provisional') value += ` — ${c.provisional}`;
  return line.charge_type === 'monthly' ? c.perMonth(value) : value;
}
export function pendingMessages(e: MobileEstimate): string[] {
  return [
    ...e.lines
      .filter((line) => line.amount_pence === null)
      .map((line) => `${line.label}: ${lineAmount(line)}`),
    ...(['not_assessed', 'undecided', 'existing'].includes(String(e.answers.existing_system))
      ? [c.integrationPending]
      : []),
    ...(String(e.answers.other_requirements).trim() ? [c.otherPending] : []),
  ];
}
export function maintenanceDescription(e: MobileEstimate): string {
  const question = mobileServices.steps
    .flatMap((step) => step.questions)
    .find((q) => q.id === 'maintenance')!;
  return question.options!.find((o) => o.id === e.answers.maintenance)?.description ?? '';
}

export function monthlyAmount(e: MobileEstimate): string {
  return e.lines.some((line) => line.charge_type === 'monthly' && line.amount_pence === null)
    ? c.pending
    : c.perMonth(money(e.monthly_subtotal_pence));
}
