// Build/server only. Never import this module from a browser controller.
import original from '../../content/mobile-estimate/pricing.json' with { type: 'json' };
import { mobileServices } from '../../content/mobile-estimate';
import { pricingSchema, calculationConfigSchema, type CalculationConfig } from './schema';
export const mobilePricing = pricingSchema.parse(original);
if (
  mobilePricing.compatible_services_version !== mobileServices.version ||
  mobileServices.compatible_pricing_version !== mobilePricing.version
)
  throw new Error('Incompatible mobile configuration versions');
const features = mobileServices.steps
  .flatMap((step) => step.questions)
  .find((q) => q.id === 'features')!.options!;
for (const feature of features)
  if (!mobilePricing.catalogue[`feature.${feature.id}`])
    throw new Error(`Unpriced feature: ${feature.id}`);
// Browser pricing was explicitly approved on 29 October 2026. Publish only the data
// required for this local calculator, not source metadata, audit references or contracts.
export function publicCalculationConfig(): CalculationConfig {
  const p = mobilePricing;
  return calculationConfigSchema.parse({
    version: p.version,
    compatible_services_version: p.compatible_services_version,
    currency: p.currency,
    catalogue: Object.fromEntries(
      Object.entries(p.catalogue).filter(
        ([id]) => !['qa.extended', 'qa.advanced', 'backend.existing'].includes(id),
      ),
    ),
    calculation: {
      version: p.calculation.version,
      components: p.calculation.components.map((component) =>
        component.selection !== 'first_match'
          ? component
          : {
              ...component,
              choices: component.choices.filter(
                (choice) =>
                  !['qa.extended', 'qa.advanced', 'backend.existing'].includes(choice.item_id),
              ),
            },
      ),
    },
    backend_recommendation: {
      rules: p.backend_recommendation.rules.filter((rule) => !rule.tier_from),
    },
    vat: {
      registration_status: p.vat.registration_status,
      registration_verified: p.vat.registration_verified,
      registration_number: p.vat.registration_number ? 'verified' : null,
      registration_verified_at: p.vat.registration_verified_at,
      registration_verification_reference: p.vat.registration_verification_reference
        ? 'verified'
        : null,
      transaction_treatment: p.vat.transaction_treatment,
      rate_basis_points: p.vat.rate_basis_points,
      rate_verified_at: p.vat.rate_verified_at,
      default_auto_add: p.vat.default_auto_add,
      unverified_output: p.vat.unverified_output,
    },
    internal_validation: { rules: p.internal_validation.rules },
  });
}
