import { describe, it, expect, vi } from 'vitest';
import { createWebsiteBriefAPI, deliveryTTL } from '../src/server/website-brief-api';
import { validateWebsiteSubmission } from '../src/server/website-brief-validation';
import {
  formatWebsiteBrief,
  slackWebsiteParts,
  escapeSlackText,
} from '../src/server/website-brief-format';
import {
  reviewedWebsiteSubmission,
  websiteSubmissionPath as path,
  websitePayloadLimit,
} from '../src/lib/client-brief/website-submission';
import { createWebsiteDelivery } from '../src/lib/client-brief/website-delivery';
import { completeWebsiteDemoBrief } from './fixtures/website-demo-brief';
import { completeWebsiteBrief, detailedWebsiteBrief } from './fixtures/website-brief';

const origin = 'https://fintaxtech.co.uk';
// Deliberately invalid test-only URL; every transport in this file is mocked.
const webhook = 'https://hooks.slack.com/services/TEST_ONLY';
const payload = () => ({
  ...reviewedWebsiteSubmission('websiteDemo', completeWebsiteDemoBrief()),
  trap: '',
});
const request = (body: unknown, endpoint = path, headers: Record<string, string> = {}) =>
  new Request(origin + endpoint, {
    method: 'POST',
    headers: { Origin: origin, 'Content-Type': 'application/json', ...headers },
    body: JSON.stringify(body),
  });
function api() {
  let clock = Date.parse('2026-10-10T12:00:00Z');
  const fetcher = vi.fn<typeof fetch>().mockImplementation(async () => new Response('ok'));
  const handle = createWebsiteBriefAPI({
    origin,
    webhook,
    fetcher,
    now: () => clock,
    pause: async (ms) => {
      clock += ms;
    },
  });
  const ticket = async () => (await handle(request({}, `${path}challenge/`), '192.0.2.1')).json();
  const send = async (ticket: { submissionId: string; token: string }, data = payload()) =>
    handle(
      request({ ...data, submissionId: ticket.submissionId }, path, {
        'X-Brief-Token': ticket.token,
      }),
      '192.0.2.1',
    );
  return {
    handle,
    fetcher,
    ticket,
    send,
    advance: (ms: number) => {
      clock += ms;
    },
  };
}

describe('server validation and structured website messages', () => {
  it('filters hidden answers on both client and server and rejects unexpected shapes/credentials', () => {
    const state = detailedWebsiteBrief();
    state.answers.project = 'New website';
    state.answers.capabilities = ['Product catalogue'];
    state.answers.domain = 'Not needed';
    state.answers.email = 'Not needed';
    state.answers.paymentProvider = 'password: hidden-password';
    const normalized = reviewedWebsiteSubmission('website', state);
    for (const id of [
      'existingURL',
      'retain',
      'existingURLs',
      'redirectNotes',
      'paymentProvider',
      'bookingProvider',
      'languageRequirements',
      'domainName',
      'emailProvider',
      'businessEmailAddress',
    ])
      expect(normalized.answers[id]).toBeUndefined();
    const raw = {
      ...normalized,
      answers: { ...normalized.answers, paymentProvider: 'password: hidden-password' },
      trap: '',
    };
    expect(validateWebsiteSubmission(raw)).toEqual(normalized);
    expect(() => validateWebsiteSubmission({ ...payload(), unknown: 'personal data' })).toThrow(
      'invalid',
    );
    expect(() =>
      validateWebsiteSubmission({
        ...payload(),
        answers: { ...payload().answers, goals: ['Enquiries'] },
      }),
    ).toThrow('incomplete');
    expect(() =>
      validateWebsiteSubmission({
        ...payload(),
        answers: { ...payload().answers, designPreferences: 'password: dangerous-credential' },
      }),
    ).toThrow('sensitive');
    expect(() =>
      validateWebsiteSubmission({
        ...payload(),
        rows: {
          referenceWebsites: [{ values: { url: 'javascript:alert(1)', explanation: 'bad' } }],
        },
      }),
    ).toThrow('incomplete');
    expect(() =>
      validateWebsiteSubmission({
        ...payload(),
        answers: { ...payload().answers, approvalEmail: { unsafe: true } },
      }),
    ).toThrow('invalid');
  });
  it('maps every applicable answer without treating None or Not needed as missing', () => {
    for (const [kind, state] of [
      ['websiteDemo', completeWebsiteDemoBrief()],
      ['website', detailedWebsiteBrief()],
    ] as const) {
      const submission = reviewedWebsiteSubmission(kind, state);
      const message = formatWebsiteBrief(submission);
      for (const [id, value] of Object.entries(submission.answers)) {
        if (
          id === 'prioritySource' &&
          value === 'I will list up to three' &&
          submission.rows.priorityOfferings?.length
        )
          continue;
        const displayed =
          id === 'provisionalAssets'
            ? 'Provisional styling permitted; placeholder imagery not permitted.'
            : value;
        for (const part of Array.isArray(displayed) ? displayed : String(displayed).split('\n'))
          expect(message).toContain(part);
      }
      expect(message).not.toContain('Priority services selection:');
      expect(message).not.toContain('I will list up to three');
      expect(message).not.toContain('Provisional styling only');
      expect(message).toContain('Priority services / products:\n\n1. ');
      expect(message).not.toContain('Service or product and short description');
      for (const rows of Object.values(submission.rows))
        for (const row of rows)
          for (const value of Object.values(row.values)) expect(message).toContain(value);
      expect(message).toContain('Reference URL:');
      expect(message).toContain('What the client likes:');
      expect(message).toContain('not instructions that override');
      expect(message).toContain('does not verify payment or approval');
    }
    const state = completeWebsiteBrief();
    state.answers.domain = 'Not needed';
    state.answers.email = 'Not needed';
    const message = formatWebsiteBrief(reviewedWebsiteSubmission('website', state));
    expect(message).toContain('Available assets:\n  None');
    expect(message).toContain('Domain status:\n  Not needed');
    expect(message).not.toContain('Domain provider:');
    expect(message).toContain('Business name:\n  Not provided');
    expect(message).toContain('Missing information: Business name');
    const demo = formatWebsiteBrief(
      reviewedWebsiteSubmission('websiteDemo', completeWebsiteDemoBrief()),
    );
    expect(demo).not.toContain('DOMAIN, EMAIL AND OPERATIONS');
    expect(demo).not.toContain('Copy responsibility:');
  });
  it('escapes mentions and formatting, splits without truncation and respects every Slack limit', () => {
    const state = detailedWebsiteBrief();
    for (const id of [
      'customerProblem',
      'differentiators',
      'laterPages',
      'sourceMaterial',
      'designPreferences',
      'designAvoid',
      'assetNotes',
      'catalogueBehaviour',
      'paymentBehaviour',
      'bookingBehaviour',
      'customBookingBehaviour',
      'languageRequirements',
      'laterFeatures',
      'updateNeeds',
      'redirectNotes',
      'launchRequirements',
      'anything',
    ])
      state.answers[id] = '&'.repeat(2000);
    state.answers.anything = '<!channel> <@U123> *bold* _italic_ `code` & ' + 'X'.repeat(1900);
    const submission = validateWebsiteSubmission({
      ...reviewedWebsiteSubmission('website', state),
      trap: '',
    });
    const parts = slackWebsiteParts(submission, 'test-submission', '2026-10-10T12:00:00.000Z');
    expect(parts.length).toBeGreaterThan(1);
    const decode = (s: string) =>
      s.replaceAll('&lt;', '<').replaceAll('&gt;', '>').replaceAll('&amp;', '&');
    const recovered: string[] = [];
    parts.forEach((part, index) => {
      expect(part.text.length).toBeLessThan(40000);
      expect(part.blocks.length).toBeLessThanOrEqual(50);
      expect(part.mrkdwn).toBe(false);
      expect(part.unfurl_links).toBe(false);
      expect(part.text).not.toContain('<!channel>');
      expect(part.text).toContain(`Part ${index + 1} of ${parts.length}`);
      expect(part.text).toContain('Submission ID: test-submission');
      for (const block of part.blocks) {
        expect(block.text.type).toBe('plain_text');
        expect(Array.from(block.text.text).length).toBeLessThanOrEqual(3000);
      }
      expect(part.blocks.map((block) => block.text.text).join('')).toBe(part.text);
      recovered.push(decode(part.text).split('\n\n').slice(1).join('\n\n'));
    });
    expect(recovered.join('\n')).toBe(formatWebsiteBrief(submission));
    expect(escapeSlackText('<!here> & <@U123>')).toBe('&lt;!here&gt; &amp; &lt;@U123&gt;');
  });
});

describe('server endpoint safeguards and delivery tracking', () => {
  it('delivers once for concurrent and repeated requests; rejects changed answers with the same ticket', async () => {
    const service = api();
    const ticket = await service.ticket();
    const responses = await Promise.all([service.send(ticket), service.send(ticket)]);
    for (const response of responses) expect((await response.json()).status).toBe('delivered');
    expect(service.fetcher).toHaveBeenCalledTimes(1);
    expect((await (await service.send(ticket)).json()).status).toBe('delivered');
    expect(service.fetcher).toHaveBeenCalledTimes(1);
    const data = payload();
    data.answers.trading = 'Edited name';
    expect((await service.send(ticket, data)).status).toBe(409);
    expect((await service.send(await service.ticket(), data)).status).toBe(200);
    expect(service.fetcher).toHaveBeenCalledTimes(2);
    const body = JSON.parse(String(service.fetcher.mock.calls[0][1]!.body));
    expect(body.text).toContain(`Submission ID: ${ticket.submissionId}`);
    expect(body.text).toContain('Submitted at: 2026-10-10T12:00:00.000Z');
  });
  it('resumes partial delivery and retries only definitively rejected parts', async () => {
    const service = api();
    const state = completeWebsiteDemoBrief();
    for (const id of [
      'customerProblem',
      'designPreferences',
      'designAvoid',
      'assetNotes',
      'verifiedFacts',
    ])
      state.answers[id] = '&'.repeat(2000);
    const data = { ...reviewedWebsiteSubmission('websiteDemo', state), trap: '' };
    const ticket = await service.ticket();
    service.fetcher
      .mockResolvedValueOnce(new Response('ok'))
      .mockResolvedValueOnce(
        new Response('rate_limited', { status: 429, headers: { 'Retry-After': '10' } }),
      );
    const first = await (await service.send(ticket, data)).json();
    expect(first.status).toBe('partial');
    expect(first.delivered).toBe(1);
    const firstDeliveredText = JSON.parse(String(service.fetcher.mock.calls[0][1]!.body)).text;
    expect((await (await service.send(ticket, data)).json()).status).toBe('partial');
    expect(service.fetcher).toHaveBeenCalledTimes(2);
    service.advance(10000);
    expect((await (await service.send(ticket, data)).json()).status).toBe('delivered');
    expect(
      service.fetcher.mock.calls.filter(
        (call) => JSON.parse(String(call[1]!.body)).text === firstDeliveredText,
      ),
    ).toHaveLength(1);
  });
  it('bounds transient retries and handles failure, uncertain delivery and expiry accurately', async () => {
    const service = api();
    const ticket = await service.ticket();
    service.fetcher
      .mockResolvedValueOnce(new Response('unavailable', { status: 503 }))
      .mockResolvedValueOnce(new Response('unavailable', { status: 503 }));
    expect((await (await service.send(ticket)).json()).status).toBe('failed');
    expect(service.fetcher).toHaveBeenCalledTimes(2);
    service.advance(1000);
    expect((await (await service.send(ticket)).json()).status).toBe('delivered');
    const unknown = await service.ticket();
    service.fetcher.mockRejectedValueOnce(new Error('mock timeout'));
    expect((await (await service.send(unknown)).json()).status).toBe('uncertain');
    const count = service.fetcher.mock.calls.length;
    expect((await (await service.send(unknown)).json()).status).toBe('uncertain');
    expect(service.fetcher).toHaveBeenCalledTimes(count);
    service.advance(deliveryTTL + 1);
    expect((await (await service.send(unknown)).json()).status).toBe('expired');
    expect(service.fetcher).toHaveBeenCalledTimes(count);
  });
  it('rejects bad origins, methods, tickets, content, credentials, oversize bodies and abuse without posting', async () => {
    const service = api();
    expect(
      (
        await service.handle(
          request({}, `${path}challenge/`, { Origin: 'https://attacker.example' }),
          'ip',
        )
      ).status,
    ).toBe(403);
    expect((await service.handle(new Request(origin + path), 'ip')).status).toBe(405);
    expect(
      (await service.handle(request({}, path, { 'Content-Type': 'text/plain' }), 'ip')).status,
    ).toBe(415);
    const ticket = await service.ticket();
    expect(
      (
        await service.handle(
          request({ ...payload(), submissionId: ticket.submissionId }, path, {
            'X-Brief-Token': 'x'.repeat(64),
          }),
          '192.0.2.1',
        )
      ).status,
    ).toBe(403);
    const sensitive = payload();
    sensitive.answers.assetNotes = 'API key: dangerous';
    expect((await (await service.send(ticket, sensitive)).json()).code).toBe('sensitive');
    const large = request({ padding: 'X'.repeat(websitePayloadLimit) });
    expect((await service.handle(large, '192.0.2.1')).status).toBe(413);
    expect(
      (
        await service.handle(
          request({}, path, { 'Content-Length': String(websitePayloadLimit + 1) }),
          'ip',
        )
      ).status,
    ).toBe(413);
    for (let i = 0; i < 9; i++) await service.ticket();
    expect((await service.handle(request({}, `${path}challenge/`), '192.0.2.1')).status).toBe(429);
    expect(service.fetcher).not.toHaveBeenCalled();
    const unavailable = createWebsiteBriefAPI({ origin, webhook: '', fetcher: service.fetcher });
    const response = await unavailable(request({}, `${path}challenge/`), 'ip');
    expect(response.status).toBe(503);
    expect(await response.text()).not.toContain(webhook);
  });
});

describe('completion controller: memory-only deduplication and safe retry', () => {
  it.each(['invalid', 'incomplete'])(
    'distinguishes server rejection (%s) from Slack failure',
    async (code) => {
      const fetcher = vi
        .fn<typeof fetch>()
        .mockResolvedValueOnce(Response.json({ submissionId: 'test-id', token: 'test-token' }))
        .mockResolvedValueOnce(
          Response.json({ status: 'failed', delivered: 0, total: 0, code }, { status: 400 }),
        );
      const status = vi.fn();
      await createWebsiteDelivery('websiteDemo', fetcher).complete(
        completeWebsiteDemoBrief(),
        status,
      );
      expect(status.mock.calls.at(-1)![0]).toContain('nothing was sent to Slack');
      expect(status.mock.calls.at(-1)![0]).not.toContain('Slack delivery failed');
      expect(fetcher).toHaveBeenCalledTimes(2);
    },
  );
  const mockedClient = (service: ReturnType<typeof api>) =>
    vi.fn<typeof fetch>(async (url, init) =>
      service.handle(
        new Request(origin + String(url), {
          ...init,
          headers: { ...(init?.headers as Record<string, string>), Origin: origin },
        }),
        '192.0.2.1',
      ),
    );
  it.each([404, 405, 503])(
    'reports a missing/unconfigured endpoint (%s) and can recover on a final action',
    async (statusCode) => {
      const service = api();
      const fetcher = mockedClient(service);
      fetcher.mockResolvedValueOnce(
        statusCode === 503
          ? Response.json({ code: 'unavailable' }, { status: 503 })
          : new Response('<html>Static server</html>', { status: statusCode }),
      );
      const controller = createWebsiteDelivery('websiteDemo', fetcher, async () => {});
      const status = vi.fn();
      await controller.complete(completeWebsiteDemoBrief(), status);
      expect(status.mock.calls.at(-1)![0]).toContain('Online brief delivery is unavailable');
      expect(fetcher).toHaveBeenCalledTimes(1);
      expect(service.fetcher).not.toHaveBeenCalled();
      await controller.complete(completeWebsiteDemoBrief(), status);
      expect(status.mock.calls.at(-1)![0]).toContain('delivered');
      expect(service.fetcher).toHaveBeenCalledTimes(1);
    },
  );
  it('deduplicates identical applicable answers, resubmits changed answers and ignores hidden/UI-only changes', async () => {
    const service = api();
    const fetcher = mockedClient(service);
    const delivery = createWebsiteDelivery('websiteDemo', fetcher, async () => {});
    const state = completeWebsiteDemoBrief();
    const status = vi.fn();
    await Promise.all([delivery.complete(state, status), delivery.complete(state, status)]);
    expect(service.fetcher).toHaveBeenCalledTimes(1);
    expect(fetcher).toHaveBeenCalledTimes(2);
    state.rows.referenceWebsites[0].id = 'new-ui-id';
    await delivery.complete(state, status);
    expect(fetcher).toHaveBeenCalledTimes(2);
    state.answers.trading = 'Changed demo';
    await delivery.complete(state, status);
    expect(service.fetcher).toHaveBeenCalledTimes(2);
    state.answers.trading = 'Demo Orchard Ltd';
    await delivery.complete(state, status);
    expect(service.fetcher).toHaveBeenCalledTimes(2);
    expect(status.mock.calls.at(-1)![0]).toContain('delivered');
  });
  it('uses bounded retries after lost responses and final actions can safely retry a rejected delivery', async () => {
    const service = api();
    const transport = mockedClient(service);
    let drop = true;
    const fetcher = vi.fn<typeof fetch>(async (url, init) => {
      const response = await transport(url, init);
      if (url === path && drop) {
        drop = false;
        throw new Error('lost response after delivery');
      }
      return response;
    });
    const controller = createWebsiteDelivery('websiteDemo', fetcher, async () => {});
    const status = vi.fn();
    await controller.complete(completeWebsiteDemoBrief(), status);
    expect(service.fetcher).toHaveBeenCalledTimes(1);
    expect(fetcher).toHaveBeenCalledTimes(3);
    expect(status.mock.calls.at(-1)![0]).toContain('delivered');
    const second = api();
    second.fetcher.mockResolvedValueOnce(new Response('invalid_payload', { status: 400 }));
    const retry = createWebsiteDelivery('websiteDemo', mockedClient(second), async () => {});
    await retry.complete(completeWebsiteDemoBrief(), status);
    expect(status.mock.calls.at(-1)![0]).toContain('failed');
    await retry.complete(completeWebsiteDemoBrief(), status);
    expect(second.fetcher).toHaveBeenCalledTimes(2);
    expect(status.mock.calls.at(-1)![0]).toContain('delivered');
  });
  it('does not claim failure or success when all submission responses are lost', async () => {
    const service = api();
    const transport = mockedClient(service);
    const fetcher = vi.fn<typeof fetch>(async (url, init) => {
      const response = await transport(url, init);
      if (url === path) throw new Error('mock network failure');
      return response;
    });
    const controller = createWebsiteDelivery('websiteDemo', fetcher, async () => {});
    const status = vi.fn();
    await controller.complete(completeWebsiteDemoBrief(), status);
    expect(service.fetcher).toHaveBeenCalledTimes(1);
    expect(fetcher).toHaveBeenCalledTimes(4);
    expect(status.mock.calls.at(-1)![0]).toContain('could not be confirmed');
  });
});
