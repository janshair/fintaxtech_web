import type { IncomingMessage, ServerResponse } from 'node:http';
import { isIP } from 'node:net';
import { createWebsiteBriefAPI } from './website-brief-api';
import { websitePayloadLimit } from '../lib/client-brief/website-submission';

export function briefHTTPError(response: ServerResponse, status: number, code: string) {
  response.writeHead(status, {
    'Content-Type': 'application/json',
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
  });
  response.end(JSON.stringify({ status: 'failed', delivered: 0, total: 0, code }));
}

export function createWebsiteBriefListener(
  options: Parameters<typeof createWebsiteBriefAPI>[0] & { trustedProxies?: string[] },
) {
  const handle = createWebsiteBriefAPI(options);
  return (incoming: IncomingMessage, outgoing: ServerResponse) => {
    const reject = (status: number, code: string) => briefHTTPError(outgoing, status, code);
    const send = async (response: Response) => {
      outgoing.writeHead(response.status, Object.fromEntries(response.headers));
      outgoing.end(Buffer.from(await response.arrayBuffer()));
    };
    let clientAddress = incoming.socket.remoteAddress ?? 'unknown';
    if (options.trustedProxies?.includes(clientAddress)) {
      const forwarded = incoming.headers['x-forwarded-for'];
      // The trusted edge must overwrite this header with one verified address.
      if (typeof forwarded !== 'string' || !isIP(forwarded)) {
        reject(403, 'origin');
        incoming.resume();
        return;
      }
      clientAddress = forwarded;
    }
    const length = Number(incoming.headers['content-length']);
    if (length > websitePayloadLimit) {
      reject(413, 'oversized');
      incoming.resume();
      return;
    }
    const chunks: Buffer[] = [];
    let size = 0;
    let oversized = false;
    incoming.on('data', (chunk: Buffer) => {
      size += chunk.length;
      if (size > websitePayloadLimit) {
        oversized = true;
        chunks.length = 0;
        if (!outgoing.headersSent) reject(413, 'oversized');
      } else if (!oversized) chunks.push(chunk);
    });
    incoming.on('end', async () => {
      if (oversized) return;
      try {
        const headers = new Headers();
        for (const [name, value] of Object.entries(incoming.headers))
          if (typeof value === 'string') headers.set(name, value);
        const method = incoming.method ?? 'GET';
        const request = new Request(new URL(incoming.url ?? '/', 'http://127.0.0.1'), {
          method,
          headers,
          ...(!['GET', 'HEAD'].includes(method) ? { body: Buffer.concat(chunks) } : {}),
        });
        await send(await handle(request, clientAddress));
      } catch {
        if (!outgoing.headersSent) reject(503, 'unavailable');
      }
    });
    incoming.on('error', () => {
      if (!outgoing.headersSent) reject(400, 'invalid');
    });
  };
}
