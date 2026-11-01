import { pricing as p, services } from './config';
import { validateAnswers } from './answers';
import {
  aiEstimateCopy as c,
  bookingRelevant,
  enquiriesRelevant,
} from '../../content/ai-automation-estimate';
/** Maintainer assessment only, never inferred from customer tasks/tools or exposed as customer approval. */
export interface ScopeAssessment {
  standardSteps?: number;
  supportedConnections?: number;
}
export function calculate(input: unknown, scope: ScopeAssessment = {}) {
  const a = validateAnswers(input);
  for (const value of Object.values(scope))
    if (value !== undefined && (!Number.isSafeInteger(value) || value < 0 || value > 1000))
      throw Error(c.error);
  const flags = new Set<keyof typeof c.reviewReasons>();
  const lines: {
    id: string;
    label: string;
    quantity: number;
    unitPence: number;
    amountPence: number;
    from: boolean;
  }[] = [];
  const add = (id: string, label: string, quantity: number, rate: number, from = false) => {
    if (quantity && a.service !== 'unsure')
      lines.push({
        id,
        label,
        quantity,
        unitPence: rate * 100,
        amountPence: quantity * rate * 100,
        from,
      });
  };
  if (a.service !== 'unsure') add('starter', c.starter, 1, p.starter.price);
  // Scope counts cannot be supplied as questionnaire answers. No frontend approval is claimed.
  if (scope.standardSteps === undefined || scope.supportedConnections === undefined)
    flags.add('unknown_scope');
  if (scope.standardSteps !== undefined)
    add(
      'steps',
      c.extraSteps,
      Math.max(0, scope.standardSteps - p.starter.includedStandardSteps),
      p.addOns.additionalStandardStep.price,
    );
  if (scope.supportedConnections !== undefined)
    add(
      'connections',
      c.extraConnections,
      Math.max(0, scope.supportedConnections - p.starter.includedSupportedConnections),
      p.addOns.additionalSupportedConnection.price,
    );
  if (a.knowledge === 'faq_setup')
    add('knowledge', c.faqSetup, 1, p.addOns.knowledgeBaseSetup.price);
  if (a.service === 'document_automation')
    add(
      'templates',
      c.extraTemplates,
      a.additionalTemplates,
      p.addOns.additionalDocumentTemplate.price,
    );
  add(
    'workflows',
    c.extraWorkflows,
    a.additionalWorkflows,
    p.addOns.additionalIndependentWorkflow.startingPrice,
    true,
  );
  if (a.additionalWorkflows) flags.add('additional_workflows');
  if (a.service === 'unsure') flags.add('unknown_scope');
  if (a.usage === 'over_500' || a.usage === 'unknown') flags.add('high_volume_processing');
  if (a.knowledge === 'complex' || a.sources === 'need_help') flags.add('complex_knowledge');
  if (a.tools.includes('other')) flags.add('unsupported_integration');
  if (enquiriesRelevant(a) && ['multiple', 'unsure'].includes(a.destination ?? ''))
    flags.add('complex_api');
  if (bookingRelevant(a)) {
    flags.add('booking');
    if (a.bookingMode === 'direct_booking') flags.add('direct_booking_unverified');
  }
  if (a.outcomes.includes('recommendations') || a.capabilities.includes('recommendations'))
    flags.add('complex_recommendations');
  if (a.capabilities.includes('multilingual')) flags.add('complex_logic');
  if (a.capabilities.includes('file_upload')) flags.add('file_upload');
  if (a.sensitivity !== 'ordinary') flags.add('sensitive_data');
  if (a.outcomes.includes('other') || a.notes?.trim()) flags.add('custom_requirement');
  const plan = p.supportPlans.find((v) => v.id === a.support)!;
  return {
    answers: a,
    lines,
    knownPence:
      a.service === 'unsure' ? null : lines.reduce((sum, line) => sum + line.amountPence, 0),
    monthlyPence: plan.monthlyPrice * 100,
    plan,
    reviewFlags: [...flags],
    isStartingFrom: lines.some((v) => v.from),
    completePrice: flags.size === 0,
    service:
      services.services.find((v) => v.id === a.service)?.title ?? services.discoveryChoice.title,
    reference: `FTT-AI-${crypto.randomUUID().toUpperCase()}`,
    preparedAt: new Date().toISOString(),
    versions: [services.schemaVersion, p.schemaVersion],
  };
}
export type Estimate = ReturnType<typeof calculate>;
