import { describe, it, expect } from 'vitest';
import { existsSync, readFileSync, statSync } from 'node:fs';
import {
  motionTemplates,
  motionGallery,
  threeDGallery,
  threeDTemplates,
  allTemplates,
  barberRedirect,
} from '../src/content/templates';
import { indexablePaths, seoPages } from '../src/content/seo';

describe('website template registry and discovery', () => {
  it('lists unique implemented demos with tracked, lightweight previews', () => {
    expect(motionTemplates.length).toBeGreaterThan(0);
    expect(new Set(allTemplates.map((t) => t.id)).size).toBe(allTemplates.length);
    expect(new Set(allTemplates.map((t) => t.route)).size).toBe(allTemplates.length);
    for (const template of allTemplates) {
      expect(existsSync(`src/pages${template.route}index.astro`)).toBe(true);
      expect(existsSync(`public${template.preview.src}`)).toBe(true);
      expect(statSync(`public${template.preview.src}`).size).toBeLessThan(200_000);
      expect(template.preview.alt.length).toBeGreaterThan(20);
      expect(template.preview.width).toBeGreaterThan(0);
      expect(template.preview.height).toBeGreaterThan(0);
      for (const file of ['app.js', 'styles.css'])
        expect(existsSync(`public${template.route}${file}`)).toBe(true);
      expect(template.route).toMatch(/^\/templates\/website\/(?:motion|3d)\/[^/]+\/$/);
    }
  });
  it('indexes the gallery, but excludes demos and compatibility redirects', () => {
    for (const gallery of [motionGallery, threeDGallery])
      expect(indexablePaths.filter((p) => p === gallery.route)).toHaveLength(1);
    for (const route of [...allTemplates.map((t) => t.route), barberRedirect.route]) {
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

describe('gym demonstration content', () => {
  const gym = motionTemplates.find((t) => t.id === 'gym-06')!;
  it('uses the next globally unique suffix and ships its own scripts', () => {
    const suffixes = allTemplates.map((t) => Number(t.id.split('-').at(-1)));
    expect(Number(gym.id.split('-').at(-1))).toBe(Math.max(...suffixes));
    for (const file of ['identity.js', 'motion.js'])
      expect(existsSync(`public${gym.route}${file}`)).toBe(true);
  });
  it('provides promotion hooks, marked samples and honest placeholders', async () => {
    const { gymDemo, THEME } = await import('../src/content/gym-demo');
    const source = readFileSync('src/content/gym-demo.ts', 'utf8');
    expect(
      source.startsWith('// Change these hex codes, save, and the whole template recolours.'),
    ).toBe(true);
    const page = readFileSync(`src/pages${gym.route}index.astro`, 'utf8');
    for (const hook of ['hero', 'services', 'gallery', 'motion', 'demo', 'reviews', 'contact'])
      expect(page).toContain(`data-capture="${hook}"`);
    expect(page).toContain('data-sample-price');
    expect(page).toContain('data-sample-review');
    expect(page).toContain('Example reviews — your real Google reviews appear here.');
    expect(page).toContain('Your own photos go here.');
    expect(page).toContain('Picture your business here?');
    expect(gymDemo.reviews).toHaveLength(3);
    const css = readFileSync(`public${gym.route}styles.css`, 'utf8');
    for (const hex of Object.values(THEME)) expect(css.toLowerCase()).not.toContain(hex);
    const content = page + JSON.stringify(gymDemo);
    expect(content).not.toMatch(
      /guaranteed|lose \d|weight loss|certified|accredited|insured|award/i,
    );
  });
});

describe('3D café demonstration content and budgets', () => {
  const route = threeDTemplates[0].route;
  it('reserves the next globally unique suffix', () => {
    expect(threeDTemplates[0].id).toBe('juice-bar-05');
    const suffixes = allTemplates.map((t) => Number(t.id.split('-').at(-1)));
    expect(new Set(suffixes).size).toBe(suffixes.length);
  });
  it('ships actual lightweight posters for every stage and coffee', () => {
    for (const file of [
      'hero.webp',
      'stage-1.webp',
      'stage-2.webp',
      'stage-3.webp',
      'coffee.webp',
    ]) {
      expect(statSync(`public${route}${file}`).size).toBeGreaterThan(1000);
      expect(statSync(`public${route}${file}`).size).toBeLessThanOrEqual(120_000);
    }
  });
  it('provides all promotion hooks, prices, and honest placeholders', async () => {
    const { juiceBarDemo } = await import('../src/content/juice-bar-demo');
    expect(juiceBarDemo.menu).toHaveLength(5);
    const page = readFileSync(`src/pages${route}index.astro`, 'utf8');
    for (const hook of ['hero', 'menu', 'build', 'story', 'gallery', 'contact'])
      expect(page).toContain(`data-capture="${hook}"`);
    expect(page).toContain('data-sample-price');
    expect(page).toContain('Ask us about allergens');
    expect(page).toContain('A little neighbourhood love');
    expect(page).toContain('Example reviews — your real Google reviews appear here.');
    expect(page).toContain('nothing is ordered or paid');
    const content = page + JSON.stringify(juiceBarDemo);
    expect(content).not.toMatch(
      /detox|boost immunity|burn fat|aid recovery|increase energy|superfood|cleanse|guilt.free|allergen.free/i,
    );
  });
});
