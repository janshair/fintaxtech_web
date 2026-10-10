import { existsSync } from 'node:fs';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { loadEnvFile } from 'node:process';
import { websiteSubmissionPath } from '../lib/client-brief/website-submission';
import { briefHTTPError, createWebsiteBriefListener } from './website-brief-http';

// Called only by local dev/preview servers. Never injected into static/client output.
export function localBriefWebhook(root: URL) {
  const file = new URL('.env', root);
  if (existsSync(file)) loadEnvFile(file);
  return process.env.SLACK_WEBHOOK ?? '';
}

export function createLocalBriefMiddleware(webhook: string, port: () => number) {
  const listeners = new Map<string, ReturnType<typeof createWebsiteBriefListener>>();
  return (incoming: IncomingMessage, outgoing: ServerResponse, next: () => void) => {
    const pathname = (incoming.url ?? '').split('?')[0];
    if (!pathname.startsWith(websiteSubmissionPath)) return next();
    let origin: string;
    try {
      const url = new URL(`http://${incoming.headers.host}`);
      if (
        !['localhost', '127.0.0.1', '[::1]'].includes(url.hostname) ||
        Number(url.port || 80) !== port() ||
        url.pathname !== '/' ||
        url.username ||
        url.password ||
        url.search ||
        url.hash
      )
        throw new Error('Not a local origin');
      origin = url.origin;
    } catch {
      briefHTTPError(outgoing, 403, 'origin');
      incoming.resume();
      return;
    }
    let listener = listeners.get(origin);
    if (!listener) {
      listener = createWebsiteBriefListener({ origin, webhook });
      listeners.set(origin, listener);
    }
    listener(incoming, outgoing);
  };
}
