import { describe, it, expect } from 'vitest';
import { PRICES, automotiveDemo as c } from '../src/content/automotive-demo';

describe('Vector Motorworks services and prices', () => {
  it('lists the services in the agreed order', () => {
    expect(c.services.items.map((item) => item.name)).toEqual([
      'MOT',
      'Interim service',
      'Full service',
      'Oil & filter change',
      'MOT + service combo',
      'Diagnostics / warning lights',
      'Brakes, pads & discs',
      'Clutch & gearbox',
      'Timing belt / wet belt',
      'Tyres',
      'Air con regas',
    ]);
  });
  it('never gives a repair that depends on the car a fixed price', () => {
    const repairs = c.services.items.filter((item) => item.repair);
    expect(repairs.map((item) => item.code)).toEqual(['brakes', 'clutch', 'timing-belt']);
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
  it('uses plain UK garage wording', () => {
    expect(JSON.stringify(c)).not.toMatch(/maintenance package|auto care solution/i);
  });
  it('keeps accreditation slots switched off by default', () => {
    expect(c.trust.accreditations.map((item) => item.name)).toEqual([
      'Good Garage Scheme',
      'The Motor Ombudsman',
      'IMI (Institute of the Motor Industry)',
      'Bosch Car Service',
    ]);
    expect(c.trust.accreditations.every((item) => !item.show)).toBe(true);
  });
});
