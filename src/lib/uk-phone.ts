// The same rule as the template demos' ?phone: UK numbers display nationally
// (07526 699217) and link internationally (447526699217); other countries keep
// their +code. Only digits, spaces, brackets and a leading + are accepted.
export interface Phone {
  display: string;
  international: string;
}
export function ukPhone(raw: string): Phone | null {
  const value = raw.trim();
  if (!value || value.length > 20 || !/^\+?[\d ()]+$/.test(value)) return null;
  let digits = value.replace(/\D/g, '');
  if (value.startsWith('+')) {
    if (digits.startsWith('44')) digits = digits.slice(2).replace(/^0/, '');
    else if (digits.length >= 8 && digits.length <= 15)
      return { display: value.replace(/\s+/g, ' '), international: digits };
    else return null;
  } else if (digits.startsWith('44') && digits.length === 12) digits = digits.slice(2);
  else if (digits.startsWith('0')) digits = digits.slice(1);
  else return null;
  if (digits.length < 9 || digits.length > 10) return null;
  const national = '0' + digits;
  const groups = national.startsWith('02')
    ? [3, 4, 4]
    : /^01\d1|^011/.test(national)
      ? [4, 3, 4]
      : [5, 6];
  let index = 0;
  const display = groups
    .map((size) => national.slice(index, (index += size)))
    .filter(Boolean)
    .join(' ');
  return { display, international: '44' + digits };
}
