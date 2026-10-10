import { readdir, readFile, stat } from 'node:fs/promises';
import { join } from 'node:path';
import assert from 'node:assert/strict';
async function files(dir) {
  return (
    await Promise.all(
      (await readdir(dir, { withFileTypes: true })).map((e) =>
        e.isDirectory() ? files(join(dir, e.name)) : [join(dir, e.name)],
      ),
    )
  ).flat();
}
const all = await files('dist');
for (const file of all.filter((file) => /\.(?:html|js|mjs|json|map)$/.test(file))) {
  const text = await readFile(file, 'utf8');
  assert(!text.includes('hooks.slack.com/services/'), `${file}: contains a webhook URL`);
  assert(
    !text.includes('PUBLIC_SLACK_WEBHOOK'),
    `${file}: contains the retired public secret variable`,
  );
}
// Native video must remain a real, reasonably sized GitHub Pages asset, not an LFS pointer.
for (const file of all.filter((path) => /\.(mp4|webm|mov)$/i.test(path))) {
  const size = (await stat(file)).size;
  assert(size <= 100 * 1024 * 1024, `${file}: exceeds GitHub's 100 MiB file limit`);
  if (size > 50 * 1024 * 1024)
    console.warn(`${file}: exceeds GitHub's 50 MiB warning threshold; optimise before publishing`);
  assert(size > 1024, `${file}: video is too small; check for an LFS pointer or placeholder`);
}
assert.equal(await readFile('CNAME', 'utf8'), await readFile('dist/CNAME', 'utf8'));
assert(all.includes('dist/404.html'));
assert(all.includes('dist/.nojekyll'));
assert(all.includes('dist/contact/index.html'));
assert(all.includes('dist/contact.html'));
const sitemap = await readFile('dist/sitemap.xml', 'utf8');
assert.equal((sitemap.match(/<loc>https:\/\/fintaxtech.co.uk\/promo\/<\/loc>/g) ?? []).length, 1);
assert(sitemap.includes('<loc>https://fintaxtech.co.uk/contact/</loc>'));
assert(!sitemap.includes('/contact.html'));
assert(
  !/name="robots" content="[^"]*noindex/.test(await readFile('dist/promo/index.html', 'utf8')),
);
const broken = [];
for (const file of all.filter((f) => f.endsWith('.html'))) {
  const html = await readFile(file, 'utf8');
  assert(!html.includes('x-dc') && !html.includes('support.js') && !html.includes('dc.html'), file);
  if (!file.includes('/promo/')) assert(!html.includes('£999'), file);
  assert.match(html, /<h1[\s>]/, file);
  for (const match of html.matchAll(/(?:href|src)="(\/[^"#?]*)/g)) {
    const url = match[1];
    if (url.startsWith('//')) continue;
    let target = 'dist' + (url.endsWith('/') ? url + 'index.html' : url);
    try {
      if ((await stat(target)).isDirectory()) target = join(target, 'index.html');
      assert((await stat(target)).isFile());
    } catch {
      broken.push({ file, url });
    }
  }
}
assert.deepEqual(broken, []);
console.log(
  `Static output verified: ${all.filter((f) => f.endsWith('.html')).length} HTML files, internal links/assets, CNAME, shared app policy pages, 404, sitemap and no Claude runtime.`,
);
