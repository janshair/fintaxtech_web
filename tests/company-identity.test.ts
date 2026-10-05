import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { company } from '../src/content/site';
import { pages } from '../src/content/pages';
import { publicProfiles } from '../src/content/social';
import { indexablePaths, seoPages } from '../src/content/seo';
import { structuredData } from '../src/lib/seo';

describe('company identity and discovery', () => {
  it('connects the visible company identity to the registered entity and official profiles', () => {
    const graph = structuredData('/about/', pages.about.title, pages.about.intro)['@graph'];
    const organization = graph.find((node) => node['@type'] === 'Organization');
    expect(organization).toMatchObject({
      '@id': `${company.url}/#organization`,
      name: company.name,
      legalName: company.legal,
      description: pages.about.intro,
      identifier: {
        '@type': 'PropertyValue',
        propertyID: 'Companies House',
        value: company.number,
        url: company.registryURL,
      },
      sameAs: [...publicProfiles.map((profile) => profile.url), company.registryURL],
    });
    expect(graph.find((node) => node['@type'] === 'AboutPage')).toMatchObject({
      mainEntity: { '@id': `${company.url}/#organization` },
    });
  });

  it('keeps the optional agent summary aligned with identity and canonical public routes', () => {
    const summary = readFileSync(new URL('../public/llms.txt', import.meta.url), 'utf8');
    for (const value of [company.name, company.legal, company.number, company.registryURL])
      expect(summary).toContain(value);
    for (const profile of publicProfiles) expect(summary).toContain(profile.url);
    const links = [...summary.matchAll(/\]\((https:[^)]+)\)/g)].map((match) => new URL(match[1]));
    for (const url of links.filter((url) => url.origin === company.url)) {
      if (url.pathname === '/sitemap.xml') continue;
      expect(indexablePaths).toContain(url.pathname);
      expect(seoPages[url.pathname]?.noindex).not.toBe(true);
    }
    expect(summary).toContain('not access control');
    expect(summary).toContain('after full payment');
  });
});
