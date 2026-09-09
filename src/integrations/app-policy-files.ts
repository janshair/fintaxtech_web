import type { AstroIntegration } from 'astro';
import { readFile, rm, writeFile } from 'node:fs/promises';
import { appPolicies } from '../content/app-policies';
// Retain historical .html URLs while the rest of the site uses directory routes.
export default function appPolicyFiles(): AstroIntegration {
  return {
    name: 'app-policy-files',
    hooks: {
      'astro:build:done': async ({ dir }) => {
        for (const path of Object.keys(appPolicies)) {
          const file = new URL(path.slice(1), dir);
          const html = await readFile(new URL(path.slice(1) + '/index.html', dir));
          await rm(file, { recursive: true });
          await writeFile(file, html);
        }
      },
    },
  };
}
