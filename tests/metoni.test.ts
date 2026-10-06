import { describe, it, expect } from 'vitest';
import { metoni } from '../src/content/metoni';
import { publishedApps } from '../src/content/work';
import { seoPages, indexablePaths, appPolicyPaths } from '../src/content/seo';
import { structuredData, breadcrumbs } from '../src/lib/seo';

describe('Metoni publishing', () => {
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
