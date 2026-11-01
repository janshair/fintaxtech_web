import { z } from 'astro/zod';
import rawServices from '../../content/ai-automation-estimate/services.json';
import rawPricing from '../../content/ai-automation-estimate/pricing.json';
const amount = z.number().int().nonnegative().max(1000000);
export const pricingSchema = z.object({
  schemaVersion: z.literal('fintaxtech-ai-automation-pricing-v1'),
  currency: z.literal('GBP'),
  vatTreatment: z.literal('to_be_confirmed'),
  starter: z.object({
    price: amount,
    includedWorkflows: amount,
    includedStandardSteps: amount,
    includedSupportedConnections: amount,
    includedRevisions: amount,
    defectWarrantyDays: amount,
    targetDeliveryWorkingDays: z.object({ min: amount, max: amount }),
    includes: z.array(z.string()),
  }),
  addOns: z.object({
    additionalStandardStep: z.object({ price: amount, unit: z.literal('step') }),
    additionalSupportedConnection: z.object({ price: amount, unit: z.literal('connection') }),
    additionalIndependentWorkflow: z.object({
      startingPrice: amount,
      unit: z.literal('workflow'),
      manualReview: z.literal(true),
    }),
    knowledgeBaseSetup: z.object({ price: amount, maxApprovedFaqEntries: amount }),
    additionalDocumentTemplate: z.object({ price: amount, unit: z.literal('template') }),
  }),
  supportPlans: z
    .array(
      z.object({
        id: z.enum(['self', 'care', 'plus']),
        name: z.string(),
        monthlyPrice: amount,
        monitoring: z.boolean(),
        minorChangesMinutesPerMonth: amount.optional(),
      }),
    )
    .length(3),
  manualReviewTriggers: z.array(z.string()),
  thirdPartyCostsIncluded: z.literal(false),
  pdf: z.object({
    clientSideOnly: z.literal(true),
    label: z.string(),
    nonBinding: z.literal(true),
    requiresEmail: z.literal(false),
  }),
  pricingRules: z.array(z.string()),
});
export const servicesSchema = z.object({
  schemaVersion: z.literal('fintaxtech-ai-automation-services-v1'),
  route: z.literal('/estimate/ai-automation/'),
  steps: z.array(z.object({ id: z.string(), title: z.string() })).length(6),
  services: z
    .array(z.object({ id: z.string(), title: z.string(), description: z.string() }))
    .length(4),
  discoveryChoice: z.object({
    id: z.literal('unsure'),
    title: z.string(),
    requiresDescription: z.literal(true),
  }),
  websiteAssistant: z.record(z.string(), z.array(z.string())),
});
export const pricing = pricingSchema.parse(rawPricing);
export const services = servicesSchema.parse(rawServices);
