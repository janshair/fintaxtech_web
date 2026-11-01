import { describe, expect, it } from 'vitest';
import {
  locations,
  locationFromSlug,
  locationFromPath,
  locationStartURL,
} from '../src/content/locations';
import { seoPages, indexablePaths } from '../src/content/seo';
import { structuredData } from '../src/lib/seo';

describe('static location pages', () => {
  it('only recognises approved exact location values', () => {
    for (const bad of [
      null,
      undefined,
      '',
      '__unknown_location__',
      'Dundee',
      '__proto__',
      'constructor',
      '<img src=x onerror=alert(1)>',
      'dundee/../edinburgh',
    ]) {
      expect(locationFromSlug(bad)).toBeUndefined();
    }
    expect(locationFromPath('/locations/dundee/extra/')).toBeUndefined();
    for (const location of locations) {
      expect(location.slug).toMatch(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
      expect(locationFromSlug(location.slug)).toBe(location);
      expect(locationFromPath(`/locations/${location.slug}/`)).toBe(location);
      expect(locationStartURL(location)).toBe(`/start/?location=${location.slug}`);
    }
  });
  it('uses stable hyphenated URLs for multiword and already hyphenated names', () => {
    for (const [slug, name] of [
      ['newcastle-upon-tyne', 'Newcastle upon Tyne'],
      ['kingston-upon-hull', 'Kingston upon Hull'],
      ['stoke-on-trent', 'Stoke-on-Trent'],
      ['northern-ireland', 'Northern Ireland'],
    ]) {
      const location = locationFromSlug(slug)!;
      expect(location.name).toBe(name);
      expect(new URL(location.canonical).pathname).toBe(`/locations/${slug}/`);
      expect(
        new URL(locationStartURL(location), 'https://fintaxtech.co.uk').searchParams.get(
          'location',
        ),
      ).toBe(slug);
    }
    expect(locationFromSlug('newcastle upon tyne')).toBeUndefined();
    expect(locationFromSlug('newcastle%20upon%20tyne')).toBeUndefined();
  });
  it('registers distinct canonical pages without query variants', () => {
    expect(locations.length).toBeGreaterThan(0);
    for (const key of [
      'slug',
      'h1',
      'intro',
      'description',
      'seoTitle',
      'sectionTitle',
      'canonical',
    ] as const)
      expect(new Set(locations.map((location) => location[key])).size).toBe(locations.length);
    for (const location of locations) {
      const path = `/locations/${location.slug}/`;
      expect(seoPages[path].canonical).toBe(`https://fintaxtech.co.uk${path}`);
      expect(indexablePaths).toContain(path);
      expect(location.faqs.length).toBeGreaterThanOrEqual(2);
      expect(location.faqs.length).toBeLessThanOrEqual(3);
    }
    expect(indexablePaths.some((path) => path.includes('?'))).toBe(false);
  });
  it('identifies one Dundee organisation and the city served, not invented branches', () => {
    for (const location of locations) {
      const graph = structuredData(
        `/locations/${location.slug}/`,
        location.seoTitle,
        location.description,
      )['@graph'];
      const org = graph.find((node) => node['@type'] === 'Organization')!;
      expect(org.address?.addressLocality).toBe('Dundee');
      expect(graph.filter((node) => node['@type'] === 'Organization')).toHaveLength(1);
      expect(graph.some((node) => String(node['@type']) === 'LocalBusiness')).toBe(false);
      const service = graph.find((node) => node['@type'] === 'Service')!;
      expect(service).toMatchObject({
        areaServed: { '@type': 'City', name: location.name },
        provider: { '@id': org['@id'] },
      });
      const breadcrumb = graph.find((node) => node['@type'] === 'BreadcrumbList')!;
      expect(breadcrumb.itemListElement?.at(-1)?.item).toBe(location.canonical);
      if (location.slug !== 'dundee') {
        expect(location.office).toBeUndefined();
        expect(location.availability).toContain('based in Dundee');
        expect(location.availability).toContain(`do not have an office in ${location.name}`);
      }
    }
  });
});
