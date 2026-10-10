import { it, expect } from 'vitest';
import { build } from 'esbuild';
import { mkdtemp, readFile, readdir, rm, writeFile, cp, symlink } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawn, execFile } from 'node:child_process';
import { createServer } from 'node:net';
import { promisify } from 'node:util';
import { once } from 'node:events';
import {
  reviewedWebsiteSubmission,
  websitePayloadLimit,
} from '../src/lib/client-brief/website-submission';
import { completeWebsiteDemoBrief } from './fixtures/website-demo-brief';

const exec = promisify(execFile);
const root = process.cwd();

it('runs the actual Node endpoint with a mock-only webhook, validates the proxy and resumes duplicates', async () => {
  const sandbox = await mkdtemp(join(tmpdir(), 'fintaxtech-brief-runtime-'));
  const portFinder = createServer();
  portFinder.listen(0, '127.0.0.1');
  await once(portFinder, 'listening');
  const port = (portFinder.address() as { port: number }).port;
  await new Promise<void>((resolve) => portFinder.close(() => resolve()));
  const callsFile = join(sandbox, 'mock-calls.jsonl');
  const bundle = join(sandbox, 'server.mjs');
  const preload = join(sandbox, 'mock-fetch.mjs');
  await build({
    entryPoints: [join(root, 'src/server/website-brief.ts')],
    outfile: bundle,
    bundle: true,
    platform: 'node',
    format: 'esm',
  });
  await writeFile(
    preload,
    `import { appendFile } from 'node:fs/promises';
globalThis.fetch = async (url, options) => {
  if (url !== 'https://hooks.slack.com/services/TEST_ONLY') throw new Error('Unexpected transport');
  await appendFile(${JSON.stringify(callsFile)}, options.body + '\\n');
  return new Response('ok');
};`,
  );
  const child = spawn(process.execPath, ['--import', preload, bundle], {
    cwd: sandbox,
    // Do not inherit real webhook/configuration values from the development environment.
    env: {
      SLACK_WEBHOOK: 'https://hooks.slack.com/services/TEST_ONLY',
      BRIEF_ORIGIN: 'https://fintaxtech.co.uk',
      BRIEF_API_PORT: String(port),
      BRIEF_TRUSTED_PROXIES: '127.0.0.1',
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  let logs = '';
  child.stdout.on('data', (data) => (logs += String(data)));
  child.stderr.on('data', (data) => (logs += String(data)));
  const url = `http://127.0.0.1:${port}/api/website-brief/`;
  const post = (body: unknown, suffix = '', headers: Record<string, string> = {}) =>
    fetch(url + suffix, {
      method: 'POST',
      headers: {
        Origin: 'https://fintaxtech.co.uk',
        'Content-Type': 'application/json',
        'X-Forwarded-For': '192.0.2.1',
        ...headers,
      },
      body: JSON.stringify(body),
    });
  try {
    for (let i = 0; i < 100; i++) {
      try {
        await fetch(url);
        break;
      } catch {
        await new Promise((resolve) => setTimeout(resolve, 20));
      }
    }
    const invalidProxy = await post({}, 'challenge/', { 'X-Forwarded-For': 'spoofed, list' });
    expect(invalidProxy.status).toBe(403);
    expect((await invalidProxy.json()).code).toBe('origin');
    const crossSite = await post({}, 'challenge/', { Origin: 'https://untrusted.example' });
    expect(crossSite.status).toBe(403);
    const oversized = await post({ padding: 'X'.repeat(websitePayloadLimit) });
    expect(oversized.status).toBe(413);
    expect((await oversized.json()).code).toBe('oversized');
    const ticket = await (await post({}, 'challenge/')).json();
    const data = {
      ...reviewedWebsiteSubmission('websiteDemo', completeWebsiteDemoBrief()),
      submissionId: ticket.submissionId,
      trap: '',
    };
    for (let i = 0; i < 2; i++) {
      const response = await post(data, '', { 'X-Brief-Token': ticket.token });
      expect(response.status).toBe(200);
      expect((await response.json()).status).toBe('delivered');
    }
    const calls = (await readFile(callsFile, 'utf8')).trim().split('\n');
    expect(calls).toHaveLength(1);
    expect(JSON.parse(calls[0]).text).toContain('Demo Orchard Ltd');
    expect(logs).toBe('');
  } finally {
    child.kill();
    await once(child, 'exit');
    await rm(sandbox, { recursive: true, force: true });
  }
}, 20000);

it('keeps server-only canary secrets out of static output and rejects the retired PUBLIC_ variable', async () => {
  const sandbox = await mkdtemp(join(tmpdir(), 'fintaxtech-brief-secret-'));
  const canary = 'SECRET_BUILD_CANARY_NEVER_REAL';
  const env = { ...process.env };
  // No real secret values are required or inherited for this build check.
  delete env.SLACK_WEBHOOK;
  delete env.PUBLIC_SLACK_WEBHOOK;
  try {
    await Promise.all(
      [
        'src',
        'public',
        'astro.config.mjs',
        'postcss.config.cjs',
        'package.json',
        'tsconfig.json',
      ].map((name) => cp(join(root, name), join(sandbox, name), { recursive: true })),
    );
    await symlink(join(root, 'node_modules'), join(sandbox, 'node_modules'), 'dir');
    const args = [join(root, 'node_modules/astro/bin/astro.mjs'), 'build'];
    let rejection = '';
    try {
      await exec(process.execPath, args, {
        cwd: sandbox,
        env: { ...env, PUBLIC_SLACK_WEBHOOK: canary },
      });
    } catch (error) {
      rejection = String((error as { stderr: string }).stderr);
    }
    expect(rejection).toContain('Remove PUBLIC_SLACK_WEBHOOK');
    expect(rejection).not.toContain(canary);
    await exec(process.execPath, args, {
      cwd: sandbox,
      env: { ...env, SLACK_WEBHOOK: canary },
      maxBuffer: 10 * 1024 * 1024,
    });
    async function inspect(directory: string): Promise<void> {
      for (const entry of await readdir(directory, { withFileTypes: true })) {
        const file = join(directory, entry.name);
        if (entry.isDirectory()) await inspect(file);
        else if (/\.(html|js|json|mjs|map)$/.test(file)) {
          const output = await readFile(file, 'utf8');
          expect(output.includes(canary)).toBe(false);
          expect(output.includes('hooks.slack.com/services/')).toBe(false);
          expect(output.includes('PUBLIC_SLACK_WEBHOOK')).toBe(false);
        }
      }
    }
    await inspect(join(sandbox, 'dist'));
  } finally {
    await rm(sandbox, { recursive: true, force: true });
  }
}, 120000);

it('refreshes the local API schema when a questionnaire changes during development', async () => {
  const sandbox = await mkdtemp(join(tmpdir(), 'fintaxtech-brief-reload-'));
  const finder = createServer();
  finder.listen(0, '127.0.0.1');
  await once(finder, 'listening');
  const port = (finder.address() as { port: number }).port;
  await new Promise<void>((resolve) => finder.close(() => resolve()));
  await Promise.all(
    ['src', 'public', 'astro.config.mjs', 'package.json', 'tsconfig.json'].map((name) =>
      cp(join(root, name), join(sandbox, name), { recursive: true }),
    ),
  );
  await symlink(join(root, 'node_modules'), join(sandbox, 'node_modules'), 'dir');
  const child = spawn(
    process.execPath,
    [
      join(root, 'node_modules/astro/bin/astro.mjs'),
      'dev',
      '--host',
      '127.0.0.1',
      '--port',
      String(port),
    ],
    {
      cwd: sandbox,
      // No real secret or transport: both submissions intentionally fail validation.
      env: {
        PATH: process.env.PATH,
        HOME: process.env.HOME,
        SLACK_WEBHOOK: 'https://hooks.slack.com/services/TEST_ONLY',
        ASTRO_TELEMETRY_DISABLED: '1',
      },
      stdio: ['ignore', 'pipe', 'pipe'],
    },
  );
  child.stdout.resume();
  child.stderr.resume();
  const origin = `http://127.0.0.1:${port}`;
  const post = (body: unknown, suffix = '', token = '') =>
    fetch(origin + '/api/website-brief/' + suffix, {
      method: 'POST',
      headers: { origin, 'content-type': 'application/json', 'x-brief-token': token },
      body: JSON.stringify(body),
    });
  try {
    await expect
      .poll(
        async () => {
          try {
            return (await fetch(origin + '/api/website-brief/')).status;
          } catch {
            return 0;
          }
        },
        { timeout: 15000 },
      )
      .toBe(405);
    const data = reviewedWebsiteSubmission('websiteDemo', completeWebsiteDemoBrief());
    delete data.answers.sector; // Prevent Slack delivery even after the new field is recognized.
    data.answers.reloadProbe = 'New question';
    const first = await (await post({}, 'challenge/')).json();
    expect(
      (
        await (
          await post({ ...data, trap: '', submissionId: first.submissionId }, '', first.token)
        ).json()
      ).code,
    ).toBe('invalid');
    const file = join(sandbox, 'src/content/website-demo-brief.ts');
    await writeFile(
      file,
      (await readFile(file, 'utf8')).replace(
        "{ ...tradingNameField, label: 'Business name' },",
        "{ ...tradingNameField, label: 'Business name' }, { id: 'reloadProbe', label: 'New question', type: 'text', optional: true },",
      ),
    );
    // Wait for the previous ticket to expire: an Astro restart rebuilt the API.
    await expect
      .poll(
        async () => {
          try {
            return (
              await post({ ...data, trap: '', submissionId: first.submissionId }, '', first.token)
            ).status;
          } catch {
            return 0;
          }
        },
        { timeout: 15000, intervals: [500] },
      )
      .toBe(410);
    const second = await (await post({}, 'challenge/')).json();
    const response = await post(
      { ...data, trap: '', submissionId: second.submissionId },
      '',
      second.token,
    );
    expect((await response.json()).code).toBe('incomplete'); // New field recognized; missing sector still rejected.
  } finally {
    child.kill();
    await once(child, 'exit');
    await rm(sandbox, { recursive: true, force: true });
  }
}, 45000);
