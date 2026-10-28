import { templatePalettes } from '../content/template-palettes';

export type TemplateID = keyof typeof templatePalettes;
export type Theme = { brand: string; accent: string };

function rgba(hex: string): number[] {
  let value = hex.slice(1);
  if (value.length < 5) value = [...value].map((c) => c + c).join('');
  return [0, 2, 4].map((i) => parseInt(value.slice(i, i + 2), 16));
}
function luminance(hex: string) {
  const rgb = rgba(hex).map((v) => {
    v /= 255;
    return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  });
  return rgb[0] * 0.2126 + rgb[1] * 0.7152 + rgb[2] * 0.0722;
}
export function contrast(a: string, b: string) {
  const x = luminance(a),
    y = luminance(b);
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
}
export function readable(background: string, preferred = '#ffffff') {
  if (contrast(background, preferred) >= 4.5) return preferred;
  return contrast(background, '#000000') > contrast(background, '#ffffff') ? '#000000' : '#ffffff';
}
const hex = (rgb: number[]) =>
  '#' +
  rgb
    .map((v) =>
      Math.max(0, Math.min(255, Math.round(v)))
        .toString(16)
        .padStart(2, '0'),
    )
    .join('');

// Rebase each authored tint/shade on its primary colour. The original palette
// returns byte-for-byte unchanged. Custom themes mix toward white/black using
// the authored relative brightness, rather than adding unrelated brand colours.
export function shade(original: string, reference: string, next: string) {
  if (next.toLowerCase() === reference.toLowerCase()) return original;
  const source = rgba(original),
    base = rgba(reference),
    target = rgba(next);
  const brightness = (rgb: number[]) => rgb[0] * 0.2126 + rgb[1] * 0.7152 + rgb[2] * 0.0722;
  const from = brightness(source),
    anchor = brightness(base);
  const ratio =
    from >= anchor ? (from - anchor) / (255 - anchor || 1) : (anchor - from) / (anchor || 1);
  const result = hex(target.map((v) => (from >= anchor ? v + (255 - v) * ratio : v * (1 - ratio))));
  let suffix = original.slice(1);
  if (suffix.length === 4) suffix = [...suffix].map((c) => c + c).join('');
  return result + (suffix.length === 8 ? suffix.slice(6) : '');
}

export function templateTheme(id: TemplateID, input: Theme) {
  const defaults = templatePalettes[id];
  const valid = (key: keyof Theme) => {
    if (/^#[\da-f]{6}$/i.test(input[key])) return input[key].toLowerCase();
    console.warn(`[template-theme] ${id}: invalid ${key} hex; using ${defaults[key]}.`);
    return defaults[key];
  };
  const brand = valid('brand'),
    accent = valid('accent');
  const tones: Record<string, string> = {};
  for (const [original, role] of Object.entries(defaults.tones)) {
    tones['--tone-' + original.slice(1)] = shade(
      original,
      defaults[role],
      role === 'brand' ? brand : accent,
    );
  }
  const resolve = (value: string) => tones['--tone-' + value.slice(1)] || value;
  const variables: Record<string, string> = {
    ...tones,
    '--brand': brand,
    '--accent': accent,
    '--on-brand': readable(brand, defaults.paper),
    '--on-accent': readable(accent, brand),
    '--on-accent-paper': readable(accent, defaults.paper),
    '--on-accent-soft': readable(resolve('#dfc08d'), brand),
    '--brand-text': readable(defaults.paper, brand),
    '--accent-text':
      accent === defaults.accent
        ? accent
        : readable(defaults.dark ? brand : defaults.paper, accent),
    '--muted-on-paper': readable(resolve(defaults.paper), resolve('#6f7166')),
    '--muted-on-visit': readable(resolve('#e9e2d4'), resolve('#696d5e')),
    '--muted-on-brand': readable(brand, resolve('#929c86')),
    '--sleeve': resolve('#174c38'),
    '--on-sleeve': readable(resolve('#174c38'), '#fff8df'),
  };
  // Each existing surface keeps its original AA foreground at default settings.
  // If a new theme makes that foreground illegible, choose black or white.
  for (const [token, spec] of Object.entries(defaults.foregrounds)) {
    const [role, preferred] = spec as [keyof Theme, string];
    variables[token] = readable(role === 'brand' ? brand : accent, resolve(preferred));
  }
  return {
    brand,
    accent,
    pageBackground: defaults.dark ? brand : resolve(defaults.paper),
    custom: brand !== defaults.brand || accent !== defaults.accent,
    variables,
    style: Object.entries(variables)
      .map(([k, v]) => `${k}:${v}`)
      .join(';'),
  };
}
