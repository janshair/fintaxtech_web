export const estimateCurrencies = {
  GBP: { label: 'GBP — British pound', numerator: 1, denominator: 1 },
  USD: { label: 'USD — US dollar', numerator: 135, denominator: 100 },
  PKR: { label: 'PKR — Pakistani rupee', numerator: 135, denominator: 1 },
} as const;
export const estimateKinds = ['branding', 'mobile', 'website', 'ai-automation'] as const;
export const estimateCurrencyPaths = ['usd', 'pkr'] as const;
