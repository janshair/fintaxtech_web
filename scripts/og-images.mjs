// Link-preview images for the motion templates: 1200×630 PNGs in public/og/.
// They use each template's THEME colours and type, with no demo business name,
// because WhatsApp and iMessage read og:image without running the page's script.
// Run after changing a THEME: pnpm og-images (needs Playwright's Chromium).
import { chromium } from '@playwright/test';
import { mkdir, readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const root = new URL('../', import.meta.url);
const { templatePalettes } = await import('../src/content/template-palettes.ts');
const { motionTemplates } = await import('../src/content/templates.ts');
const mark = (await readFile(new URL('public/mark.svg', root), 'utf8')).match(/ d="([^"]+)"/)[1];
// Embedded, because a page set from a string cannot load local font files.
const font = async (weight) =>
  `data:font/woff2;base64,${(
    await readFile(
      new URL(`node_modules/@fontsource/archivo/files/archivo-latin-${weight}-normal.woff2`, root),
    )
  ).toString('base64')}`;
const fonts = { 400: await font(400), 600: await font(600), 700: await font(700) };

const serif = "Georgia, 'Times New Roman', serif";
const bookSerif = "'Iowan Old Style', 'Palatino Linotype', Palatino, Georgia, serif";
// Each template's display type and a small motif echoing its artwork.
const styles = {
  'barber-01': {
    theme: 'barber-demo',
    display: serif,
    motif: (a, t) =>
      `<rect x="150" y="40" width="100" height="320" rx="50" fill="${t}" opacity=".12"/>
       <clipPath id="pole"><rect x="160" y="70" width="80" height="260" rx="14"/></clipPath>
       <g clip-path="url(#pole)">${Array.from({ length: 9 }, (_, i) => `<path d="M120 ${40 + i * 40}l180 -90v28l-180 90z" fill="${i % 2 ? t : a}"/>`).join('')}</g>
       <rect x="145" y="40" width="110" height="34" rx="17" fill="${a}"/><rect x="145" y="326" width="110" height="34" rx="17" fill="${a}"/>`,
  },
  'tailoring-02': {
    theme: 'tailoring-demo',
    display: serif,
    motif: (a, t) =>
      `<path d="M40 300C120 120 280 360 360 120" fill="none" stroke="${a}" stroke-width="6" stroke-dasharray="18 14" stroke-linecap="round"/>
       <path d="M300 60l90 -40-60 80z" fill="${t}" opacity=".8"/><circle cx="352" cy="44" r="6" fill="none" stroke="${a}" stroke-width="4"/>`,
  },
  'automotive-03': {
    theme: 'automotive-demo',
    display: "Archivo, 'Arial Black', Arial, sans-serif",
    upper: true,
    motif: (a, t) =>
      `<path d="M160 20h80l120 360H40z" fill="${t}" opacity=".1"/>
       ${Array.from({ length: 5 }, (_, i) => `<rect x="${193 - i * 2}" y="${40 + i * 70}" width="${14 + i * 4}" height="${36 + i * 8}" rx="4" fill="${a}"/>`).join('')}`,
  },
  'cleaning-04': {
    theme: 'cleaning-demo',
    display: serif,
    motif: (a, t) =>
      [
        [120, 260, 90],
        [270, 150, 64],
        [300, 310, 40],
        [150, 90, 30],
      ]
        .map(
          ([x, y, r], i) =>
            `<circle cx="${x}" cy="${y}" r="${r}" fill="${i ? 'none' : a}" stroke="${i ? a : 'none'}" stroke-width="6" opacity="${i ? 1 : 0.85}"/>`,
        )
        .join('') + `<circle cx="96" cy="232" r="14" fill="#fff" opacity=".55"/>`,
  },
  'gym-06': {
    theme: 'gym-demo',
    display: "Archivo, 'Arial Black', Arial, sans-serif",
    upper: true,
    motif: (a, t) =>
      `<rect x="20" y="186" width="360" height="28" rx="8" fill="${t}" opacity=".85"/>
       <rect x="60" y="100" width="44" height="200" rx="12" fill="${a}"/><rect x="110" y="130" width="30" height="140" rx="10" fill="${a}"/>
       <rect x="296" y="100" width="44" height="200" rx="12" fill="${a}"/><rect x="260" y="130" width="30" height="140" rx="10" fill="${a}"/>`,
  },
  'consultant-07': {
    theme: 'consultant-demo',
    display: bookSerif,
    motif: (a, t) =>
      `<path d="M60 40h280v320H60z" rx="140" fill="none"/><path d="M60 360V180a140 140 0 0 1 280 0v180z" fill="${t}" opacity=".9"/>
       <path d="M90 270c40-50 70 20 110-10s50-50 80-10 40 30 60 0" fill="none" stroke="${a}" stroke-width="7" stroke-linecap="round"/>`,
  },
  'beauty-08': {
    theme: 'beauty-demo',
    display: "Didot, 'Bodoni 72', 'Iowan Old Style', Georgia, serif",
    motif: (a, t) =>
      `<path d="M40 380V200a160 160 0 0 1 320 0v180z" fill="${a}" opacity=".55"/>
       <rect x="172" y="70" width="56" height="110" rx="10" fill="${t}"/>
       <rect x="130" y="170" width="140" height="190" rx="36" fill="${t}"/>
       <rect x="150" y="200" width="22" height="120" rx="11" fill="#fff" opacity=".28"/>`,
  },
  'wedding-09': {
    theme: 'wedding-demo',
    display: bookSerif,
    motif: (a, t) =>
      `<circle cx="150" cy="210" r="100" fill="none" stroke="${a}" stroke-width="18"/>
       <circle cx="250" cy="210" r="100" fill="none" stroke="${t}" stroke-width="18" opacity=".85"/>
       <path d="M250 90l14 -26h-28z" fill="${a}"/>`,
  },
};

// Readable text on the chosen background: the palette's paper or the brand colour.
const luminance = (hex) => {
  const [r, g, b] = hex
    .slice(1, 7)
    .match(/../g)
    .map((part) => parseInt(part, 16) / 255)
    .map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

function card(template, style, theme) {
  const palette = templatePalettes[template.id];
  const dark = palette.dark;
  const background = dark ? theme.brand : palette.paper;
  const text = dark ? palette.paper : theme.brand;
  const accentText = luminance(theme.accent) > 0.4 ? '#14161a' : '#ffffff';
  const name = style.upper ? 'YOUR BUSINESS NAME HERE' : 'Your business name here';
  return `<!doctype html><html><head><meta charset="utf-8"><style>
    @font-face { font-family: Archivo; font-weight: 400; src: url("${fonts[400]}"); }
    @font-face { font-family: Archivo; font-weight: 600; src: url("${fonts[600]}"); }
    @font-face { font-family: Archivo; font-weight: 700; src: url("${fonts[700]}"); }
    * { box-sizing: border-box; margin: 0; }
    body { width: 1200px; height: 630px; background: ${background}; color: ${text}; font-family: Archivo, Arial, sans-serif; overflow: hidden; }
    .card { position: relative; height: 100%; padding: 72px 80px 64px; display: flex; flex-direction: column; }
    .eyebrow { display: inline-block; align-self: flex-start; padding: 10px 18px; border-radius: 999px; background: ${theme.accent}; color: ${accentText}; font-weight: 600; font-size: 22px; letter-spacing: .14em; text-transform: uppercase; }
    h1 { margin-top: 44px; max-width: ${style.upper ? 620 : 700}px; font-family: ${style.display}; font-weight: ${style.upper ? 700 : 400}; font-size: ${style.upper ? 64 : 88}px; line-height: 1.02; letter-spacing: ${style.upper ? '-.01em' : '-.02em'}; }
    .trade { margin-top: 26px; font-size: 34px; font-weight: 600; opacity: .9; }
    .by { margin-top: auto; display: flex; align-items: center; gap: 16px; font-size: 24px; }
    .by strong { font-weight: 700; }
    .by span { opacity: .75; }
    .rule { position: absolute; left: 80px; right: 80px; bottom: 138px; height: 2px; background: ${text}; opacity: .14; }
    svg.motif { position: absolute; right: 60px; top: 110px; width: 400px; height: 400px; }
  </style></head><body><div class="card">
    <span class="eyebrow">Website demo</span>
    <h1>${name}</h1>
    <p class="trade">${template.trade} website demo</p>
    <div class="rule"></div>
    <p class="by"><svg width="40" height="38" viewBox="0 0 760 720" aria-hidden="true"><path fill="${text}" d="${mark}"/></svg><strong>by FinTaxTech</strong><span>fintaxtech.co.uk</span></p>
    <svg class="motif" viewBox="0 0 400 400" aria-hidden="true">${style.motif(theme.accent, text)}</svg>
  </div></body></html>`;
}

await mkdir(new URL('public/og/', root), { recursive: true });
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });
for (const template of motionTemplates) {
  const style = styles[template.id];
  if (!style) throw new Error(`No link-preview style for ${template.id}`);
  const { THEME } = await import(`../src/content/${style.theme}.ts`);
  await page.setContent(card(template, style, THEME), { waitUntil: 'load' });
  await page.evaluate(() => document.fonts.ready);
  const path = fileURLToPath(new URL(`public/og/${template.id}.png`, root));
  await page.screenshot({ path, type: 'png' });
  console.log(`public/og/${template.id}.png`);
}
await browser.close();
