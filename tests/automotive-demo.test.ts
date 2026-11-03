import { describe, it, expect } from 'vitest';
import { PRICES, automotiveDemo as c } from '../src/content/automotive-demo';

describe('Vector Motorworks services and prices', () => {
  it('lists the services in the agreed order', () => {
    expect(c.services.items.map((item) => item.name)).toEqual([
      'MOT',
      'Full service',
      'Interim service',
      'Oil & filter change',
      'MOT + service',
      'Diagnostics',
      'Brakes',
      'Clutch & gearbox',
      'Tyres',
      'Exhausts',
      'Timing belt',
      'Air con regas',
    ]);
    expect(c.services.items.filter((item) => 'badge' in item).map((item) => item.code)).toEqual([
      'combo',
    ]);
  });
  it('never gives a repair that depends on the car a fixed price', () => {
    const repairs = c.services.items.filter((item) => item.repair);
    expect(repairs.map((item) => item.code)).toEqual([
      'brakes',
      'clutch',
      'exhausts',
      'timing-belt',
    ]);
    for (const item of repairs) {
      expect(item.price).toBe('Free quote');
      expect(item.code in PRICES).toBe(false);
    }
  });
  it('takes every shown price from the one PRICES config', () => {
    const prices: readonly string[] = Object.values(PRICES);
    for (const item of c.services.items.filter((item) => !item.repair))
      expect(prices).toContain(item.price);
    expect(PRICES.mot).toBe('£54.85');
  });
  it('uses plain UK garage wording and realistic example content', () => {
    const copy = JSON.stringify(c);
    expect(copy).not.toMatch(/maintenance|auto care solution|road ahead|understanding the cause/i);
    expect(copy).not.toMatch(/Your number here|Your address here|reviews appear here/);
    expect(c.process.steps.map(([title]) => title)).toEqual([
      'Book in',
      'We check and call you',
      'Fixed and ready',
    ]);
    expect(c.reviews.items).toHaveLength(3);
    expect(c.reviews.label).toBe('Example review');
  });
  it('keeps accreditation slots switched off by default', () => {
    expect(c.accreditations.map((item) => item.name)).toEqual([
      'Good Garage Scheme',
      'The Motor Ombudsman',
      'IMI (Institute of the Motor Industry)',
      'Bosch Car Service',
    ]);
    expect(c.accreditations.every((item) => !item.show)).toBe(true);
  });
});
