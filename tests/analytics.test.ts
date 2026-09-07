import { afterEach, describe, it, expect, vi } from 'vitest';
afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
  vi.resetModules();
});
function browser() {
  const append = vi.fn();
  vi.stubGlobal('localStorage', { getItem: () => null });
  vi.stubGlobal('window', {});
  vi.stubGlobal('location', {
    origin: 'https://fintaxtech.co.uk',
    pathname: '/start/',
    hostname: 'fintaxtech.co.uk',
    search: '?secret=private',
  });
  vi.stubGlobal('document', { cookie: '', createElement: () => ({}), head: { append } });
  vi.stubEnv('PUBLIC_GA_MEASUREMENT_ID', 'G-TEST123');
  return append;
}
describe('analytics privacy boundary', () => {
  it('loads nothing before consent or on rejection', async () => {
    const append = browser();
    const a = await import('../src/lib/analytics');
    a.initAnalytics();
    a.track('questionnaire_started');
    a.setAnalyticsConsent(false);
    expect(append).not.toHaveBeenCalled();
    expect(window.gtag).toBeUndefined();
  });
  it('uses only approved event names without payloads and strips URL queries', async () => {
    const append = browser();
    const a = await import('../src/lib/analytics');
    a.setAnalyticsConsent(true);
    expect(append).toHaveBeenCalledTimes(1);
    a.track('pdf_generated');
    a.track('private answer' as never);
    const events = window.dataLayer.map((x) => Array.from(x as ArrayLike<unknown>));
    expect(events.filter((e) => e[0] === 'event')).toHaveLength(1);
    expect(JSON.stringify(events)).not.toContain('secret');
    expect(JSON.stringify(events)).not.toContain('private answer');
    const before = events.length;
    a.setAnalyticsConsent(false);
    const count = window.dataLayer.length;
    a.track('pdf_generated');
    expect(window.dataLayer).toHaveLength(count);
    expect(count).toBeGreaterThan(before);
  });
});
