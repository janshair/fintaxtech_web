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
  it('keeps its globally unique suffix and ships its own scripts', () => {
    const suffixes = allTemplates.map((t) => Number(t.id.split('-').at(-1)));
    expect(new Set(suffixes).size).toBe(suffixes.length);
    expect(Number(gym.id.split('-').at(-1))).toBe(6);
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

describe('consultant demonstration content', () => {
  const consultant = motionTemplates.find((t) => t.id === 'consultant-07')!;
  it('keeps its globally unique suffix and ships its own scripts', () => {
    const suffixes = allTemplates.map((t) => Number(t.id.split('-').at(-1)));
    expect(new Set(suffixes).size).toBe(suffixes.length);
    expect(Number(consultant.id.split('-').at(-1))).toBe(7);
    for (const file of ['identity.js', 'motion.js'])
      expect(existsSync(`public${consultant.route}${file}`)).toBe(true);
  });
  it('labels every credential, client and result as a placeholder or example', async () => {
    const { consultantDemo, THEME } = await import('../src/content/consultant-demo');
    const source = readFileSync('src/content/consultant-demo.ts', 'utf8');
    expect(
      source.startsWith('// Change these hex codes, save, and the whole template recolours.'),
    ).toBe(true);
    const page = readFileSync(`src/pages${consultant.route}index.astro`, 'utf8');
    for (const hook of ['hero', 'services', 'gallery', 'motion', 'demo', 'reviews', 'contact'])
      expect(page).toContain(`data-capture="${hook}"`);
    for (const text of [
      'data-sample-price',
      'data-sample-review',
      'Example reviews — your real Google reviews appear here.',
      'Example case study',
      'Your photo here',
      'Your qualification here',
      'Client logo',
      'Picture your business here?',
    ])
      expect(page).toContain(text);
    expect(consultantDemo.role).toBe('Business consultant');
    const css = readFileSync(`public${consultant.route}styles.css`, 'utf8');
    for (const hex of Object.values(THEME)) expect(css.toLowerCase()).not.toContain(hex);
    const { rolePresets } = await import('../src/content/consultant-demo');
    const content = page + JSON.stringify(consultantDemo) + JSON.stringify(rolePresets);
    expect(content).not.toMatch(
      /chartered|certified|accredited|ACCA|CIMA|ICAS|HMRC|regulated by|award-winning|guaranteed|\d+% /i,
    );
  });
  it('gives every role preset complete example copy, matched by keyword', async () => {
    const { rolePresets, consultantDemo } = await import('../src/content/consultant-demo');
    for (const preset of Object.values(rolePresets)) {
      expect(preset.promise.length).toBeGreaterThan(20);
      expect(preset.services).toHaveLength(4);
      for (const service of preset.services) {
        expect(service.price).toMatch(/£/);
        expect(service.detail).toMatch(/^Example · /);
      }
      expect(preset.cases).toHaveLength(3);
      expect(preset.clients).toHaveLength(5);
      expect(preset.topics).toHaveLength(5);
    }
    // The same first-match rule as identity.js; unknown roles keep the consultant copy.
    const presetFor = (role: string) =>
      (Object.keys(rolePresets) as (keyof typeof rolePresets)[]).find((key) =>
        new RegExp(rolePresets[key].match, 'i').test(role),
      ) || 'consultant';
    for (const [role, key] of [
      ['Bookkeeper', 'bookkeeper'],
      ['Chartered accountant', 'bookkeeper'],
      ['Life coach', 'coach'],
      ['Personal trainer', 'coach'],
      ['Web designer', 'designer'],
      ['Marketing consultant', 'designer'],
      ['IT support', 'tech'],
      ['Web developer', 'tech'],
      ['Business consultant', 'consultant'],
      ['Recruitment specialist', 'consultant'],
      ['Architect', 'consultant'],
    ])
      expect(presetFor(role), role).toBe(key);
    expect(consultantDemo.hero.tagline).toBe(rolePresets.consultant.promise);
    expect(consultantDemo.services.map((s) => s.name)).toEqual(
      rolePresets.consultant.services.map((s) => s.name),
    );
  });
});

describe('beauty salon demonstration content', () => {
  const beauty = motionTemplates.find((t) => t.id === 'beauty-08')!;
  it('keeps its globally unique suffix and ships its own scripts', () => {
    const suffixes = allTemplates.map((t) => Number(t.id.split('-').at(-1)));
    expect(new Set(suffixes).size).toBe(suffixes.length);
    expect(Number(beauty.id.split('-').at(-1))).toBe(8);
    for (const file of ['identity.js', 'motion.js'])
      expect(existsSync(`public${beauty.route}${file}`)).toBe(true);
  });
  it('lists every requested treatment with a duration and an example price', async () => {
    const { treatments, treatmentGroups } = await import('../src/content/beauty-demo');
    expect(treatmentGroups.map((group) => group.label)).toEqual([
      'Nails',
      'Lashes',
      'Brows',
      'Extras',
    ]);
    const names = (group: string) =>
      treatments
        .filter((item) => item.group === group)
        .map((item) => item.name)
        .join(' | ');
    for (const word of ['Gel', 'BIAB', 'Acrylic', 'Nail art'])
      expect(names('nails')).toContain(word);
    for (const word of ['Classic', 'Hybrid', 'Volume', 'lift & tint'])
      expect(names('lashes')).toContain(word);
    for (const word of ['shape', 'tint', 'lamination']) expect(names('brows')).toContain(word);
    expect(names('extras').length).toBeGreaterThan(0);
    expect(new Set(treatments.map((item) => item.id)).size).toBe(treatments.length);
    for (const item of treatments) {
      expect(item.duration).toMatch(/\d+ min/);
      expect(item.price).toMatch(/£\d/);
    }
  });
  it('labels samples, includes salon essentials and makes no restricted or invented claims', async () => {
    const { beautyDemo, treatments, THEME } = await import('../src/content/beauty-demo');
    const source = readFileSync('src/content/beauty-demo.ts', 'utf8');
    expect(
      source.startsWith('// Change these hex codes, save, and the whole template recolours.'),
    ).toBe(true);
    const page = readFileSync(`src/pages${beauty.route}index.astro`, 'utf8');
    for (const hook of ['hero', 'services', 'gallery', 'motion', 'demo', 'reviews', 'contact'])
      expect(page).toContain(`data-capture="${hook}"`);
    for (const text of [
      'data-sample-price',
      'data-sample-review',
      'Example reviews — your real Google reviews appear here.',
      'Your own photos and Instagram posts go here.',
      'Already use Fresha, Booksy or Treatwell? We’ll connect your booking link.',
      'This is where clients would book and pay a deposit on your finished website.',
      'Demo only — nothing is booked or charged.',
      'Talk to FinTaxTech',
      'Picture your business here?',
      'GIFT VOUCHER · EXAMPLE',
      'CANCELLATIONS &amp; DEPOSITS · PLACEHOLDER',
      'Illustrated example',
    ])
      expect(page).toContain(text);
    expect(beautyDemo.patchTest).toBe(
      'A patch test may be needed 48 hours before your first lash or brow tint — your salon will confirm.',
    );
    expect(beautyDemo.flow.technicians).toEqual(['Any available', 'Amira', 'Jess']);
    expect(beautyDemo.hours.some(([, hours]) => /20:30/.test(hours))).toBe(true);
    const css = readFileSync(`public${beauty.route}styles.css`, 'utf8');
    for (const hex of Object.values(THEME)) expect(css.toLowerCase()).not.toContain(hex);
    const content = page + JSON.stringify(beautyDemo) + JSON.stringify(treatments);
    expect(content).not.toMatch(
      /botox|filler|injectable|anti-wrinkle|safe for (?:everyone|all)|damage.free|best in (?:town|dundee)|lasts? (?:up to )?\d|guaranteed|certified|accredited|insured|award|qualified|partner/i,
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
