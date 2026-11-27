export const estimateCurrencies = {
  GBP: { label: 'GBP — British pound', numerator: 1, denominator: 1 },
  USD: { label: 'USD — US dollar', numerator: 135, denominator: 100 },
  PKR: { label: 'PKR — Pakistani rupee', numerator: 135, denominator: 1 },
} as const;
export const estimateKinds = ['branding', 'mobile', 'website', 'ai-automation'] as const;
export const estimateCurrencyPaths = ['usd', 'pkr'] as const;

export type EstimateKind = (typeof estimateKinds)[number];
export const proposalDescription =
  'Tell us what you need. We review the details before preparing a written proposal.';
export const proposalServices = {
  branding: { service: 'branding', title: 'Branding project enquiry' },
  mobile: { service: 'mobile-apps', title: 'Mobile app project enquiry' },
  website: { service: 'websites', title: 'Website project enquiry' },
  'ai-automation': { service: 'ai-automation', title: 'AI automation project enquiry' },
} as const satisfies Record<EstimateKind, { service: string; title: string }>;
