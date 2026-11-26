import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const exec = promisify(execFile);
// Fixtures symlink their dependencies, so Astro's default cache in node_modules
// would let concurrent builds overwrite each other's content collections.
const build = `
  import { build } from 'astro';
  await build({ cacheDir: './.astro/build-cache' });
`;

export function buildFixtureSite(cwd: string, env?: NodeJS.ProcessEnv) {
  return exec(process.execPath, ['--input-type=module', '--eval', build], {
    cwd,
    env,
    maxBuffer: 10 * 1024 * 1024,
  });
}
