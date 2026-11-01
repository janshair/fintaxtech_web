// Input formats shared by every template brief. Each normaliser returns the
// tidy form, or null when the value cannot be understood. They are idempotent,
// so the browser can tidy on blur and the outputs can tidy again safely.

// Trim and collapse runs of spaces; line breaks and punctuation are kept as typed.
export const tidy = (value: string) =>
  value
    .replace(/\r\n?/g, '\n')
    .replace(/[^\S\n]+/g, ' ')
    .replace(/ *\n */g, '\n')
    .trim();

// "40", "40 min", "90 mins", "1 h 30", "1h30", "1:30", "2 hours" → "40 min", "1 hr 30 min", "2 hr".
// A leading + marks an add-on, as in "+15 min".
export function normalizeDuration(raw: string): string | null {
  const addOn = tidy(raw).startsWith('+') ? '+' : '';
  const value = tidy(raw)
    .replace(/^\+\s*/, '')
    .toLowerCase();
  let minutes: number | undefined;
  const plain = value.match(/^(\d{1,3})\s*(?:m|min|mins|minutes?)?$/);
  const clock = value.match(/^(\d{1,2}):([0-5]\d)$/);
  const hours = value.match(
    /^(\d{1,2})\s*(?:h|hr|hrs|hours?)\.?(?:\s*(?:and\s*)?(\d{1,2})\s*(?:m|min|mins|minutes?)?)?$/,
  );
  if (plain) minutes = Number(plain[1]);
  else if (clock) minutes = Number(clock[1]) * 60 + Number(clock[2]);
  else if (hours && Number(hours[2] ?? 0) < 60)
    minutes = Number(hours[1]) * 60 + Number(hours[2] ?? 0);
  if (minutes === undefined || minutes < 1 || minutes > 600) return null;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return addOn + (h ? `${h} hr${m ? ` ${m} min` : ''}` : `${m} min`);
}
export const durationMessage = 'Enter a length in minutes, like 40 or 1 h 30 (up to 10 hours).';

export interface PriceRule {
  // Exact wordings allowed instead of an amount, like "By quotation" or "POA".
  words?: readonly string[];
  // Allow a unit after the amount, like "£20 / hour" or "From £350 / month".
  per?: boolean;
}
// "£ 30" → "£30", "from £30" → "From £30", "£20 per hour" → "£20 / hour". Amounts keep their digits.
export function normalizePrice(raw: string, rule: PriceRule = {}): string | null {
  const value = tidy(raw);
  const word = rule.words?.find((item) => item.toLowerCase() === value.toLowerCase());
  if (word) return word;
  const match = value.match(
    /^(from\s+)?£\s?(\d{1,3}(?:,\d{3})*|\d{1,6})(\.\d{2})?(?:\s*(?:\/|per)\s*([a-z][a-z -]{1,18}[a-z]))?$/i,
  );
  if (!match || (match[4] && !rule.per)) return null;
  return `${match[1] ? 'From ' : ''}£${match[2]}${match[3] ?? ''}${match[4] ? ` / ${match[4].toLowerCase()}` : ''}`;
}
export const priceMessage = (rule: PriceRule = {}) =>
  `Enter a price like £30 or From £30${rule.per ? ', or £20 / hour' : ''}${
    rule.words?.length ? `, or ${rule.words.map((word) => `“${word}”`).join(' or ')}` : ''
  }.`;

// UK postcodes, upper-cased with one space: "dd24dx" → "DD2 4DX".
export function normalizePostcode(raw: string): string | null {
  const match = tidy(raw)
    .toUpperCase()
    .replace(/\s+/g, '')
    .match(/^([A-Z]{1,2}\d[A-Z\d]?)(\d[A-Z]{2})$/);
  return match ? `${match[1]} ${match[2]}` : null;
}
export const postcodeMessage = 'Enter a UK postcode, like DD2 4DX.';

export const weekDays = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
] as const;
export const hourStatuses = ['Open', 'Closed', 'By appointment'] as const;
export interface DayHours {
  status?: string;
  opens?: string;
  closes?: string;
  overnight?: string;
  note?: string;
}
// The value shown for one day: "09:00 – 19:00", "Closed" or "By appointment", plus any note.
export function dayHoursText(day: DayHours) {
  const base = day.status === 'Open' ? `${day.opens} – ${day.closes}` : (day.status ?? '');
  const note = tidy(day.note ?? '');
  return note ? `${base} (${note})` : base;
}
export function hoursProblem(day: DayHours): string | undefined {
  if (day.status !== 'Open') return;
  if (
    !/^([01]\d|2[0-3]):[0-5]\d$/.test(day.opens ?? '') ||
    !/^([01]\d|2[0-3]):[0-5]\d$/.test(day.closes ?? '')
  )
    return 'Enter an opening and a closing time for each open day.';
  if (day.closes! <= day.opens! && day.overnight !== 'Yes')
    return 'Closing time must be after opening time. Tick “Closes after midnight” for late nights.';
}
// Consecutive days with the same hours become one range, as the content files write them:
// [["Monday – Friday", "09:00 – 19:00"], ["Saturday", "09:00 – 16:00"], ["Sunday", "Closed"]].
export function groupHours(days: DayHours[]): [string, string][] {
  const groups: [string, string][] = [];
  let start = 0;
  for (let index = 1; index <= days.length; index++) {
    const value = dayHoursText(days[start]);
    if (index < days.length && dayHoursText(days[index]) === value) continue;
    const label =
      index - 1 === start ? weekDays[start] : `${weekDays[start]} – ${weekDays[index - 1]}`;
    groups.push([label, value]);
    start = index;
  }
  return groups;
}
