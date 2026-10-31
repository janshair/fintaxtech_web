// Posts newly published blog articles to the FinTaxTech Facebook Page and Instagram account.
//
// Reads social/posts/<slug>.json files (written by the daily blog routine), waits until the
// article URL is live (the site deploys alongside this run, usually in 2 minutes but sometimes
// over 15), then publishes to both networks. When the post file names a "music" track it
// renders and posts a vertical Reel (scripts/social-reel.mjs); otherwise it posts the portrait
// images, as one image or as a swipeable carousel when "images" lists several. Facebook text never
// contains links, because the Page has a monthly limit on link posts.
// Duplicate posts are avoided by checking the Page feed and Instagram media before publishing,
// so re-running is safe.
//
// Env: META_SYSTEM_TOKEN, META_PAGE_ID, MUSIC_KEY (GitHub secrets), DRY_RUN, SLUG, SOURCE_SHA,
//      MAX_AGE_DAYS (default 2), GRAPH_VERSION (default v23.0), and TEST_MUSIC, which renders a
//      Reel with that track during a dry run even if the post file names no music. When
//      REEL_EXPORT_DIR is set, a copy of each Reel without its music is saved there, for posting
//      by hand on platforms the Meta-licensed music does not cover (TikTok, YouTube).
import { readdir, readFile, appendFile, stat, mkdtemp, mkdir } from 'node:fs/promises';
import { execSync, execFileSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const env = process.env;
const VERSION = env.GRAPH_VERSION || 'v23.0';
const GRAPH = `https://graph.facebook.com/${VERSION}`;
const DRY_RUN = env.DRY_RUN === 'true';
const ONLY_SLUG = (env.SLUG || '').trim();
const MAX_AGE_DAYS = Number(env.MAX_AGE_DAYS || 2);
const REPO = env.GITHUB_REPOSITORY || 'janshair/fintaxtech_web';
const SHA = env.SOURCE_SHA || execSync('git rev-parse HEAD').toString().trim();
const POSTS_DIR = 'social/posts';
const TEST_MUSIC = DRY_RUN ? (env.TEST_MUSIC || '').trim() : '';
const TRACKS = await readFile('social/music/tracks.json', 'utf8')
  .then((t) => JSON.parse(t).tracks)
  .catch(() => []);
// The Reel shows the article title and illustration from about 3 to 6 seconds in.
const REEL_THUMB_MS = 4500;

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
    const error = new Error(`${method} /${path.split('?')[0]} failed: ${e.message || res.status} (code ${e.code ?? '-'})`);
    // 9004 means Meta could not fetch the image as a photo; 1 and 2 are Meta's "try again later" errors.
    error.transient = res.status >= 500 || [1, 2, 9004].includes(e.code);
    throw error;
  }
  return json;
}

// Media uploads make Meta fetch each image from GitHub, which now and then fails or is throttled.
// Those failures are temporary, so retry them with a growing pause before giving up.
async function upload(label, path, { token, params }) {
  for (let attempt = 1; ; attempt++) {
    try {
      return await graph(path, { token, method: 'POST', params });
    } catch (err) {
      if (!err.transient || attempt === 4) throw err;
      log(`${label}: temporary error, retrying in ${attempt * 20}s (${err.message})`);
      await sleep(attempt * 20_000);
    }
  }
}

async function waitForUrl(url, { attempts, delayMs, contentType }) {
  for (let i = 1; i <= attempts; i++) {
    const res = await fetch(url, { method: 'GET', redirect: 'follow' }).catch(() => null);
    if (res?.ok && (!contentType || (res.headers.get('content-type') || '').includes(contentType))) return true;
    if (i < attempts) await sleep(delayMs);
  }
  return false;
}

async function waitForContainer(id, token, tries = 12) {
  let status = '';
  for (let i = 0; i < tries && status !== 'FINISHED'; i++) {
    await sleep(5_000);
    status = (await graph(id, { token, params: { fields: 'status_code' } })).status_code;
    if (status === 'ERROR' || status === 'EXPIRED') throw new Error(`media container status ${status}`);
  }
  if (status !== 'FINISHED') throw new Error(`media container not ready (status ${status || 'unknown'})`);
}

// Sends a local video file to Meta's upload host, retrying temporary failures.
async function rupload(url, token, file) {
  const bytes = await readFile(file);
  for (let attempt = 1; ; attempt++) {
    const res = await fetch(url, {
      method: 'POST',
      headers: { Authorization: `OAuth ${token}`, offset: '0', file_size: String(bytes.length) },
      body: bytes,
    }).catch((err) => ({ ok: false, status: 0, text: async () => String(err) }));
    if (res.ok) return;
    const detail = (await res.text()).slice(0, 200);
    if ((res.status > 0 && res.status < 500) || attempt === 4) {
      throw new Error(`upload to ${new URL(url).host} failed: ${res.status} ${detail}`);
    }
    log(`Upload: temporary error ${res.status}, retrying in ${attempt * 20}s`);
    await sleep(attempt * 20_000);
  }
}

async function postReel(post, musicId, { pageToken, ig }) {
  const track = TRACKS.find((t) => t.id === musicId);
  let video;
  try {
    video = join(await mkdtemp(join(tmpdir(), 'reel-')), `${post.slug}.mp4`);
    execFileSync('node', ['scripts/social-reel.mjs', post.slug, video], {
      env: { ...env, REEL_MUSIC: musicId },
      stdio: ['ignore', 'inherit', 'inherit'],
    });
    log(`Reel: rendered ${((await stat(video)).size / 1e6).toFixed(1)} MB with "${track.title}" by ${track.artist}`);
    if (env.REEL_EXPORT_DIR) {
      await mkdir(env.REEL_EXPORT_DIR, { recursive: true });
      const silent = join(env.REEL_EXPORT_DIR, `${post.slug}-reel-no-music.mp4`);
      execFileSync('ffmpeg', ['-v', 'error', '-y', '-i', video, '-map', '0:v', '-c', 'copy', '-movflags', '+faststart', silent]);
      log(`Reel: saved a copy without music as \`${post.slug}-reel-no-music.mp4\` (download it from this run's Artifacts)`);
    }
  } catch (err) {
    log(`Reel: ❌ could not render the video (${err.message.split('\n')[0]})`);
    failed = true;
    return;
  }

  // Facebook Reel, skipped if a recent Reel or post starts with the same text.
  try {
    const marker = norm(post.facebook.message).slice(0, 80);
    const reels = await graph(`${env.META_PAGE_ID}/video_reels`, {
      token: pageToken,
      params: { fields: 'description', limit: '25' },
    }).catch(() => ({ data: [] }));
    const feed = await graph(`${env.META_PAGE_ID}/posts`, { token: pageToken, params: { fields: 'message', limit: '50' } });
    const existing = [...reels.data.map((r) => r.description), ...feed.data.map((p) => p.message)];
    if (existing.some((m) => norm(m).startsWith(marker))) {
      log('Facebook: already posted, skipping');
    } else if (DRY_RUN) {
      log(`Facebook: would post the Reel with ${norm(post.facebook.message).length} characters of text`);
    } else {
      const session = await upload('Facebook', `${env.META_PAGE_ID}/video_reels`, {
        token: pageToken,
        params: { upload_phase: 'start' },
      });
      await rupload(session.upload_url || `https://rupload.facebook.com/video-upload/${VERSION}/${session.video_id}`, pageToken, video);
      await graph(`${env.META_PAGE_ID}/video_reels`, {
        token: pageToken,
        method: 'POST',
        params: { upload_phase: 'finish', video_id: session.video_id, video_state: 'PUBLISHED', description: post.facebook.message },
      });
      log(`Facebook: ✅ posted the Reel (${session.video_id})`);
    }
  } catch (err) {
    log(`Facebook: ❌ ${err.message}`);
    failed = true;
  }

  // Instagram Reel, skipped if recent media already has this caption.
  if (!ig) return;
  try {
    const media = await graph(`${ig.id}/media`, { token: pageToken, params: { fields: 'caption', limit: '50' } });
    const marker = norm(post.instagram.caption).slice(0, 80);
    if (media.data.some((m) => norm(m.caption).startsWith(marker))) {
      log('Instagram: already posted, skipping');
      return;
    }
    if (DRY_RUN) {
      log(`Instagram: would post the Reel with a ${norm(post.instagram.caption).length}-character caption`);
      return;
    }
    const container = await upload('Instagram', `${ig.id}/media`, {
      token: pageToken,
      params: { media_type: 'REELS', upload_type: 'resumable', caption: post.instagram.caption, thumb_offset: String(REEL_THUMB_MS) },
    });
    await rupload(container.uri || `https://rupload.facebook.com/ig-api-upload/${VERSION}/${container.id}`, pageToken, video);
    await waitForContainer(container.id, pageToken, 60);
    const published = await graph(`${ig.id}/media_publish`, {
      token: pageToken,
      method: 'POST',
      params: { creation_id: container.id },
    });
    log(`Instagram: ✅ posted the Reel (${published.id})`);
  } catch (err) {
    log(`Instagram: ❌ ${err.message}`);
    failed = true;
  }
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
    post.images = post.images?.length ? post.images : [post.image];
    if (post.images[0] !== post.image) problems.push('images must start with the cover image');
    if (post.images.length > 10 || post.images.some((f) => !/\.jpe?g$/i.test(f || ''))) {
      problems.push('images must be 1–10 .jpg paths in the repo');
    }
    const fbMessage = norm(post.facebook?.message);
    if (!fbMessage) problems.push('facebook.message is required');
    if (LINK_RE.test(fbMessage)) problems.push('facebook.message must not contain links or domain names');
    if (post.title && !fbMessage.includes(norm(post.title))) problems.push('facebook.message must name the article title');
    if (!norm(post.instagram?.caption)) problems.push('instagram.caption is required');
    if (post.music && !TRACKS.some((t) => t.id === post.music)) problems.push(`music "${post.music}" is not in social/music/tracks.json`);
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
    const live = await waitForUrl(post.url, DRY_RUN ? { attempts: 1, delayMs: 0 } : { attempts: 50, delayMs: 30_000 });
    log(`Article URL ${live ? 'is live' : '❌ is not reachable'}: ${post.url}`);
    if (!live && !DRY_RUN) {
      failed = true;
      continue;
    }

    const musicId = post.music || TEST_MUSIC;
    if (musicId) {
      if (!TRACKS.some((t) => t.id === musicId)) {
        log(`❌ Music "${musicId}" is not in social/music/tracks.json`);
        failed = true;
      } else {
        await postReel(post, musicId, { pageToken, ig });
      }
      continue;
    }

    const imageUrls = post.images.map((f) => `https://raw.githubusercontent.com/${REPO}/${SHA}/${f}`);
    const reachable = await Promise.all(
      imageUrls.map((u) => waitForUrl(u, { attempts: 3, delayMs: 5_000, contentType: 'image/jpeg' })),
    );
    if (reachable.includes(false)) {
      log(`❌ Image is not a reachable JPEG: ${imageUrls[reachable.indexOf(false)]}`);
      failed = true;
      continue;
    }
    const what = imageUrls.length > 1 ? `a ${imageUrls.length}-image carousel` : `image ${post.image}`;

    // Facebook: photo post with the message as its caption, skipped if a recent post starts the same way.
    try {
      const feed = await graph(`${env.META_PAGE_ID}/posts`, { token: pageToken, params: { fields: 'message', limit: '50' } });
      const fbMarker = norm(post.facebook.message).slice(0, 80);
      if (feed.data.some((p) => norm(p.message).startsWith(fbMarker))) {
        log('Facebook: already posted, skipping');
      } else if (DRY_RUN) {
        log(`Facebook: would post ${what} with ${norm(post.facebook.message).length} characters of text`);
      } else if (imageUrls.length === 1) {
        const res = await upload('Facebook', `${env.META_PAGE_ID}/photos`, {
          token: pageToken,
          params: { url: imageUrls[0], caption: post.facebook.message },
        });
        log(`Facebook: ✅ posted (${res.post_id || res.id})`);
      } else {
        // Multi-photo post: upload each photo unpublished, then attach them all to one feed post.
        const attached = {};
        for (const [i, url] of imageUrls.entries()) {
          const photo = await upload('Facebook', `${env.META_PAGE_ID}/photos`, {
            token: pageToken,
            params: { url, published: 'false' },
          });
          attached[`attached_media[${i}]`] = JSON.stringify({ media_fbid: photo.id });
        }
        const res = await graph(`${env.META_PAGE_ID}/feed`, {
          token: pageToken,
          method: 'POST',
          params: { message: post.facebook.message, ...attached },
        });
        log(`Facebook: ✅ posted ${what} (${res.id})`);
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
        log(`Instagram: would post ${what} with a ${norm(post.instagram.caption).length}-character caption`);
        continue;
      }
      let container;
      if (imageUrls.length === 1) {
        container = await upload('Instagram', `${ig.id}/media`, {
          token: pageToken,
          params: { image_url: imageUrls[0], caption: post.instagram.caption },
        });
      } else {
        // Carousel: one child container per image, then a parent container that holds the caption.
        const children = [];
        for (const url of imageUrls) {
          const child = await upload('Instagram', `${ig.id}/media`, {
            token: pageToken,
            params: { image_url: url, is_carousel_item: 'true' },
          });
          await waitForContainer(child.id, pageToken);
          children.push(child.id);
        }
        container = await upload('Instagram', `${ig.id}/media`, {
          token: pageToken,
          params: { media_type: 'CAROUSEL', children: children.join(','), caption: post.instagram.caption },
        });
      }
      await waitForContainer(container.id, pageToken);
      const published = await graph(`${ig.id}/media_publish`, {
        token: pageToken,
        method: 'POST',
        params: { creation_id: container.id },
      });
      log(`Instagram: ✅ posted ${what} (${published.id})`);
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
