import type { AstroIntegration } from 'astro';
import { readdirSync } from 'node:fs';
import { createLocalBriefMiddleware, localBriefWebhook } from '../server/website-brief-local';

export default function websiteBriefAPI(): AstroIntegration {
  let root: URL;
  return {
    name: 'website-brief-local-api',
    hooks: {
      'astro:config:setup': ({ config, command, addWatchFile }) => {
        if (command !== 'dev') return;
        // These modules are imported by the Astro config, outside Vite's page HMR.
        // Restart both the API and page together when their shared schema changes.
        for (const directory of ['src/server/', 'src/lib/client-brief/', 'src/content/']) {
          const base = new URL(directory, config.root);
          for (const name of readdirSync(base))
            if (name.endsWith('.ts')) addWatchFile(new URL(name, base));
        }
        addWatchFile(new URL('src/lib/validation.ts', config.root));
        addWatchFile(new URL('src/integrations/website-brief-api.ts', config.root));
      },
      'astro:config:done': ({ config }) => {
        root = config.root;
      },
      'astro:server:setup': ({ server }) => {
        server.middlewares.use(
          createLocalBriefMiddleware(localBriefWebhook(root), () => {
            const address = server.httpServer?.address();
            return address && typeof address === 'object' ? address.port : 0;
          }),
        );
      },
    },
  };
}
