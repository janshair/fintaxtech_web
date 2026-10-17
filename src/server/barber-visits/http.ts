import type { IncomingMessage, ServerResponse } from 'node:http';

type Options = {
  origin: string;
  codes: string[];
  increment: (ref: string, now: Date) => Promise<void>;
  now?: () => Date;
};
export function visitListener({ origin, codes, increment, now = () => new Date() }: Options) {
  let minute = '';
  let attempts = 0;
  return async (req: IncomingMessage, res: ServerResponse) => {
    const end = (status: number) => {
      res.writeHead(status);
      res.end();
    };
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    // Do not read/log IPs, User-Agent, Referer or forwarded headers. No public reporting endpoint.
    if (req.url !== '/visits') return end(404);
    if (req.headers.origin !== origin) return end(403);
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
    if (req.method === 'OPTIONS') {
      if (
        req.headers['access-control-request-method'] !== 'POST' ||
        String(req.headers['access-control-request-headers'] || '').toLowerCase() !== 'content-type'
      )
        return end(403);
      res.setHeader('Access-Control-Allow-Methods', 'POST');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
      return end(204);
    }
    if (req.method !== 'POST') return end(405);
    if (req.headers.dnt === '1' || req.headers['sec-gpc'] === '1') return end(204);
    if (req.headers['content-type'] !== 'application/json') return end(415);
    const date = now();
    const key = date.toISOString().slice(0, 16);
    if (minute !== key) {
      minute = key;
      attempts = 0;
    }
    if (++attempts > 60) return end(429); // Global bound, no identifying rate-limit keys.
    if (Number(req.headers['content-length']) > 64) return end(413);
    try {
      const chunks: Buffer[] = [];
      let bytes = 0;
      for await (const chunk of req) {
        bytes += chunk.length;
        if (bytes > 64) {
          end(413);
          return;
        }
        chunks.push(Buffer.from(chunk));
      }
      const body = JSON.parse(Buffer.concat(chunks).toString('utf8'));
      if (
        !body ||
        Array.isArray(body) ||
        Object.keys(body).length !== 1 ||
        typeof body.ref !== 'string' ||
        !codes.includes(body.ref)
      )
        return end(400);
      try {
        await increment(body.ref, date);
      } catch {
        return end(503);
      }
      return end(204);
    } catch {
      // Static responses only: no submitted bodies, errors or request metadata in logs.
      return end(400);
    }
  };
}
