// Renders the vertical Reel (1080×1920 MP4 with music) for one blog article.
//
// Usage: node scripts/social-reel.mjs <slug> <out.mp4>
//
// Reads social/posts/<slug>.json ("title", "category", "cards", "facebook.message" and "music"),
// the article hero and social/brand/logo.png. The track named in "music" is decrypted with the
// MUSIC_KEY secret, its tempo is measured so every scene lasts a whole number of beats, and
// playback starts where the track reaches full energy. Needs ffmpeg and openssl on PATH; set
// PW_CHROMIUM_PATH to use a specific Chromium binary.
import { readFile, mkdtemp, rm } from 'node:fs/promises';
import { spawn, execFileSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { chromium } from '@playwright/test';

const [slug, outFile] = process.argv.slice(2);
if (!slug || !outFile) throw new Error('Usage: node scripts/social-reel.mjs <slug> <out.mp4>');
const FPS = 30;

const post = JSON.parse(await readFile(`social/posts/${slug}.json`, 'utf8'));
const { tracks } = JSON.parse(await readFile('social/music/tracks.json', 'utf8'));
// REEL_MUSIC overrides the post file's track (used by dry-run tests).
const track = tracks.find((t) => t.id === (process.env.REEL_MUSIC || post.music));
if (!track) throw new Error(`No "music" for ${slug}, or the track is not in social/music/tracks.json`);
if (!process.env.MUSIC_KEY) throw new Error('MUSIC_KEY is not set, so the music cannot be decrypted');

const work = await mkdtemp(join(tmpdir(), 'reel-'));
try {
  const audio = join(work, 'music.mp4');
  execFileSync('openssl', ['enc', '-d', '-aes-256-cbc', '-md', 'sha256', '-pbkdf2', '-iter', '200000',
    '-in', track.file, '-out', audio, '-pass', 'env:MUSIC_KEY']);
  const { bpm, offset } = analyse(execFileSync('ffmpeg', ['-v', 'error', '-i', audio, '-ac', '1', '-ar', '11025', '-f', 's16le', '-'], { maxBuffer: 1 << 28 }));

  const b64 = async (path) => (await readFile(path)).toString('base64');
  const font = (pkg, file) => b64(`node_modules/@fontsource/${pkg}/files/${file}`);
  const data = {
    title: post.title,
    category: post.category,
    cards: post.cards,
    hook: post.facebook.message.split('\n')[0],
    hero: `data:image/png;base64,${await b64(`src/assets/blog/${slug}/${slug}-hero.png`)}`,
    logo: `data:image/png;base64,${await b64('social/brand/logo.png')}`,
    beatMs: 60000 / bpm,
    fonts: [
      ['A', 600, await font('archivo', 'archivo-latin-600-normal.woff2')],
      ['P', 400, await font('ibm-plex-sans', 'ibm-plex-sans-latin-400-normal.woff2')],
      ['P', 500, await font('ibm-plex-sans', 'ibm-plex-sans-latin-500-normal.woff2')],
      ['M', 500, await font('ibm-plex-mono', 'ibm-plex-mono-latin-500-normal.woff2')],
    ],
  };

  const browser = await chromium.launch(process.env.PW_CHROMIUM_PATH ? { executablePath: process.env.PW_CHROMIUM_PATH } : {});
  const page = await browser.newPage({ viewport: { width: 1080, height: 1920 } });
  await page.setContent('<body style="margin:0"><canvas id="c" width="1080" height="1920"></canvas></body>');
  const totalMs = await page.evaluate(setUpScenes, data);
  const seconds = totalMs / 1000;
  const frames = Math.ceil(seconds * FPS);

  const ffmpeg = spawn('ffmpeg', [
    '-v', 'error', '-y',
    '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'mjpeg', '-i', '-',
    '-ss', offset.toFixed(3), '-t', seconds.toFixed(3), '-i', audio,
    '-filter_complex', `[1:a]afade=t=in:st=0:d=0.25,afade=t=out:st=${(seconds - 1.6).toFixed(3)}:d=1.6,volume=0.9[a]`,
    '-map', '0:v', '-map', '[a]',
    '-c:v', 'libx264', '-preset', 'medium', '-crf', '18', '-pix_fmt', 'yuv420p', '-profile:v', 'high',
    '-r', String(FPS), '-g', String(FPS * 2), '-keyint_min', String(FPS * 2), '-sc_threshold', '0',
    '-c:a', 'aac', '-b:a', '192k', '-ar', '48000', '-ac', '2',
    '-movflags', '+faststart', '-shortest', outFile,
  ], { stdio: ['pipe', 'inherit', 'inherit'] });
  const finished = new Promise((resolve, reject) =>
    ffmpeg.on('close', (code) => (code === 0 ? resolve() : reject(new Error(`ffmpeg exited with ${code}`)))));

  for (let start = 0; start < frames; start += 15) {
    const batch = await page.evaluate(
      ({ from, to, fps }) => {
        const out = [];
        for (let f = from; f < to; f++) {
          window.drawFrame((f * 1000) / fps);
          out.push(document.getElementById('c').toDataURL('image/jpeg', 0.92).slice(23));
        }
        return out;
      },
      { from: start, to: Math.min(start + 15, frames), fps: FPS },
    );
    for (const jpeg of batch) {
      if (!ffmpeg.stdin.write(Buffer.from(jpeg, 'base64'))) await new Promise((r) => ffmpeg.stdin.once('drain', r));
    }
  }
  ffmpeg.stdin.end();
  await finished;
  await browser.close();
  console.log(`Rendered ${outFile}: ${seconds.toFixed(1)}s, ${frames} frames, "${track.title}" by ${track.artist} at ${bpm.toFixed(1)} BPM from ${offset.toFixed(1)}s`);
} finally {
  await rm(work, { recursive: true, force: true });
}

// Tempo from the autocorrelation of onsets (80–160 BPM), and the first point where the track
// reaches half of its peak loudness, which skips quiet intros.
function analyse(pcm) {
  const samples = new Int16Array(pcm.buffer, pcm.byteOffset, Math.floor(pcm.length / 2));
  const hop = Math.round(11025 / 100);
  const env = [];
  for (let i = 0; i + hop < samples.length; i += hop) {
    let e = 0;
    for (let j = 0; j < hop; j++) e += (samples[i + j] / 32768) ** 2;
    env.push(Math.sqrt(e / hop));
  }
  const onsets = env.map((v, i) => Math.max(0, v - (env[i - 1] ?? v)));
  let best = 0;
  let lag = 60;
  for (let l = 37; l <= 75; l++) {
    let sum = 0;
    for (let i = l; i < onsets.length; i++) sum += onsets[i] * onsets[i - l];
    if (sum > best) [best, lag] = [sum, l];
  }
  const peak = Math.max(...env);
  return { bpm: 6000 / lag, offset: Math.max(0, env.findIndex((v) => v > peak * 0.5) / 100) };
}

// Runs in the page: builds the scene list and exposes drawFrame(ms). Returns the total length.
async function setUpScenes(d) {
  for (const [family, weight, src] of d.fonts) {
    const face = new FontFace(family, `url(data:font/woff2;base64,${src})`, { weight: String(weight) });
    await face.load();
    document.fonts.add(face);
  }
  const load = (src) => new Promise((r) => { const i = new Image(); i.onload = () => r(i); i.src = src; });
  const [hero, logo] = await Promise.all([load(d.hero), load(d.logo)]);
  const x = document.getElementById('c').getContext('2d');
  const C = { bg: '#F7F7F3', ink: '#0B0D10', grey: '#596170', blue: '#2563EB', line: '#D8DCE3', white: '#FFFFFF' };
  const L = 72;
  const W = 1080 - L * 2;

  const wrap = (text, font, max) => {
    x.font = font;
    const lines = [];
    let line = '';
    for (const word of text.split(' ')) {
      const next = line ? `${line} ${word}` : word;
      if (x.measureText(next).width > max && line) { lines.push(line); line = word; } else line = next;
    }
    lines.push(line);
    return lines;
  };
  const fit = (text, start, maxLines) => {
    let size = start;
    let lines = wrap(text, `600 ${size}px A`, W);
    while (lines.length > maxLines && size > 40) { size -= 4; lines = wrap(text, `600 ${size}px A`, W); }
    return { size, lines };
  };
  const ease = (t) => 1 - Math.pow(1 - Math.min(Math.max(t, 0), 1), 3);
  const text = (str, font, color, y, alpha = 1, dy = 0, align = 'left', at = L) => {
    x.globalAlpha = alpha; x.font = font; x.fillStyle = color; x.textAlign = align; x.fillText(str, at, y + dy); x.globalAlpha = 1;
  };

  // Every scene lasts a whole number of beats, so cuts land on the beat.
  const beats = (ms) => Math.max(2, Math.round(ms / d.beatMs)) * d.beatMs;
  const scenes = [
    { kind: 'hook', dur: beats(2800) },
    { kind: 'cover', dur: beats(3200) },
    ...d.cards.map((card, i) => ({ kind: 'point', card, i, dur: beats(3600) })),
    { kind: 'cta', dur: beats(3800) },
  ];
  let total = 0;
  for (const s of scenes) { s.start = total; total += s.dur; }

  const progress = (si, local, dur, light) => {
    const n = scenes.length, gap = 10, w = (W - gap * (n - 1)) / n;
    for (let k = 0; k < n; k++) {
      const x0 = L + k * (w + gap);
      x.fillStyle = light ? 'rgba(255,255,255,.35)' : C.line; x.fillRect(x0, 96, w, 8);
      x.fillStyle = light ? C.white : C.blue;
      if (k < si) x.fillRect(x0, 96, w, 8);
      if (k === si) x.fillRect(x0, 96, w * Math.min(local / dur, 1), 8);
    }
  };

  window.drawFrame = (ms) => {
    const si = Math.max(0, scenes.findLastIndex((s) => ms >= s.start));
    const s = scenes[si];
    const t = ms - s.start;
    const leaving = ease(Math.max(0, t - (s.dur - 260)) / 260);
    const fade = 1 - leaving;
    const lift = -60 * leaving;

    if (s.kind === 'hook') {
      x.fillStyle = C.blue; x.fillRect(0, 0, 1080, 1920);
      text('FINTAXTECH BLOG', '500 30px M', 'rgba(255,255,255,.85)', 640, fade, lift);
      const { size, lines } = fit(d.hook, 108, 6);
      const per = 1300 / d.hook.split(' ').length;
      let shown = 0;
      let y = 700 + size;
      for (const line of lines) {
        let at = L;
        x.font = `600 ${size}px A`;
        for (const word of line.split(' ')) {
          const k = ease((t - 150 - shown * per) / 220);
          text(word, `600 ${size}px A`, C.white, y, k * fade, (1 - k) * 30 + lift, 'left', at);
          x.font = `600 ${size}px A`;
          at += x.measureText(`${word} `).width;
          shown++;
        }
        y += size * 1.08;
      }
      progress(si, t, s.dur, true);
      return;
    }

    x.fillStyle = C.bg; x.fillRect(0, 0, 1080, 1920);
    if (s.kind === 'cover') {
      const top = 300, h = 560, k = ease(t / 500);
      x.globalAlpha = k * fade; x.fillStyle = C.white; x.strokeStyle = C.line; x.lineWidth = 3;
      x.beginPath(); x.roundRect(L, top + (1 - k) * 60 + lift, W, h, 24); x.fill(); x.stroke();
      x.save(); x.clip();
      const sc = Math.max(W / hero.width, h / hero.height) * (1 + (0.04 * t) / s.dur);
      x.drawImage(hero, 540 - (hero.width * sc) / 2, top + h / 2 - (hero.height * sc) / 2 + lift, hero.width * sc, hero.height * sc);
      x.restore(); x.globalAlpha = 1;
      text(d.category.toUpperCase(), '500 28px M', C.blue, top + h + 110, ease((t - 250) / 400) * fade, lift);
      const { size, lines } = fit(d.title, 72, 5);
      lines.forEach((ln, j) => {
        const kk = ease((t - 350 - j * 90) / 380);
        text(ln, `600 ${size}px A`, C.ink, top + h + 190 + size + j * size * 1.1, kk * fade, (1 - kk) * 40 + lift);
      });
    } else if (s.kind === 'point') {
      const k1 = ease(t / 380), k2 = ease((t - 180) / 420), k3 = ease((t - 650) / 450);
      text(d.category.toUpperCase(), '500 28px M', C.blue, 300, fade, lift);
      text(`${s.i + 1} / ${d.cards.length}`, '500 28px M', C.grey, 300, fade, lift, 'right', 1080 - L);
      const head = fit(s.card.heading, 100, 4);
      const body = wrap(s.card.text, '400 50px P', W);
      const blockH = 260 + head.size * 1.08 * head.lines.length + 60 + body.length * 72;
      let y = Math.max(420, 1000 - blockH / 2);
      text(String(s.i + 1).padStart(2, '0'), '600 220px A', C.blue, y + 190, k1 * fade, (1 - k1) * 50 + lift);
      y += 260;
      head.lines.forEach((ln, j) => text(ln, `600 ${head.size}px A`, C.ink, y + head.size + j * head.size * 1.08, k2 * fade, (1 - k2) * 50 + lift));
      y += head.size * 1.08 * head.lines.length + 60;
      body.forEach((ln, j) => text(ln, '400 50px P', C.grey, y + 50 + j * 72, k3 * fade, (1 - k3) * 30 + lift));
    } else {
      const k = ease(t / 450), k2 = ease((t - 300) / 450), k3 = ease((t - 700) / 450);
      const { size, lines } = fit(d.title, 76, 5);
      const blockH = 60 + size * 1.1 * lines.length + 90 + 200 + 180;
      const y = Math.max(360, 960 - blockH / 2);
      text('READ THE FULL GUIDE', '500 30px M', C.blue, y, k * fade, lift);
      lines.forEach((ln, j) => text(ln, `600 ${size}px A`, C.ink, y + 40 + size + j * size * 1.1, k2 * fade, (1 - k2) * 40 + lift));
      const by = y + 40 + size * 1.1 * lines.length + 70;
      x.globalAlpha = k3 * fade; x.fillStyle = C.white; x.strokeStyle = C.line; x.lineWidth = 3;
      x.beginPath(); x.roundRect(L, by + (1 - k3) * 30, W, 200, 24); x.fill(); x.stroke(); x.globalAlpha = 1;
      text('FIND IT IN OUR BLOG', '500 28px M', C.grey, by + 74, k3 * fade, (1 - k3) * 30, 'left', L + 48);
      text('fintaxtech.co.uk/blog', '600 64px A', C.blue, by + 156, k3 * fade, (1 - k3) * 30, 'left', L + 48);
      x.globalAlpha = k3 * fade; x.drawImage(logo, L, by + 260, 104, 104); x.globalAlpha = 1;
      text('FinTaxTech', '600 40px A', C.ink, by + 304, k3 * fade, 0, 'left', L + 132);
      text('Complexity made clear', '500 32px P', C.grey, by + 346, k3 * fade, 0, 'left', L + 132);
    }
    progress(si, t, s.dur, false);
  };
  return total;
}
