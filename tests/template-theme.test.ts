import { describe, it, expect, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import {
  templateTheme,
  contrast,
  readable,
  shade,
  type TemplateID,
} from '../src/lib/template-theme';
import { templatePalettes } from '../src/content/template-palettes';
import { THEME as barber } from '../src/content/barber-demo';
import { THEME as tailoring } from '../src/content/tailoring-demo';
import { THEME as automotive } from '../src/content/automotive-demo';
import { THEME as cleaning } from '../src/content/cleaning-demo';
import { THEME as juice } from '../src/content/juice-bar-demo';
import { THEME as gym } from '../src/content/gym-demo';
import { THEME as consultant } from '../src/content/consultant-demo';
const themes = {
  'barber-01': barber,
  'tailoring-02': tailoring,
  'automotive-03': automotive,
  'cleaning-04': cleaning,
  'juice-bar-05': juice,
  'gym-06': gym,
  'consultant-07': consultant,
};

describe('build-time template colours', () => {
  for (const [id, theme] of Object.entries(themes)) {
    it(`${id} preserves its authored palette and exposes editable primary colours`, () => {
      const result = templateTheme(id as TemplateID, theme);
      expect(result.brand).toBe(templatePalettes[id as TemplateID].brand);
      expect(result.accent).toBe(templatePalettes[id as TemplateID].accent);
      for (const original of Object.keys(templatePalettes[id as TemplateID].tones))
        expect(result.variables['--tone-' + original.slice(1)]).toBe(original);
      const route = id === 'juice-bar-05' ? '3d' : 'motion';
      const page = readFileSync(`src/pages/templates/website/${route}/${id}/index.astro`, 'utf8');
      expect(page).toContain(`templateTheme('${id}', THEME)`);
      expect(page).toContain('style={theme.style}');
      expect(page).not.toContain("searchParams.get('brand')");
    });
    it(`${id} changes the rendered style and all palette derivatives for a test theme`, () => {
      const result = templateTheme(id as TemplateID, { brand: '#1E3A8A', accent: '#E11D48' });
      expect(result.style).toContain('--brand:#1e3a8a;--accent:#e11d48');
      expect(result.variables['--tone-' + templatePalettes[id as TemplateID].brand.slice(1)]).toBe(
        '#1e3a8a',
      );
      for (const role of ['brand', 'accent'])
        expect(
          contrast(result.variables['--' + role], result.variables['--on-' + role]),
        ).toBeGreaterThanOrEqual(4.5);
    });
  }
  it('warns and falls back independently for invalid hex, never injecting CSS', () => {
    const warning = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const result = templateTheme('juice-bar-05', { brand: 'red;display:none', accent: '#12345g' });
    expect(result.brand).toBe(juice.brand);
    expect(result.accent).toBe(juice.accent);
    expect(warning).toHaveBeenCalledTimes(2);
    expect(result.style).not.toContain('display:none');
    warning.mockRestore();
  });
  it('chooses an AA foreground for extreme and midtone primary surfaces', () => {
    for (const background of [
      '#ffffff',
      '#000000',
      '#ffff00',
      '#777777',
      '#e11d48',
      '#1e3a8a',
      '#00ffff',
    ])
      expect(contrast(background, readable(background, '#faf5e9'))).toBeGreaterThanOrEqual(4.5);
    expect(contrast('#000000', '#ffffff')).toBe(21);
    expect(shade('#24372f30', '#24372f', '#1e3a8a')).toBe('#1e3a8a30');
  });
});
