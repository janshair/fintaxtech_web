import { estimateCurrencies } from '../content/estimate-currency';
export type EstimateCurrency = keyof typeof estimateCurrencies;
export function convertMinor(minor: number, currency: EstimateCurrency = 'GBP'): number {
  if (!Object.hasOwn(estimateCurrencies, currency) || !Number.isSafeInteger(minor) || minor < 0)
    throw Error('Invalid currency amount');
  const r = estimateCurrencies[currency];
  const result = Number(
    (BigInt(minor) * BigInt(r.numerator) * 2n + BigInt(r.denominator)) /
      (2n * BigInt(r.denominator)),
  );
  if (!Number.isSafeInteger(result)) throw Error('Currency amount too large');
  return result;
}
export function formatMoney(minor: number, currency: EstimateCurrency = 'GBP') {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency,
    currencyDisplay: currency === 'GBP' ? 'symbol' : 'code',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(convertMinor(minor, currency) / 100);
}
export function currencyFromPath(path: string): EstimateCurrency {
  const match = /^\/estimate\/(branding|mobile|website|ai-automation)\/(usd|pkr)\/?$/.exec(path);
  return match ? (match[2].toUpperCase() as EstimateCurrency) : 'GBP';
}
export function convertedParts(parts: number[], currency: EstimateCurrency) {
  const total = convertMinor(
    parts.reduce((a, b) => a + b, 0),
    currency,
  );
  const converted = parts.map((v) => convertMinor(v, currency));
  if (converted.length)
    converted[converted.length - 1] = total - converted.slice(0, -1).reduce((a, b) => a + b, 0);
  return converted;
}
