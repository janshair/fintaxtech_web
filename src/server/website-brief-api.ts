import { createHash, randomBytes, randomUUID, timingSafeEqual } from 'node:crypto';
import {
  websitePayloadLimit,
  websiteSubmissionPath,
  type DeliveryResult,
} from '../lib/client-brief/website-submission';
import { SubmissionError, validateWebsiteSubmission } from './website-brief-validation';
import { slackWebsiteParts } from './website-brief-format';

export const deliveryTTL = 60 * 60 * 1000;
interface Ticket {
  token: Buffer;
  owner: string;
  expires: number;
  fingerprint?: string;
  submittedAt?: string;
  delivered: number;
  total: number;
  uncertain?: boolean;
  retryAt?: number;
  pending?: Promise<DeliveryResult>;
}
interface Options {
  origin: string;
  webhook: string;
  fetcher?: typeof fetch;
  now?: () => number;
  pause?: (ms: number) => Promise<void>;
}
const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
    },
  });
const digest = (value: string) => createHash('sha256').update(value).digest('hex');

// One long-lived process owns ephemeral delivery records. No answers or webhook values are logged.
export function createWebsiteBriefAPI(options: Options) {
  const fetcher = options.fetcher ?? fetch;
  const now = options.now ?? Date.now;
  const pause =
    options.pause ?? ((ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms)));
  const tickets = new Map<string, Ticket>();
  const rates = new Map<string, { started: number; count: number }>();
  const salt = randomBytes(32).toString('hex');
  const configured = (() => {
    try {
      const webhook = new URL(options.webhook);
      return (
        ['https:', 'http:'].includes(new URL(options.origin).protocol) &&
        new URL(options.origin).origin === options.origin &&
        webhook.protocol === 'https:' &&
        webhook.hostname === 'hooks.slack.com' &&
        webhook.pathname.startsWith('/services/') &&
        !webhook.username &&
        !webhook.password &&
        !webhook.search &&
        !webhook.hash
      );
    } catch {
      return false;
    }
  })();
  function rate(key: string, max: number, window = 60000) {
    let entry = rates.get(key);
    if (!entry || now() - entry.started >= window) {
      entry = { started: now(), count: 0 };
      rates.set(key, entry);
    }
    return ++entry.count <= max;
  }
  function clean() {
    for (const [id, ticket] of tickets)
      if (ticket.expires < now() && !ticket.pending) tickets.delete(id);
    for (const [id, rate] of rates) if (now() - rate.started > deliveryTTL) rates.delete(id);
  }
  async function body(request: Request) {
    const declared = Number(request.headers.get('content-length'));
    if (Number.isFinite(declared) && declared > websitePayloadLimit)
      throw new SubmissionError('oversized', 413);
    const reader = request.body?.getReader();
    if (!reader) throw new SubmissionError('invalid');
    const chunks = [];
    let length = 0;
    try {
      while (true) {
        const item = await reader.read();
        if (item.done) break;
        length += item.value.byteLength;
        if (length > websitePayloadLimit) {
          await reader.cancel();
          throw new SubmissionError('oversized', 413);
        }
        chunks.push(item.value);
      }
      return JSON.parse(Buffer.concat(chunks).toString('utf8'));
    } catch (error) {
      if (error instanceof SubmissionError) throw error;
      throw new SubmissionError('invalid');
    }
  }
  async function deliver(
    ticket: Ticket,
    submissionId: string,
    parts: ReturnType<typeof slackWebsiteParts>,
    owner: string,
  ): Promise<DeliveryResult> {
    const result = (status: DeliveryResult['status'], retryable = false): DeliveryResult => ({
      status,
      submissionId,
      delivered: ticket.delivered,
      total: ticket.total,
      retryable,
      ...(ticket.retryAt ? { retryAfter: Math.max(0, ticket.retryAt - now()) } : {}),
    });
    if (ticket.uncertain) return result('uncertain');
    if (ticket.delivered === ticket.total) return result('delivered');
    if (ticket.retryAt && ticket.retryAt > now())
      return result(ticket.delivered ? 'partial' : 'failed', true);
    for (let i = ticket.delivered; i < parts.length; i++) {
      for (let attempt = 0; attempt < 2; attempt++) {
        if (
          !rate('messages:global', 120, deliveryTTL) ||
          !rate(`messages:${owner}`, 20, deliveryTTL)
        ) {
          ticket.retryAt = now() + deliveryTTL;
          return result(ticket.delivered ? 'partial' : 'failed', true);
        }
        let response: Response;
        try {
          response = await fetcher(options.webhook, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(parts[i]),
            signal: AbortSignal.timeout(5000),
            redirect: 'error',
          });
        } catch {
          // A webhook has no idempotency key or receipt lookup. A timeout may have delivered.
          ticket.uncertain = true;
          return result('uncertain');
        }
        if (response.ok) {
          let acknowledgement: string;
          try {
            acknowledgement = await response.text();
          } catch {
            ticket.uncertain = true;
            return result('uncertain');
          }
          if (acknowledgement.trim() !== 'ok') {
            ticket.uncertain = true;
            return result('uncertain');
          }
          ticket.delivered++;
          ticket.retryAt = undefined;
          break;
        }
        const transient = response.status === 429 || response.status >= 500;
        const retrySeconds = Number(response.headers.get('retry-after'));
        const delay =
          response.status === 429 && Number.isFinite(retrySeconds) && retrySeconds > 0
            ? Math.ceil(retrySeconds * 1000)
            : 500;
        if (!transient) return result(ticket.delivered ? 'partial' : 'failed');
        if (attempt === 0 && delay <= 1000) {
          await pause(delay);
          continue;
        }
        ticket.retryAt = now() + delay;
        return result(ticket.delivered ? 'partial' : 'failed', true);
      }
      if (i < parts.length - 1) await pause(1000); // Incoming webhooks are limited per channel.
    }
    return result('delivered');
  }
  return async function handle(request: Request, clientAddress: string): Promise<Response> {
    clean();
    const path = new URL(request.url).pathname;
    if (![websiteSubmissionPath, `${websiteSubmissionPath}challenge/`].includes(path))
      return json({ code: 'not-found' }, 404);
    if (request.method !== 'POST') return json({ code: 'method' }, 405);
    if (
      request.headers.get('origin') !== options.origin ||
      request.headers.get('sec-fetch-site') === 'cross-site'
    )
      return json({ status: 'failed', delivered: 0, total: 0, code: 'origin' }, 403);
    if (request.headers.get('content-type')?.split(';')[0].trim() !== 'application/json')
      return json({ code: 'content-type' }, 415);
    if (!configured)
      return json({ status: 'failed', delivered: 0, total: 0, code: 'unavailable' }, 503);
    const owner = digest(salt + clientAddress);
    if (rates.size >= 4096 || !rate('requests:global', 120) || !rate(`requests:${owner}`, 60))
      return json(
        {
          status: 'failed',
          delivered: 0,
          total: 0,
          code: 'rate',
          retryable: true,
          retryAfter: 60000,
        },
        429,
      );
    try {
      const input = await body(request);
      if (path.endsWith('/challenge/')) {
        if (
          !input ||
          Array.isArray(input) ||
          typeof input !== 'object' ||
          Object.keys(input).length
        )
          throw new SubmissionError('invalid');
        if (
          tickets.size >= 512 ||
          !rate('tickets:global', 50, deliveryTTL) ||
          !rate(`tickets:${owner}`, 10, deliveryTTL)
        )
          throw new SubmissionError('rate', 429);
        const submissionId = randomUUID();
        const token = randomBytes(32).toString('hex');
        tickets.set(submissionId, {
          token: Buffer.from(digest(token), 'hex'),
          owner,
          expires: now() + deliveryTTL,
          delivered: 0,
          total: 0,
        });
        return json({ submissionId, token });
      }
      if (
        !input ||
        typeof input.submissionId !== 'string' ||
        !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(
          input.submissionId,
        )
      )
        throw new SubmissionError('invalid');
      const submissionId = input.submissionId;
      const ticket = tickets.get(submissionId);
      if (!ticket || ticket.expires < now())
        return json({ status: 'expired', submissionId, delivered: 0, total: 0 }, 410);
      const token = request.headers.get('x-brief-token') ?? '';
      if (
        ticket.owner !== owner ||
        token.length !== 64 ||
        !timingSafeEqual(ticket.token, Buffer.from(digest(token), 'hex'))
      )
        throw new SubmissionError('ticket', 403);
      const payload = validateWebsiteSubmission(input);
      const fingerprint = digest(JSON.stringify(payload));
      if (ticket.fingerprint && ticket.fingerprint !== fingerprint)
        throw new SubmissionError('changed', 409);
      ticket.fingerprint = fingerprint;
      ticket.submittedAt ??= new Date(now()).toISOString();
      const parts = slackWebsiteParts(payload, submissionId, ticket.submittedAt);
      ticket.total = parts.length;
      // Concurrent repeated clicks share the operation; acknowledged parts are never repeated.
      ticket.pending ??= deliver(ticket, submissionId, parts, owner).finally(() => {
        ticket.pending = undefined;
      });
      const result = await ticket.pending;
      return json(result, result.status === 'delivered' ? 200 : 502);
    } catch (error) {
      const known = error instanceof SubmissionError ? error : new SubmissionError('invalid');
      return json({ status: 'failed', delivered: 0, total: 0, code: known.code }, known.status);
    }
  };
}
