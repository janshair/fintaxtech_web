import { afterEach, describe, it, expect, vi } from 'vitest';
import { deniedConsent } from '../src/content/google-tag';

vi.mock('../src/content/google-tag', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../src/content/google-tag')>()),
  GA4_ID: 'G-TEST123',
  ADS_ID: 'AW-TEST456',
}));
afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
  vi.resetModules();
});
function browser(publicPage = true) {
  const append = vi.fn();
  vi.stubGlobal('localStorage', { getItem: () => null });
  const dataLayer: unknown[][] = [['consent', 'default', deniedConsent]];
  vi.stubGlobal(
    'window',
    publicPage ? { dataLayer, gtag: (...args: unknown[]) => dataLayer.push(args) } : {},
  );
  vi.stubGlobal('location', {
    origin: 'https://fintaxtech.co.uk',
    pathname: '/start/',
    hostname: 'fintaxtech.co.uk',
    search: '?secret=private',
  });
  vi.stubGlobal('document', {
    cookie: '',
    createElement: () => ({}),
    head: { append },
    addEventListener: vi.fn(),
  });
  return append;
}
describe('analytics privacy boundary', () => {
  it.each([
    '/client/prompt-brief',
    '/client/prompt-brief/',
    '/client/prompt-brief/index.html',
    '/client/logo-brief',
    '/client/logo-brief/',
    '/client/logo-brief/index.html',
    '/client/website-brief',
    '/client/website-brief/',
    '/client/website-brief/index.html',
    '/client/mobile-app-brief',
    '/client/mobile-app-brief/',
    '/client/mobile-app-brief/index.html',
  ])('never loads analytics or emits events on %s', async (path) => {
    const append = browser(false);
    location.pathname = path;
    const a = await import('../src/lib/analytics');
    a.setAnalyticsConsent(true);
    a.track('theme_changed');
    a.initAnalytics();
    expect(append).not.toHaveBeenCalled();
    expect(window.gtag).toBeUndefined();
  });
  it('queues the denied default and loads nothing before consent or on rejection', async () => {
    const append = browser();
    const a = await import('../src/lib/analytics');
    a.initAnalytics();
    a.track('questionnaire_started');
    a.setAnalyticsConsent(false);
    expect(append).not.toHaveBeenCalled();
    expect(window.dataLayer).toEqual([['consent', 'default', deniedConsent]]);
  });
  it('uses only approved event names without payloads and strips URL queries', async () => {
    const append = browser();
    const a = await import('../src/lib/analytics');
    a.setAnalyticsConsent(true);
    expect(append).toHaveBeenCalledExactlyOnceWith({
      src: 'https://www.googletagmanager.com/gtag/js?id=G-TEST123',
      async: true,
    });
    expect(window.dataLayer).toContainEqual([
      'consent',
      'update',
      Object.fromEntries(Object.keys(deniedConsent).map((key) => [key, 'granted'])),
    ]);
    expect(window.dataLayer).toEqual(
      expect.arrayContaining([
        ['config', 'G-TEST123', expect.objectContaining({ send_page_view: false })],
        ['config', 'AW-TEST456', expect.objectContaining({ send_page_view: false })],
      ]),
    );
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
    expect(window.dataLayer.at(-1)).toEqual(['consent', 'update', deniedConsent]);
  });
  it('records assistant interactions only after consent and without choice or destination data', async () => {
    browser();
    const analytics = await import('../src/lib/analytics');
    const events = [
      'project_assistant_invitation_shown',
      'project_assistant_opened',
      'project_assistant_option_selected',
      'project_assistant_destination_clicked',
      'project_assistant_dismissed',
    ] as const;
    events.forEach(analytics.track);
    expect(window.dataLayer).toEqual([['consent', 'default', deniedConsent]]);
    analytics.setAnalyticsConsent(true);
    events.forEach(analytics.track);
    const dispatched = window.dataLayer.map((x) => Array.from(x as ArrayLike<unknown>));
    expect(dispatched.filter(([command]) => command === 'event')).toEqual(
      events.map((event) => [
        'event',
        event,
        {
          page_location: 'https://fintaxtech.co.uk/start/',
          page_referrer: '',
          page_title: 'FinTaxTech',
          send_to: 'G-TEST123',
        },
      ]),
    );
  });
});
