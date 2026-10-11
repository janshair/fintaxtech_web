// Renders the swipeable social carousel for one blog article and records the image paths.
//
// Usage: node scripts/social-cards.mjs <slug>
//
// Reads social/posts/<slug>.json (needs "title", "category" and 3–5 "cards", each with a
// "heading" and a "text") and the article hero at src/assets/blog/<slug>/<slug>-hero.png.
// Writes 1080×1350 JPEGs next to the hero — a cover, one card per point and a closing card —
// then stores their paths in the post file as "image" (cover) and "images" (all, in order).
//
// Set PW_CHROMIUM_PATH to use a specific Chromium binary.
import { readFile, writeFile, stat } from 'node:fs/promises';
import { chromium } from '@playwright/test';

const slug = process.argv[2];
if (!slug) throw new Error('Usage: node scripts/social-cards.mjs <slug>');

const postPath = `social/posts/${slug}.json`;
const assetDir = `src/assets/blog/${slug}`;
const post = JSON.parse(await readFile(postPath, 'utf8'));
const cards = post.cards || [];
if (!post.title || !post.category) throw new Error(`${postPath} needs "title" and "category"`);
if (cards.length < 3 || cards.length > 5 || cards.some((c) => !c.heading || !c.text)) {
  throw new Error(`${postPath} needs 3–5 "cards", each with a "heading" and a "text"`);
}

const b64 = async (path) => (await readFile(path)).toString('base64');
const font = async (family, weight, pkg, file) =>
  `@font-face{font-family:${family};font-weight:${weight};src:url(data:font/woff2;base64,${await b64(
    `node_modules/@fontsource/${pkg}/files/${file}`,
  )})}`;
const fonts = (
  await Promise.all([
    font('Archivo', 600, 'archivo', 'archivo-latin-600-normal.woff2'),
    font('Plex', 400, 'ibm-plex-sans', 'ibm-plex-sans-latin-400-normal.woff2'),
    font('Plex', 500, 'ibm-plex-sans', 'ibm-plex-sans-latin-500-normal.woff2'),
    font('PlexMono', 500, 'ibm-plex-mono', 'ibm-plex-mono-latin-500-normal.woff2'),
  ])
).join('');
const hero = await b64(`${assetDir}/${slug}-hero.png`);

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const total = cards.length + 2;
const css = `${fonts}
*{box-sizing:border-box;margin:0}
body{width:1080px;height:1350px;background:#F7F7F3;padding:64px;display:flex;flex-direction:column;color:#0B0D10}
.top{display:flex;justify-content:space-between;font:500 24px PlexMono;letter-spacing:.12em;text-transform:uppercase}
.lab{color:#2563EB}.count{color:#596170}
.foot{margin-top:auto;display:flex;justify-content:space-between;align-items:center;border-top:2px solid #D8DCE3;padding-top:28px;font:500 28px Plex;color:#596170}
.swipe{color:#2563EB}
.dot{width:18px;height:18px;border-radius:50%;background:#2563EB}
.hero{width:952px;height:660px;flex:none;border:2px solid #D8DCE3;border-radius:20px;background:#fff url(data:image/png;base64,${hero}) center/cover}
.fit{font-family:Archivo;font-weight:600;line-height:1.1;letter-spacing:-.01em}
.mid{margin:auto 0}
.num{font:600 150px/1 Archivo;color:#2563EB;letter-spacing:-.02em}
.body{margin-top:36px;font:400 44px/1.45 Plex;color:#596170}
.box{margin-top:56px;background:#fff;border:2px solid #D8DCE3;border-radius:20px;padding:40px 44px}
.box .k{font:500 24px PlexMono;letter-spacing:.12em;text-transform:uppercase;color:#596170}
.box .v{margin-top:14px;font:600 54px/1.1 Archivo;color:#2563EB}`;

const top = (n) =>
  `<div class="top"><span class="lab">${esc(post.category)}</span><span class="count">${n} / ${total}</span></div>`;
const foot = (last) =>
  `<div class="foot"><span>fintaxtech.co.uk/blog</span>${last ? '<span class="dot"></span>' : '<span class="swipe">Swipe →</span>'}</div>`;
// data-fit="<start px>,<max lines>": the page script steps the size down until the text fits.
const pages = [
  `<div class="hero"></div><div class="top" style="margin-top:52px"><span class="lab">${esc(post.category)}</span></div>
   <div class="fit" data-fit="68,4" style="margin-top:20px">${esc(post.title)}</div>${foot(false)}`,
  ...cards.map(
    (card, i) => `${top(i + 2)}<div class="mid"><div class="num">${String(i + 1).padStart(2, '0')}</div>
   <div class="fit" data-fit="84,4" style="margin-top:28px">${esc(card.heading)}</div>
   <div class="body">${esc(card.text)}</div></div>${foot(false)}`,
  ),
  `${top(total)}<div class="mid"><div class="top"><span class="lab">Read the full guide</span></div>
   <div class="fit" data-fit="64,5" style="margin-top:24px">${esc(post.title)}</div>
   <div class="box"><div class="k">Find it in our blog</div><div class="v">fintaxtech.co.uk/blog</div></div></div>${foot(true)}`,
];

const browser = await chromium.launch(
  process.env.PW_CHROMIUM_PATH ? { executablePath: process.env.PW_CHROMIUM_PATH } : {},
);
const page = await browser.newPage({ viewport: { width: 1080, height: 1350 }, deviceScaleFactor: 1 });
const images = [];
for (const [i, html] of pages.entries()) {
  await page.setContent(`<!doctype html><meta charset="utf-8"><style>${css}</style><body>${html}</body>`);
  const overflow = await page.evaluate(async () => {
    await document.fonts.ready;
    for (const el of document.querySelectorAll('[data-fit]')) {
      const [start, maxLines] = el.dataset.fit.split(',').map(Number);
      let size = start;
      el.style.fontSize = `${size}px`;
      while (size > 36 && el.getBoundingClientRect().height > size * 1.1 * maxLines + 2) {
        size -= 4;
        el.style.fontSize = `${size}px`;
      }
    }
    const text = document.querySelector('.body');
    let bodySize = 44;
    while (text && bodySize > 28 && document.body.scrollHeight > 1350) {
      bodySize -= 2;
      text.style.fontSize = `${bodySize}px`;
    }
    return document.body.scrollHeight > 1350;
  });
  if (overflow) throw new Error(`Card ${i + 1} does not fit — shorten its heading or text`);
  const path = `${assetDir}/${slug}-social${i === 0 ? '' : `-${i + 1}`}.jpg`;
  await page.screenshot({ path, type: 'jpeg', quality: 90 });
  if ((await stat(path)).size > 1_000_000) throw new Error(`${path} is over 1 MB`);
  images.push(path);
}
await browser.close();

post.image = images[0];
post.images = images;
await writeFile(postPath, `${JSON.stringify(post, null, 2)}\n`);
console.log(`Rendered ${images.length} cards:\n${images.join('\n')}`);
