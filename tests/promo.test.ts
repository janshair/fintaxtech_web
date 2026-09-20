import { afterEach, expect, it, vi } from 'vitest';
import { promoAllowed } from '../src/lib/rules';
import { promoCopy } from '../src/content/promo';
afterEach(() => {
  vi.doUnmock('../src/content/promo');
  vi.resetModules();
});
it.each(['available', 'final-place', 'closed'] as const)(
  'keeps %s promotion indexable while controlling applications',
  async (status) => {
    vi.resetModules();
    vi.doMock('../src/content/promo', () => ({ promoCopy, promoStatus: status }));
    const { seoPages, indexablePaths } = await import('../src/content/seo');
    expect(seoPages['/promo/'].noindex).toBeUndefined();
    expect(indexablePaths.filter((path) => path === '/promo/')).toHaveLength(1);
    expect(promoAllowed(status, true)).toBe(status !== 'closed');
    expect(promoAllowed(status, false)).toBe(false);
    if (status === 'closed') {
      expect(seoPages['/promo/'].title).toBe(promoCopy.closedTitle);
      expect(seoPages['/promo/'].description).toBe(promoCopy.closedSEODescription);
    }
    expect(seoPages['/enquiry/'].noindex).toBe(true);
    expect(indexablePaths).not.toContain('/enquiry/');
  },
);
