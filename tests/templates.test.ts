import { describe, it, expect } from 'vitest';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { motionTemplates, motionGallery, barberRedirect } from '../src/content/templates';
import { indexablePaths, seoPages } from '../src/content/seo';

describe('motion template registry and discovery', () => {
  it('lists unique implemented demos with tracked, lightweight previews', () => {
    expect(motionTemplates.length).toBeGreaterThan(0);
    expect(new Set(motionTemplates.map((t) => t.id)).size).toBe(motionTemplates.length);
    expect(new Set(motionTemplates.map((t) => t.route)).size).toBe(motionTemplates.length);
    for (const template of motionTemplates) {
      expect(existsSync(`src/pages${template.route}index.astro`)).toBe(true);
      expect(existsSync(`public${template.preview.src}`)).toBe(true);
      expect(statSync(`public${template.preview.src}`).size).toBeLessThan(200_000);
      expect(template.preview.alt.length).toBeGreaterThan(20);
      expect(template.preview.width).toBeGreaterThan(0);
      expect(template.preview.height).toBeGreaterThan(0);
      for (const file of ['app.js', 'styles.css'])
        expect(existsSync(`public${template.route}${file}`)).toBe(true);
      expect(template.route).toMatch(/^\/templates\/website\/motion\/[^/]+\/$/);
    }
  });
  it('indexes the gallery, but excludes demos and compatibility redirects', () => {
    expect(indexablePaths.filter((p) => p === motionGallery.route)).toHaveLength(1);
    for (const route of [...motionTemplates.map((t) => t.route), barberRedirect.route]) {
      expect(indexablePaths).not.toContain(route);
      expect(seoPages[route]).toMatchObject({ noindex: true, nofollow: true });
    }
    expect(seoPages[barberRedirect.route].canonical).toBe(motionTemplates[0].route);
  });
  it('moves required assets and keeps the old page as only a shared redirect', () => {
    const oldPage = readFileSync(`src/pages${barberRedirect.route}index.astro`, 'utf8');
    expect(oldPage).toContain('StaticRedirect');
    expect(oldPage).not.toContain('name-dialog');
    const demo = readFileSync(`src/pages${motionTemplates[0].route}index.astro`, 'utf8');
    expect(demo).not.toContain(barberRedirect.route);
    expect(demo).toContain(`${motionTemplates[0].route}app.js`);
    expect(existsSync(`public${barberRedirect.route}app.js`)).toBe(false);
  });
});
