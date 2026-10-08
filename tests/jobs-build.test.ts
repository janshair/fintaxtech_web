import { it, expect } from 'vitest';
import { cp, mkdtemp, readFile, readdir, rm, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { promisify } from 'node:util';
import { execFile } from 'node:child_process';

const exec = promisify(execFile);
// Build an isolated copy: never toggle real vacancies or overwrite the normal production output.
it('generates only active job pages and sitemap entries, then removes them and renders the empty state', async () => {
  const root = process.cwd();
  const sandbox = await mkdtemp(join(tmpdir(), 'fintaxtech-careers-'));
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
    const jobs = join(sandbox, 'src/content/jobs');
    for (const file of await readdir(jobs)) {
      const path = join(jobs, file);
      await writeFile(
        path,
        (await readFile(path, 'utf8')).replace(/^active: true$/m, 'active: false'),
      );
    }
    const fixture = (title: string, active: boolean, date: string) =>
      `---\ntitle: ${title}\nsummary: A test vacancy for the careers publishing checks.\nlocation: Dundee, Scotland\nactive: ${active}\npublishedDate: ${date}\n---\n\n## Responsibilities\n\nBuild accessible websites.\n`;
    await writeFile(
      join(jobs, 'fixture-older.md'),
      fixture('Older fixture vacancy', true, '2026-10-01'),
    );
    await writeFile(
      join(jobs, 'fixture-newer.md'),
      fixture('Newer fixture vacancy', true, '2026-10-02'),
    );
    await writeFile(
      join(jobs, 'fixture-inactive.md'),
      fixture('Inactive fixture vacancy', false, '2026-10-03'),
    );
    const build = () =>
      exec(process.execPath, [join(root, 'node_modules/astro/bin/astro.mjs'), 'build'], {
        cwd: sandbox,
        maxBuffer: 10 * 1024 * 1024,
      });
    await build();
    const output = join(sandbox, 'dist');
    const listing = await readFile(join(output, 'careers/index.html'), 'utf8');
    const sitemap = await readFile(join(output, 'sitemap.xml'), 'utf8');
    expect(listing).toContain('Newer fixture vacancy');
    expect(listing.indexOf('Newer fixture vacancy')).toBeLessThan(
      listing.indexOf('Older fixture vacancy'),
    );
    expect(listing).not.toContain('Inactive fixture vacancy');
    for (const slug of ['fixture-older', 'fixture-newer']) {
      expect(sitemap).toContain(`/careers/${slug}/</loc>`);
      const detail = await readFile(join(output, `careers/${slug}/index.html`), 'utf8');
      expect(detail).toContain('"@type":"JobPosting"');
      expect(detail).toContain('If you want to apply, send your CV to');
      expect(detail).toContain('href="mailto:ask@fintaxtech.co.uk"');
    }
    expect(sitemap).not.toContain('/careers/fixture-inactive/');
    expect(await readdir(join(output, 'careers'))).toEqual(
      expect.not.arrayContaining(['fixture-inactive', 'frontend-developer']),
    );
    for (const file of await readdir(jobs)) {
      const path = join(jobs, file);
      await writeFile(
        path,
        (await readFile(path, 'utf8')).replace(/^active: true$/m, 'active: false'),
      );
    }
    await build();
    expect(await readdir(join(output, 'careers'))).toEqual(['index.html']);
    const empty = await readFile(join(output, 'careers/index.html'), 'utf8');
    expect(empty).toContain('There are currently no active vacancies');
    expect(empty).not.toContain('fixture vacancy');
    expect(empty).not.toContain('"@type":"JobPosting"');
    const emptyMap = await readFile(join(output, 'sitemap.xml'), 'utf8');
    expect(emptyMap).toContain('/careers/</loc>');
    expect(emptyMap).not.toMatch(/\/careers\/[^<]+\/<\/loc>/);
  } finally {
    await rm(sandbox, { recursive: true, force: true });
  }
}, 120000);
