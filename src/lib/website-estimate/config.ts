import { z } from 'astro/zod';
import servicesData from '../../content/website-estimate/services.json';
import pricingData from '../../content/website-estimate/pricing.json';
const amount = z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER);
const price = z
  .object({
    label: z.string(),
    amountMinor: amount.nullable(),
    kind: z.enum(['fixed', 'unit', 'from', 'manual', 'included']).optional(),
  })
  .catchall(z.unknown());
export const pricingSchema = z
  .object({
    schemaVersion: z.literal('1.0.0'),
    configId: z.string(),
    currency: z.literal('GBP'),
    packages: z.record(z.string(), price),
    items: z.record(z.string(), price),
    monthlyPlans: z.record(z.string(), price),
    tax: z
      .object({
        status: z.string(),
        vatRegistered: z.boolean().nullable(),
        rateBasisPoints: amount.nullable(),
        display: z.string(),
      })
      .catchall(z.unknown()),
  })
  .catchall(z.unknown());
pricingSchema.parse(pricingData);
export const pricing = pricingData;
export const services = servicesData;
if (services.configId !== pricing.configId || services.steps.length !== 6)
  throw Error('Incompatible website configuration');
function references(value: unknown): void {
  if (!value || typeof value !== 'object') return;
  for (const [key, v] of Object.entries(value)) {
    if (
      (key === 'priceRef' || key === 'reviewPriceRef') &&
      typeof v === 'string' &&
      !get(pricing, v)
    )
      throw Error(`Unknown reference ${v}`);
    references(v);
  }
}
references(services);
export function get(object: unknown, path: string): any {
  return path
    .split('.')
    .reduce((v: any, k) => (v && Object.hasOwn(v, k) ? v[k] : undefined), object);
}
export function condition(c: any, a: any): boolean {
  if (!c) return true;
  if (c.all) return c.all.every((v: any) => condition(v, a));
  if (c.any) return c.any.some((v: any) => condition(v, a));
  if (c.not) return !condition(c.not, a);
  const v = get(a, c.field);
  if (v === undefined) return false;
  switch (c.op) {
    case 'eq':
      return v === c.value;
    case 'in':
      return c.value.includes(v);
    case 'contains':
      return Array.isArray(v) && v.includes(c.value);
    case 'notEmpty':
      return typeof v === 'string' ? !!v.trim() : Array.isArray(v) && v.length > 0;
    case 'gt':
      return typeof v === 'number' && v > c.value;
    case 'true':
      return v === true;
    default:
      throw Error('Unsupported condition');
  }
}
