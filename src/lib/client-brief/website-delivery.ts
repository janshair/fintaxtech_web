import { websiteDeliveryCopy as c } from '../../content/client-brief';
import {
  reviewedWebsiteSubmission,
  websiteSubmissionPath,
  type WebsiteBriefKind,
  type DeliveryResult,
} from './website-submission';
import type { BriefState } from './types';

interface Entry {
  ticket?: { submissionId: string; token: string };
  result?: DeliveryResult;
  pending?: Promise<void>;
}
export function createWebsiteDelivery(
  kind: WebsiteBriefKind,
  fetcher: typeof fetch = fetch,
  pause = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms)),
) {
  // This map lives only in page memory. Reverting to already submitted answers does not resend them.
  const entries = new Map<string, Entry>();
  function resultText(result: DeliveryResult) {
    const id = result.submissionId ? ` Submission ID: ${result.submissionId}.` : '';
    if (result.status === 'delivered') return c.delivered(result.submissionId!);
    if (result.status === 'uncertain') return c.uncertain + id;
    if (result.status === 'expired') return c.expired + id;
    if (result.code === 'sensitive') return c.sensitive;
    if (result.code === 'oversized') return c.oversized;
    if (result.code === 'unavailable') return c.unavailable + id;
    if (result.code === 'invalid' || result.code === 'incomplete') return c.rejected + id;
    if (result.status === 'partial') return c.partial(result.delivered, result.total) + id;
    return c.failed + id;
  }
  async function endpointUnavailable(response: Response) {
    if ([404, 405].includes(response.status)) return true;
    if (!response.headers.get('content-type')?.includes('application/json')) return true;
    if (response.status !== 503) return false;
    return (await response.clone().json()).code === 'unavailable';
  }
  async function complete(state: BriefState, status: (text: string) => void) {
    const payload = reviewedWebsiteSubmission(kind, state);
    const key = JSON.stringify(payload);
    const entry = entries.get(key) ?? {};
    entries.set(key, entry);
    if (entry.result?.status === 'delivered') {
      status(resultText(entry.result));
      return;
    }
    status(c.pending);
    if (!entry.pending) {
      entry.pending = (async () => {
        for (let attempt = 0; attempt < 3; attempt++) {
          try {
            if (!entry.ticket) {
              const ticketResponse = await fetcher(`${websiteSubmissionPath}challenge/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: '{}',
                signal: AbortSignal.timeout(12000),
                credentials: 'omit',
                cache: 'no-store',
              });
              if (await endpointUnavailable(ticketResponse)) {
                entry.result = { status: 'failed', code: 'unavailable', delivered: 0, total: 0 };
                break;
              }
              if (!ticketResponse.ok) throw new Error('Ticket unavailable');
              const ticket = await ticketResponse.json();
              if (typeof ticket.submissionId !== 'string' || typeof ticket.token !== 'string')
                throw new Error('Invalid ticket');
              entry.ticket = ticket;
            }
            const response = await fetcher(websiteSubmissionPath, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'X-Brief-Token': entry.ticket!.token },
              body: JSON.stringify({
                ...payload,
                submissionId: entry.ticket!.submissionId,
                trap: '',
              }),
              signal: AbortSignal.timeout(45000),
              credentials: 'omit',
              cache: 'no-store',
            });
            if (await endpointUnavailable(response)) {
              entry.result = {
                status: 'failed',
                code: 'unavailable',
                delivered: 0,
                total: 0,
                submissionId: entry.ticket!.submissionId,
              };
              break;
            }
            const result: DeliveryResult = await response.json();
            if (!['delivered', 'failed', 'partial', 'uncertain', 'expired'].includes(result.status))
              throw new Error('Invalid delivery response');
            entry.result = { ...result, submissionId: entry.ticket!.submissionId };
            if (!result.retryable || (result.retryAfter ?? 0) > 1000) break;
            if (attempt < 2) await pause(Math.max(result.retryAfter ?? 0, 300 * (attempt + 1)));
          } catch {
            // Retain the same ticket after a lost response: the server knows which parts succeeded.
            entry.result = {
              status: entry.ticket ? 'uncertain' : 'failed',
              delivered: 0,
              total: 0,
              submissionId: entry.ticket?.submissionId,
            };
            if (attempt < 2) await pause(300 * (attempt + 1));
          }
        }
      })().finally(() => {
        entry.pending = undefined;
      });
    }
    await entry.pending;
    status(resultText(entry.result!));
  }
  return { complete, clear: () => entries.clear() };
}
