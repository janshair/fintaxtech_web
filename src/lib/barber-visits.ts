// Public campaign codes must be opaque, not prospect names, emails or phone numbers.
export function referenceCodes(value: string): string[] {
  const codes = value
    .split(',')
    .map((code) => code.trim())
    .filter(Boolean);
  if (codes.length > 100 || codes.some((code) => !/^[A-Z][A-Z0-9_-]{2,23}$/.test(code)))
    throw new Error(
      'Use up to 100 opaque reference codes, 3–24 uppercase letters/digits/_/-, starting with a letter.',
    );
  return [...new Set(codes)];
}

export function visitEndpoint(value: string): string {
  if (!value) return '';
  const url = new URL(value);
  if (
    url.protocol !== 'https:' ||
    !(url.hostname === 'fintaxtech.co.uk' || url.hostname.endsWith('.fintaxtech.co.uk')) ||
    url.username ||
    url.password ||
    url.search ||
    url.hash ||
    url.port ||
    url.pathname !== '/visits'
  )
    throw new Error(
      'Visit endpoint must be https://<your FinTaxTech host>/visits without query parameters.',
    );
  return url.href;
}
