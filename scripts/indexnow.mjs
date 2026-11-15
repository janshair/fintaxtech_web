// Tells IndexNow which pages changed in a deploy. IndexNow feeds Bing and the search engines that
// share its index, which several AI assistants also search, so new and updated articles are picked
// up without waiting for a crawl.
//
// Usage: node scripts/indexnow.mjs          blog articles added or changed between BEFORE_SHA and AFTER_SHA
//        node scripts/indexnow.mjs --all    every URL in the live sitemap (first run, or after a large change)
//
// Env: BEFORE_SHA and AFTER_SHA (the push range), DRY_RUN=true to print the URLs without sending.
// The key is public by design: it is the name and content of public/<key>.txt, which IndexNow fetches
// from the live site to confirm the submission comes from the site's owner.
//
// A failed submission never fails the deploy; it is reported as a warning.
import { readdir, readFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ENDPOINT = 'https://api.indexnow.org/indexnow';
const BLOG_DIR = 'src/content/blog/';
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// The public URL of an article file, or null for a draft. Mirrors postSlug in src/lib/blog-posts.ts.
export function articleURL(markdown, file, origin) {
  const frontmatter = markdown.split(/^---$/m)[1] ?? '';
  if (!/^draft:\s*false\s*$/m.test(frontmatter)) return null;
  const slug =
    frontmatter.match(/^slug:\s*['"]?([a-z0-9-]+)['"]?\s*$/m)?.[1] ??
    file.replace(/^.*\//, '').replace(/\.md$/, '');
  return `${origin}/blog/${slug}/`;
}

// Article files added, changed or renamed in a `git diff --name-status` listing, with whether any is new.
export function changedArticles(nameStatus) {
  const files = [];
  let added = false;
  for (const line of nameStatus.split('\n')) {
    const [status, ...paths] = line.trim().split(/\s+/);
    const file = paths.at(-1);
    if (!file?.startsWith(BLOG_DIR) || !file.endsWith('.md') || !/^[AMR]/.test(status ?? ''))
      continue;
    files.push(file);
    if (/^[AR]/.test(status)) added = true;
  }
  return { files, added };
}

export const sitemapURLs = (xml) =>
  [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].trim());

async function readKey() {
  for (const name of await readdir('public')) {
    const key = name.match(/^([a-f0-9]{32})\.txt$/)?.[1];
    if (key && (await readFile(`public/${name}`, 'utf8')).trim() === key) return key;
  }
  return null;
}

async function pushedArticleURLs(origin) {
  const { BEFORE_SHA: before, AFTER_SHA: after = 'HEAD' } = process.env;
  // A manual run or a branch's first push has no earlier commit to compare with.
  if (!before || /^0+$/.test(before)) return [];
  const listing = execFileSync('git', ['diff', '--name-status', before, after, '--', BLOG_DIR], {
    encoding: 'utf8',
  });
  const { files, added } = changedArticles(listing);
  const urls = [];
  for (const file of files) {
    const url = articleURL(await readFile(file, 'utf8'), file, origin);
    if (url) urls.push(url);
  }
  // A new article also changes the blog index that lists it.
  if (urls.length && added) urls.push(`${origin}/blog/`);
  return urls;
}

async function main() {
  const host = (await readFile('public/CNAME', 'utf8')).trim();
  const origin = `https://${host}`;
  const key = await readKey();
  if (!key) return console.log('::warning::IndexNow: no key file found in public/, nothing sent');

  const urls = process.argv.includes('--all')
    ? sitemapURLs(await (await fetch(`${origin}/sitemap.xml`)).text())
    : await pushedArticleURLs(origin);
  if (!urls.length)
    return console.log('IndexNow: no article changes in this deploy, nothing to send');
  console.log(`IndexNow: ${urls.length} URL(s)\n${urls.join('\n')}`);
  if (process.env.DRY_RUN === 'true') return console.log('IndexNow: dry run, nothing sent');

  // The deploy has just finished; give the key file and the first page a moment to be reachable.
  const keyLocation = `${origin}/${key}.txt`;
  for (const url of [keyLocation, urls[0]]) {
    for (let attempt = 1; attempt <= 6 && !(await fetch(url).catch(() => null))?.ok; attempt++)
      await sleep(10_000);
  }

  const response = await fetch(ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify({ host, key, keyLocation, urlList: urls }),
  });
  // 200 means accepted; 202 means accepted, with the key still to be checked.
  if (response.status === 200 || response.status === 202)
    console.log(`IndexNow: accepted (HTTP ${response.status})`);
  else
    console.log(
      `::warning::IndexNow: not accepted (HTTP ${response.status}) ${(await response.text()).slice(0, 200)}`,
    );
}

if (process.argv[1] === fileURLToPath(import.meta.url))
  await main().catch((error) => console.log(`::warning::IndexNow: ${error.message}`));
