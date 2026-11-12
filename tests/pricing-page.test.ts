import { describe, expect, it } from 'vitest';
import {
  pricingCopy,
  pricingFaqs,
  pricingGroups,
  pricingSummaryText,
  priceLabel,
  startingLabel,
} from '../src/content/pricing';
import { seoPages } from '../src/content/seo';
import { structuredData } from '../src/lib/seo';

const group = (id: string) => pricingGroups.find((g) => g.id === id)!;
const prices = (id: string) =>
  Object.fromEntries(group(id).packages.map((pkg) => [pkg.name, pkg.price]));

describe('pricing page packages', () => {
  it('publishes the catalogue prices for each service', () => {
    expect(prices('websites')).toEqual({
      'Placeholder Website': 399,
      'Single Landing Page': 699,
      'Business Website': 999,
      'Corporate Website': 1999,
      'Shopify E-commerce': 2999,
      'Custom Web Application': undefined,
    });
    expect(prices('branding')).toEqual({
      'Design Set': 180,
      'Logo Design': 369,
      'Logo and Brand Style': 468,
      'Full Brand Identity': 618,
      'Brand Launch Kit': 798,
    });
    expect(prices('mobile-apps')).toEqual({
      'Starter App': 3248,
      'iOS and Android App': 4498,
      'Growth App': 6248,
    });
    expect(prices('ai-automation')).toEqual({
      'Starter Automation': 999,
      'Assistant with Knowledge Base': 1198,
      'Multi-Workflow Automation': 1698,
    });
  });

  it('starts each service at its cheapest priced package', () => {
    for (const g of pricingGroups) {
      const priced = g.packages.flatMap((pkg) => (pkg.price === undefined ? [] : [pkg.price]));
      expect(g.startingPrice).toBe(Math.min(...priced));
    }
    expect(startingLabel(group('websites'))).toBe('from £399 + VAT');
    expect(priceLabel(group('websites').packages[4])).toBe('£2,999 + VAT');
    expect(priceLabel(group('websites').packages[5])).toBe('Quoted after review');
  });

  it('links every service to its estimate and examples', () => {
    expect(pricingGroups.map((g) => g.id)).toEqual([
      'branding',
      'websites',
      'mobile-apps',
      'ai-automation',
    ]);
    expect(pricingGroups.map((g) => g.estimate.href)).toEqual([
      '/estimate/branding/',
      '/estimate/website/',
      '/estimate/mobile/',
      '/estimate/ai-automation/',
    ]);
    expect(group('websites').examples).toMatchObject({
      href: '/templates/website/',
      text: 'Choose your favourite design.',
    });
  });

  it('carries prices into search metadata, schema and llms.txt', () => {
    const seo = seoPages['/pricing/'];
    expect(seo.title).toBe(pricingCopy.seoTitle);
    expect(seo.description).toContain('websites from £399');
    expect(seo.description.length).toBeLessThanOrEqual(200);

    const graph = structuredData('/pricing/', seo.title, seo.description)['@graph'] as Record<
      string,
      any
    >[];
    const page = graph.find((node) => [node['@type']].flat().includes('FAQPage'))!;
    expect(page.mainEntity).toHaveLength(pricingFaqs.length);
    const catalogue = graph.find((node) => node['@id']?.endsWith('#packages'))!;
    const offers = catalogue.itemListElement.flatMap((g: any) => g.itemListElement);
    expect(offers).toHaveLength(16);
    expect(offers.every((o: any) => o.priceCurrency === 'GBP' && o.price > 0)).toBe(true);
    expect(offers.every((o: any) => o.priceSpecification.valueAddedTaxIncluded === false)).toBe(
      true,
    );

    const text = pricingSummaryText();
    expect(text).toContain('Website packages, from £399 + VAT');
    expect(text).toContain('Starter Automation (£999 + VAT)');
  });
});
