import type { AstroIntegration } from 'astro';
import { readFile, rm, writeFile } from 'node:fs/promises';
import { contactRedirect } from '../content/site';
import { appPolicies } from '../content/app-policies';
// Retain historical .html URLs while the rest of the site uses directory routes.
export default function appPolicyFiles(): AstroIntegration {
  return {
    name: 'app-policy-files',
    hooks: {
      'astro:server:setup': ({ server }) => {
        // The dev router expects a slash for directory output; the published alias is a file.
        server.middlewares.use((request, _response, next) => {
          const url = new URL(request.url ?? '/', 'http://localhost');
          if (url.pathname === contactRedirect.legacyRoute)
            request.url = `${url.pathname}/${url.search}`;
          next();
        });
      },
      'astro:build:done': async ({ dir }) => {
        for (const path of [...Object.keys(appPolicies), contactRedirect.legacyRoute]) {
          const file = new URL(path.slice(1), dir);
          const html = await readFile(new URL(path.slice(1) + '/index.html', dir));
          await rm(file, { recursive: true });
          await writeFile(file, html);
        }
      },
    },
  };
}
