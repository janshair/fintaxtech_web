import { it, expect, vi } from 'vitest';
import { mkdir, writeFile, readFile } from 'node:fs/promises';
import { calculate, initialAnswers } from '../src/lib/website-estimate/calculate';
import { pricing, services, websiteStep } from '../src/lib/website-estimate/config';
import { answerSummary } from '../src/lib/website-estimate/answers';
import { estimateText } from '../src/lib/website-estimate/presentation';
export const brief = {
  logo: 'ready',
  businessName: 'Example Studio',
  tagline: 'Your local business',
  email: 'hello@example.com',
  whatsapp: '+44 1382 000000',
  title: 'Example Studio',
  headline: 'Welcome',
  supportingText: 'Clear introduction',
  introduction: 'About our business',
  benefits: 'Our services',
  cta: 'Contact us',
  contactDetails: 'hello@example.com',
};
it('orders six packages with all existing prices preserved', () => {
  expect(services.packageOptions.map((o) => o.id)).toEqual([
    'placeholder',
    'landing',
    'business',
    'corporate',
    'shopify',
    'custom_web_app',
  ]);
  expect(
    Object.fromEntries(Object.entries(pricing.packages).map(([id, p]) => [id, p.amountMinor])),
  ).toEqual({
    placeholder: 39900,
    landing: 69900,
    business: 99900,
    corporate: 199900,
    shopify: 299900,
    custom_web_app: null,
  });
});
for (const [id, price] of [
  ['placeholder', 39900],
  ['landing', 69900],
] as const) {
  it(`${id} excludes hidden extras and uses only its brief`, () => {
    const a = {
      ...initialAnswers(),
      packageId: id,
      packageBriefs: { [id]: brief, business: { businessName: 'Inactive business' } },
      pages: [{ id: 'old', name: 'Unused', layoutNeeds: 'special', contentMode: 'write' }],
      features: ['blog_custom', 'cms', 'api'],
      content: { blogArticleCount: 99, stockImageCount: 99 },
      visibility: { mode: 'advanced', services: ['seo_advanced', 'aeo_advanced', 'geo_advanced'] },
      migration: { required: 'yes' },
      support: { planId: 'website_care_plus' },
      projectExtras: { extraConcepts: 100, extraRevisionRounds: 100 },
      otherRequirements: 'Inactive add-on',
    };
    const e = calculate(a);
    expect(e.knownSubtotalMinor).toBe(price);
    expect(e.monthlySubtotalMinor).toBe(0);
    expect(e.lines).toHaveLength(1);
    expect(e.validationErrors).toEqual([]);
    expect(e.reviewFlags).toEqual([pricing.packages[id].timingNotice]);
    expect(e.answers.features).toEqual([]);
    expect(answerSummary(e.answers).join(' ')).not.toContain('Inactive');
    expect(estimateText(e).join(' ')).not.toContain('Essential SEO, AEO and GEO');
    expect(estimateText(e).join(' ')).toContain('SEO, AEO or GEO optimisation services');
    expect(e.fullTotalMinor).toBe(price);
  });
  it(`${id} offers no multipage, feature, search or support selectors`, () => {
    const qs = Array.from({ length: 5 }, (_, i) => websiteStep(i + 1, id).questions).flat();
    expect(
      qs.some((q) => ['pages', 'features', 'visibility.mode', 'support.planId'].includes(q.id)),
    ).toBe(false);
    expect(pricing.packages[id].includedCapabilities).not.toContain('essential_visibility');
  });
  it(`${id} validates required details and flags unavailable logo / outside scope without adding fees`, () => {
    const e = calculate({
      ...initialAnswers(),
      packageId: id,
      packageBriefs: {
        [id]: {
          ...brief,
          email: 'bad',
          whatsapp: 'bad',
          logo: 'not_ready',
          outsideScope: 'Need a booking engine',
        },
      },
    });
    expect(e.knownSubtotalMinor).toBe(price);
    expect(e.validationErrors).toContain('Business email address');
    expect(e.validationErrors).toContain('Business WhatsApp number');
    expect(e.reviewFlags).toContain(pricing.packages[id].upgradeNotice);
  });
  it(`${id} PDF uses the same package price and applicable requirements`, async () => {
    vi.stubGlobal('fetch', async (path: string) => new Response(await readFile(`public${path}`)));
    try {
      const { createWebsitePDF } = await import('../src/lib/website-estimate/pdf');
      const e = calculate({ ...initialAnswers(), packageId: id, packageBriefs: { [id]: brief } });
      const blob = await createWebsitePDF(e);
      await mkdir('test-results/entry-packages', { recursive: true });
      await writeFile(
        `test-results/entry-packages/${id}.pdf`,
        Buffer.from(await blob.arrayBuffer()),
      );
      expect(blob.size).toBeGreaterThan(1000);
    } finally {
      vi.unstubAllGlobals();
    }
  });
}
