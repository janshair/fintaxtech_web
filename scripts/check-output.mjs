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
assert.equal(await readFile('CNAME', 'utf8'), await readFile('dist/CNAME', 'utf8'));
assert(all.includes('dist/404.html'));
assert(all.includes('dist/.nojekyll'));
const sitemap = await readFile('dist/sitemap.xml', 'utf8');
assert(!sitemap.includes('/promo'));
assert.match(
  await readFile('dist/promo/index.html', 'utf8'),
  /name="robots" content="noindex,follow"/,
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
    const target = 'dist' + (url.endsWith('/') ? url + 'index.html' : url);
    try {
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
