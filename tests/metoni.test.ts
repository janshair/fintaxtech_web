import { describe, it, expect } from 'vitest';
import { metoni, metoniSupport } from '../src/content/metoni';
import { appPolicies } from '../src/content/app-policies';
import { metoniMedia } from '../src/content/metoni-media';
import { company } from '../src/content/site';
import { publishedApps } from '../src/content/work';
import { seoPages, indexablePaths, appPolicyPaths } from '../src/content/seo';
import { structuredData, breadcrumbs } from '../src/lib/seo';

describe('Metoni publishing', () => {
  it('uses launch facts and keeps unsupported claims out of app copy and metadata', () => {
    const copy = JSON.stringify([
      metoni,
      metoniSupport,
      seoPages[metoni.privacyRoute],
      seoPages[metoni.termsRoute],
      appPolicies[metoni.privacyRoute],
      appPolicies[metoni.termsRoute],
    ]);
    expect(copy).not.toMatch(/\bAI\b|artificial intelligence|\bPro\b|subscriptions?|[£$€]\d/i);
    expect(metoni.name).toBe('Metoni: Workout Tracker');
    expect(metoni.features.flat().join(' ')).toContain('135 exercises across 9 muscle groups');
    expect(metoniSupport.faq.flat().join(' ')).toContain('Settings › Workout Plans › plan menu');
    expect(metoniMedia.video).toBeUndefined();
    for (const route of [metoni.privacyRoute, metoni.termsRoute]) {
      expect(appPolicies[route]).toContain(company.address);
      expect(appPolicies[route]).toContain('6 October 2026');
    }
    expect(appPolicies[metoni.privacyRoute]).toContain('app-instance identifier');
    expect(appPolicies[metoni.privacyRoute]).toContain(
      'Nothing is used for tracking or advertising',
    );
    expect(appPolicies[metoni.termsRoute]).toContain(
      'standard Licensed Application End User Licence Agreement',
    );
  });
  it('publishes both pages while keeping policy routes and portfolio actions distinct', () => {
    for (const path of [metoni.route, metoni.supportRoute]) {
      expect(indexablePaths.filter((p) => p === path)).toHaveLength(1);
      expect(seoPages[path].noindex).not.toBe(true);
      expect(appPolicyPaths).not.toContain(path);
    }
    expect(appPolicyPaths).toContain(metoni.privacyRoute);
    expect(appPolicyPaths).toContain(metoni.termsRoute);
    expect(publishedApps[0]).toMatchObject({
      pageURL: metoni.route,
      playStoreUrl: metoni.playStoreURL,
    });
    expect(breadcrumbs(metoni.supportRoute)[1].url).toBe('https://fintaxtech.co.uk/metoni/');
  });
  it('describes the published Android app without fabricated ratings, price or iOS availability', () => {
    const graph = structuredData(metoni.route, metoni.seoTitle, metoni.description)['@graph'];
    const app = graph.find((node) => node['@type'] === 'MobileApplication');
    expect(app).toMatchObject({
      operatingSystem: 'Android',
      installUrl: metoni.playStoreURL,
      publisher: { '@id': 'https://fintaxtech.co.uk/#organization' },
    });
    expect(app).not.toHaveProperty('aggregateRating');
    expect(app).not.toHaveProperty('offers');
    expect(metoni.appStoreURL).toBeUndefined();
    expect(
      structuredData(metoni.supportRoute, 'Support', 'Help')['@graph'].some(
        (node) => node['@type'] === 'MobileApplication',
      ),
    ).toBe(false);
  });
});
