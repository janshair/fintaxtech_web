import { preview } from 'astro';
import { build } from 'esbuild';
import { parseArgs } from 'node:util';
import { fileURLToPath } from 'node:url';

const root = new URL('../', import.meta.url);
const { values } = parseArgs({
  options: {
    port: { type: 'string', default: '4321' },
    host: { type: 'string', default: 'localhost' },
    'trailing-slash': { type: 'string', default: 'always' },
  },
});
if (!['always', 'never', 'ignore'].includes(values['trailing-slash']))
  throw new Error('Invalid trailing-slash setting');
const compiled = await build({
  entryPoints: [fileURLToPath(new URL('src/server/website-brief-local.ts', root))],
  bundle: true,
  platform: 'node',
  format: 'esm',
  write: false,
});
const { createLocalBriefMiddleware, localBriefWebhook } = await import(
  `data:text/javascript;base64,${Buffer.from(compiled.outputFiles[0].text).toString('base64')}`
);
const webhook = localBriefWebhook(root);
const app = await preview({
  root: fileURLToPath(root),
  trailingSlash: values['trailing-slash'],
  server: { host: values.host, port: Number(values.port) },
});
// Astro's static preview discards user Vite plugins. Dispatch the API before its static handler.
const listeners = app.server.listeners('request');
app.server.removeAllListeners('request');
const middleware = createLocalBriefMiddleware(webhook, () => app.port);
app.server.on('request', (request, response) => {
  middleware(request, response, () => {
    for (const listener of listeners) listener.call(app.server, request, response);
  });
});
app.server.maxConnections = 64;
app.server.requestTimeout = 10000;
app.server.headersTimeout = 10000;
