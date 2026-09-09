import { parse } from 'parse5';
import { readFile, readdir, stat, writeFile, mkdir } from 'node:fs/promises';
import assert from 'node:assert/strict';
import { join } from 'node:path';
const origin = 'https://fintaxtech.co.uk';
async function files(dir) {
  return (
    await Promise.all(
      (await readdir(dir, { withFileTypes: true })).map((e) =>
        e.isDirectory() ? files(join(dir, e.name)) : [join(dir, e.name)],
      ),
    )
  ).flat();
}
function elements(node, tag) {
  return [
    ...(node.tagName === tag ? [node] : []),
    ...(node.childNodes ?? []).flatMap((n) => elements(n, tag)),
  ];
}
function attr(node, name) {
  return node.attrs?.find((a) => a.name === name)?.value;
}
function text(node) {
  return node.value ?? (node.childNodes ?? []).map(text).join('');
}
const rows = [];
const docs = new Map();
for (const file of (await files('dist')).filter((f) => f.endsWith('.html'))) {
  const path = file.slice(4).replace(/index\.html$/, '');
  const html = await readFile(file, 'utf8');
  const doc = parse(html);
  docs.set(path, doc);
  const meta = (name) =>
    elements(doc, 'meta')
      .filter((n) => attr(n, 'name') === name || attr(n, 'property') === name)
      .map((n) => attr(n, 'content'));
  const canonical = elements(doc, 'link')
    .filter((n) => attr(n, 'rel') === 'canonical')
    .map((n) => attr(n, 'href'));
  const titles = elements(doc, 'title').map(text);
  const noindex = meta('robots').some((x) => x.includes('noindex'));
  assert.equal(titles.length, 1, path);
  assert(titles[0].length > 10, path);
  assert.equal(meta('description').length, 1, path);
  assert(meta('description')[0].length > 20, path);
  assert.equal(elements(doc, 'h1').length, 1, path);
  assert.equal(attr(elements(doc, 'html')[0], 'lang'), 'en', path);
  assert.deepEqual(canonical, [origin + path], path);
  for (const name of [
    'og:title',
    'og:description',
    'og:type',
    'og:url',
    'og:image',
    'og:image:alt',
    'twitter:card',
    'twitter:title',
    'twitter:description',
    'twitter:image',
    'twitter:image:alt',
    'viewport',
  ])
    assert.equal(meta(name).length, 1, `${path}: ${name}`);
  assert.equal(meta('og:url')[0], canonical[0]);
  assert.equal(meta('og:title')[0], titles[0]);
  assert.equal(meta('og:image')[0], origin + '/social.png');
  const graph = elements(doc, 'script')
    .filter((n) => attr(n, 'type') === 'application/ld+json')
    .flatMap((n) => JSON.parse(text(n))['@graph']);
  const org = graph.find((n) => n['@type'] === 'Organization');
  assert.equal(org.sameAs.length, 5, path);
  assert.equal(new Set(org.sameAs).size, 5, path);
  assert(
    graph.some((n) => n['@type'] === 'WebSite'),
    path,
  );
  const crumbs = graph.find((n) => n['@type'] === 'BreadcrumbList');
  if (path !== '/' && !noindex) {
    assert(crumbs, path);
    assert.equal(crumbs.itemListElement.at(-1).item, canonical[0]);
  }
  if (/^\/services\/[^/]+\/$/.test(path))
    assert(
      graph.some((n) => n['@type'] === 'Service'),
      path,
    );
  for (const img of elements(doc, 'img'))
    assert(attr(img, 'alt') !== undefined, `${path}: missing alt`);
  // Walk document order to catch skipped levels, allowing independent footer/dialog outlines.
  let level = 0;
  function walk(n) {
    if (/^h[1-6]$/.test(n.tagName ?? '')) {
      const next = Number(n.tagName[1]);
      assert(next <= level + 1, `${path}: heading h${level} to h${next}`);
      level = next;
    }
    for (const c of n.childNodes ?? []) walk(c);
  }
  walk(doc);
  rows.push({
    path,
    title: titles[0],
    description: meta('description')[0],
    noindex,
    canonical: canonical[0],
    schema: graph.map((n) => n['@type']),
  });
}
// Preserve all policy wording while allowing corrected links and shared navigation.
for (const path of ['/invoice/privacy.html', '/reprocket/privacy.html', '/reprocket/terms.html']) {
  const archived = parse(await readFile(path.slice(1), 'utf8'));
  const original = elements(archived, 'main')[0];
  const migrated = elements(docs.get(path), 'div').find((n) => attr(n, 'class') === 'app-policy');
  const normalize = (n) => text(n).replace(/\s+/g, ' ').trim();
  assert.equal(normalize(migrated), normalize(original), `${path}: policy wording changed`);
}
const sitemap = await readFile('dist/sitemap.xml', 'utf8');
const urls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
assert.deepEqual(
  [...urls].sort(),
  rows
    .filter((r) => !r.noindex)
    .map((r) => r.canonical)
    .sort(),
);
assert.equal(new Set(urls).size, urls.length);
assert.equal(urls.filter((url) => url === origin + '/start/').length, 1);
assert.equal(rows.find((row) => row.path === '/start/').noindex, false);
assert.equal(rows.find((row) => row.path === '/enquiry/').noindex, true);
assert(!urls.some((u) => /\?|\/promo\/|\/enquiry\//.test(u)));
const robots = await readFile('dist/robots.txt', 'utf8');
assert.match(robots, /User-agent: \*/);
assert(!/^Disallow:\s*\S/m.test(robots));
assert(robots.includes(`Sitemap: ${origin}/sitemap.xml`));
for (const property of ['title', 'description']) {
  const values = rows.filter((r) => !r.noindex).map((r) => r[property]);
  assert.equal(new Set(values).size, values.length, `Duplicate ${property}`);
}
const start = docs.get('/start/');
assert.equal(text(elements(start, 'h1')[0]), 'What would you like FinTaxTech to help you create?');
assert.equal(elements(start, 'a').filter((n) => attr(n, 'class') === 'service-card').length, 4);
for (const phrase of [
  'structured questions',
  'private enquiry PDF',
  'Nothing is sent automatically',
])
  assert(text(start).includes(phrase));
const broken = [];
for (const [path, doc] of docs)
  for (const tag of ['a', 'link', 'script', 'img'])
    for (const el of elements(doc, tag)) {
      const raw = attr(el, tag === 'img' || tag === 'script' ? 'src' : 'href');
      if (!raw) continue;
      const url = new URL(raw, origin + path);
      if (url.origin !== origin) continue;
      let target = 'dist' + url.pathname + (url.pathname.endsWith('/') ? 'index.html' : '');
      try {
        assert((await stat(target)).isFile());
        if (url.hash && docs.has(url.pathname)) {
          const ids = [];
          function walk(n) {
            if (attr(n, 'id')) ids.push(attr(n, 'id'));
            for (const c of n.childNodes ?? []) walk(c);
          }
          walk(docs.get(url.pathname));
          assert(ids.includes(decodeURIComponent(url.hash.slice(1))));
        }
      } catch {
        broken.push({ path, raw });
      }
    }
assert.deepEqual(broken, [], 'Broken internal links, fragments or assets');
await mkdir('docs/seo-audit', { recursive: true });
await writeFile('docs/seo-audit/generated-after.json', JSON.stringify(rows, null, 2));
console.log(
  `SEO verified: ${rows.length} HTML pages; ${urls.length} unique canonical sitemap URLs; metadata, heading hierarchy, schemas, images, links and crawl rules passed.`,
);
