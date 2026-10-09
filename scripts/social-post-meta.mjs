// Posts newly published blog articles to the FinTaxTech Facebook Page and Instagram account.
//
// Reads social/posts/<slug>.json files (written by the daily blog routine), waits until the
// article URL is live, then publishes the same portrait image to both networks. Facebook posts are
// photo posts with no links in the text, because the Page has a monthly limit on link posts.
// Duplicate posts are avoided by checking the Page feed and Instagram media before publishing,
// so re-running is safe.
//
// Env: META_SYSTEM_TOKEN, META_PAGE_ID (GitHub secrets), DRY_RUN, SLUG, SOURCE_SHA,
//      MAX_AGE_DAYS (default 2), GRAPH_VERSION (default v23.0).
import { readdir, readFile, appendFile } from 'node:fs/promises';
import { execSync } from 'node:child_process';

const env = process.env;
const GRAPH = `https://graph.facebook.com/${env.GRAPH_VERSION || 'v23.0'}`;
const DRY_RUN = env.DRY_RUN === 'true';
const ONLY_SLUG = (env.SLUG || '').trim();
const MAX_AGE_DAYS = Number(env.MAX_AGE_DAYS || 2);
const REPO = env.GITHUB_REPOSITORY || 'janshair/fintaxtech_web';
const SHA = env.SOURCE_SHA || execSync('git rev-parse HEAD').toString().trim();
const POSTS_DIR = 'social/posts';

const summary = [];
const log = (line) => {
  console.log(line);
  summary.push(line);
};
let failed = false;

// Anything Facebook might turn into a link: full URLs, www., or bare domains.
const LINK_RE = /https?:\/\/|www\.|\b[a-z0-9-]+\.(?:co\.uk|com|net|org|io|uk)\b/i;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const norm = (s) => String(s || '').replace(/\s+/g, ' ').trim();

async function graph(path, { token, method = 'GET', params = {} } = {}) {
  const body = new URLSearchParams({ ...params, access_token: token });
  const url = method === 'GET' ? `${GRAPH}/${path}?${body}` : `${GRAPH}/${path}`;
  const res = await fetch(url, method === 'GET' ? {} : { method, body });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || json.error) {
    const e = json.error || {};
    throw new Error(`${method} /${path.split('?')[0]} failed: ${e.message || res.status} (code ${e.code ?? '-'})`);
  }
  return json;
}

async function waitForUrl(url, { attempts, delayMs, contentType }) {
  for (let i = 1; i <= attempts; i++) {
    const res = await fetch(url, { method: 'GET', redirect: 'follow' }).catch(() => null);
    if (res?.ok && (!contentType || (res.headers.get('content-type') || '').includes(contentType))) return true;
    if (i < attempts) await sleep(delayMs);
  }
  return false;
}

async function loadPosts() {
  let files = [];
  try {
    files = (await readdir(POSTS_DIR)).filter((f) => f.endsWith('.json'));
  } catch {
    return [];
  }
  const cutoff = Date.now() - MAX_AGE_DAYS * 86_400_000;
  const posts = [];
  for (const file of files) {
    const post = JSON.parse(await readFile(`${POSTS_DIR}/${file}`, 'utf8'));
    const problems = [];
    if (!post.slug || `${post.slug}.json` !== file) problems.push('slug must match the file name');
    if (post.url !== `https://fintaxtech.co.uk/blog/${post.slug}/`) problems.push('url must be the article URL');
    if (!/^\d{4}-\d{2}-\d{2}$/.test(post.date || '')) problems.push('date must be YYYY-MM-DD');
    if (!norm(post.title)) problems.push('title is required');
    if (!/\.jpe?g$/i.test(post.image || '')) problems.push('image must be a .jpg path in the repo');
    const fbMessage = norm(post.facebook?.message);
    if (!fbMessage) problems.push('facebook.message is required');
    if (LINK_RE.test(fbMessage)) problems.push('facebook.message must not contain links or domain names');
    if (post.title && !fbMessage.includes(norm(post.title))) problems.push('facebook.message must name the article title');
    if (!norm(post.instagram?.caption)) problems.push('instagram.caption is required');
    if (problems.length) {
      log(`- ❌ \`${file}\`: ${problems.join('; ')}`);
      failed = true;
      continue;
    }
    if (ONLY_SLUG ? post.slug !== ONLY_SLUG : Date.parse(post.date) < cutoff) continue;
    posts.push(post);
  }
  return posts;
}

async function main() {
  log(`## Social posting ${DRY_RUN ? '(dry run — nothing will be posted)' : ''}`);
  const posts = await loadPosts();
  log(`Articles to consider: ${posts.length ? posts.map((p) => `\`${p.slug}\``).join(', ') : 'none'}`);

  if (!env.META_SYSTEM_TOKEN || !env.META_PAGE_ID) {
    log('❌ META_SYSTEM_TOKEN and META_PAGE_ID secrets are required.');
    failed = true;
    return;
  }

  const systemToken = env.META_SYSTEM_TOKEN;
  const page = await graph(env.META_PAGE_ID, {
    token: systemToken,
    params: { fields: 'name,username,access_token,instagram_business_account{id,username}' },
  });
  const ig = page.instagram_business_account;
  log(`Facebook Page: **${page.name}** (@${page.username || '-'})`);
  log(`Instagram: ${ig ? `**@${ig.username}**` : '❌ no Instagram business account linked to this Page'}`);
  if (!page.access_token) throw new Error('The token has no access to this Page. Assign the Page to the system user with Content permission.');

  const perms = await graph('me/permissions', { token: systemToken });
  const granted = perms.data.filter((p) => p.status === 'granted').map((p) => p.permission);
  const needed = ['pages_show_list', 'pages_read_engagement', 'pages_manage_posts', 'instagram_basic', 'instagram_content_publish'];
  const missing = needed.filter((p) => !granted.includes(p));
  log(`Permissions: ${missing.length ? `❌ missing ${missing.join(', ')}` : '✅ all required permissions granted'}`);
  if (missing.length) failed = true;

  const pageToken = page.access_token;
  for (const post of posts) {
    log(`### ${post.slug}`);
    const live = await waitForUrl(post.url, DRY_RUN ? { attempts: 1, delayMs: 0 } : { attempts: 20, delayMs: 30_000 });
    log(`Article URL ${live ? 'is live' : '❌ is not reachable'}: ${post.url}`);
    if (!live && !DRY_RUN) {
      failed = true;
      continue;
    }

    const imageUrl = `https://raw.githubusercontent.com/${REPO}/${SHA}/${post.image}`;
    if (!(await waitForUrl(imageUrl, { attempts: 3, delayMs: 5_000, contentType: 'image/jpeg' }))) {
      log(`❌ Image is not a reachable JPEG: ${imageUrl}`);
      failed = true;
      continue;
    }

    // Facebook: photo post with the message as its caption, skipped if a recent post starts the same way.
    try {
      const feed = await graph(`${env.META_PAGE_ID}/posts`, { token: pageToken, params: { fields: 'message', limit: '50' } });
      const fbMarker = norm(post.facebook.message).slice(0, 80);
      if (feed.data.some((p) => norm(p.message).startsWith(fbMarker))) {
        log('Facebook: already posted, skipping');
      } else if (DRY_RUN) {
        log(`Facebook: would post image ${post.image} with ${norm(post.facebook.message).length} characters of text`);
      } else {
        const res = await graph(`${env.META_PAGE_ID}/photos`, {
          token: pageToken,
          method: 'POST',
          params: { url: imageUrl, caption: post.facebook.message },
        });
        log(`Facebook: ✅ posted (${res.post_id || res.id})`);
      }
    } catch (err) {
      log(`Facebook: ❌ ${err.message}`);
      failed = true;
    }

    // Instagram: image post, skipped if recent media already has this caption.
    if (!ig) continue;
    try {
      const media = await graph(`${ig.id}/media`, { token: pageToken, params: { fields: 'caption', limit: '50' } });
      const marker = norm(post.instagram.caption).slice(0, 80);
      if (media.data.some((m) => norm(m.caption).startsWith(marker))) {
        log('Instagram: already posted, skipping');
        continue;
      }
      if (DRY_RUN) {
        log(`Instagram: would post image ${post.image} with a ${norm(post.instagram.caption).length}-character caption`);
        continue;
      }
      const container = await graph(`${ig.id}/media`, {
        token: pageToken,
        method: 'POST',
        params: { image_url: imageUrl, caption: post.instagram.caption },
      });
      let status = '';
      for (let i = 0; i < 12 && status !== 'FINISHED'; i++) {
        await sleep(5_000);
        status = (await graph(container.id, { token: pageToken, params: { fields: 'status_code' } })).status_code;
        if (status === 'ERROR' || status === 'EXPIRED') throw new Error(`media container status ${status}`);
      }
      if (status !== 'FINISHED') throw new Error(`media container not ready (status ${status || 'unknown'})`);
      const published = await graph(`${ig.id}/media_publish`, {
        token: pageToken,
        method: 'POST',
        params: { creation_id: container.id },
      });
      log(`Instagram: ✅ posted (${published.id})`);
    } catch (err) {
      log(`Instagram: ❌ ${err.message}`);
      failed = true;
    }
  }
}

try {
  await main();
} catch (err) {
  log(`❌ ${err.message}`);
  failed = true;
}
if (env.GITHUB_STEP_SUMMARY) await appendFile(env.GITHUB_STEP_SUMMARY, summary.join('\n\n') + '\n');
process.exit(failed ? 1 : 0);
