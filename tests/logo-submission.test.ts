import { brandingDesignQuestion } from '../src/content/branding-design';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { completeLogoBrief } from './fixtures/logo-brief';
import { logoBriefSections } from '../src/content/logo-brief';
import { createBriefRules, fieldOptions, imagesForField } from '../src/lib/client-brief/rules';
import {
  canonicalLogoSubmission,
  formatLogoBrief,
  logoSubmissionMetadata,
  logoSubmissionPath,
  createLogoOutputs,
} from '../src/lib/logo-brief/submission';
import { createLogoDelivery } from '../src/lib/logo-brief/delivery';
import { createWebsiteBriefAPI } from '../src/server/website-brief-api';
import { validateLogoSubmission } from '../src/server/logo-brief-validation';
import { slackLogoParts } from '../src/server/logo-brief-format';

const rules = createBriefRules(logoBriefSections);
const field = (id: string) =>
  logoBriefSections.flatMap((section) => section.fields).find((field) => field.id === id)!;
const date = '2026-10-12T12:00:00.000Z';
const canonical = () => canonicalLogoSubmission(completeLogoBrief(), date);
const payload = () => ({
  ...logoSubmissionMetadata(canonical()),
  txt: formatLogoBrief(canonical()),
  trap: '',
});
afterEach(() => vi.unstubAllGlobals());

it('keeps six focused sections and shares all nineteen design choices with the public enquiry', () => {
  const state = completeLogoBrief();
  expect(logoBriefSections).toHaveLength(6);
  const lastSection = logoBriefSections.at(-1)!;
  expect(lastSection.title).toBe('References and inspiration');
  expect(lastSection.fields.at(-1)).toMatchObject({
    id: 'anything',
    label: 'Anything else we should know?',
    type: 'long',
    optional: true,
  });
  expect(rules.invalidSection(state)).toBe(-1);
  expect(fieldOptions(field('designStyle'), state.answers)).toEqual(brandingDesignQuestion.options);
  expect(field('designStyle').examples).toBe(brandingDesignQuestion.examples);
  for (const option of brandingDesignQuestion.options!) {
    state.answers.designStyle = option;
    expect(rules.validateField(field('designStyle'), state)).toBeUndefined();
    expect(formatLogoBrief(canonicalLogoSubmission(state))).toContain(
      `Desired design style:\n  ${option}`,
    );
  }
  delete state.answers.designStyle;
  expect(rules.validateField(field('designStyle'), state)).toBeTruthy();
});

it('requires redesign problems only for redesign and removes obsolete identity fields and images', () => {
  const state = completeLogoBrief();
  state.answers.project = 'Complete redesign';
  expect(rules.validateField(field('identityProblems'), state)).toBeTruthy();
  state.answers.identityProblems = 'The name is difficult to read on our vehicles.';
  state.answers.identityImprovements = 'Improve readability on vehicles.';
  state.answers.identityRetain = 'Our established symbol';
  state.images = [
    {
      id: 'old',
      filename: 'current.png',
      purpose: 'current-logo',
      data: '',
      width: 10,
      height: 10,
      explanation: '',
    },
  ];
  expect(rules.invalidSection(state)).toBe(-1);
  expect(formatLogoBrief(canonicalLogoSubmission(state, date))).toContain(
    'Current logo filename:\n  current.png',
  );
  state.answers.project = 'New brand';
  rules.pruneBrief(state);
  expect(state.images).toEqual([]);
  expect(state.answers.identityRetain).toBeUndefined();
  expect(formatLogoBrief(canonicalLogoSubmission(state, date))).not.toContain('[REDESIGN]');
});

it('accepts deferred design and reference choices without requiring an upload or an Other field', () => {
  const state = completeLogoBrief();
  state.answers.designStyle = 'Other — share a reference later';
  state.answers.references = 'Share a reference later';
  expect(rules.invalidSection(state)).toBe(-1);
  const submission = canonicalLogoSubmission(state, date);
  const txt = formatLogoBrief(submission);
  expect(submission.state.images).toEqual([]);
  expect(submission.state.answers.designStyleOther).toBeUndefined();
  expect(txt).toContain('Desired design style:\n  Other — share a reference later');
  expect(txt).toContain('Reference images supplied:\n  Share a reference later');
  expect(validateLogoSubmission({ ...logoSubmissionMetadata(submission), txt, trap: '' })).toEqual(
    logoSubmissionMetadata(submission),
  );
});

it('removes retired questions from state, review and submissions while retaining logo uses', () => {
  const state = completeLogoBrief();
  const retired = [
    'legalDifferent',
    'legal',
    'provides',
    'service2',
    'service3',
    'future',
    'futureDetail',
    'difference',
    'remember',
    'geography',
    'boundaries',
    'feeling',
    'voice',
    'avoidVoice',
    'avoid',
    'primaryUse',
    'deadlineReason',
    'approver',
    'approverName',
    'groupContact',
    'deadline',
    'deadlineDate',
  ];
  for (const id of retired) state.answers[id] = 'RETIRED ANSWER';
  state.answers.uses = ['Signage', 'Vehicles', 'Other'];
  state.answers.usesOther = 'Exhibition stand';
  rules.pruneBrief(state);
  for (const id of retired) expect(state.answers[id]).toBeUndefined();
  expect(JSON.stringify(rules.briefSummary(state))).not.toContain('RETIRED ANSWER');
  const submission = canonicalLogoSubmission(state, date);
  const txt = formatLogoBrief(submission);
  expect(txt).toContain('Logo uses:\n  Signage; Vehicles; Other: Exhibition stand');
  expect(txt).not.toContain('Most important use:');
  expect(txt).not.toContain('RETIRED ANSWER');
  expect(validateLogoSubmission({ ...logoSubmissionMetadata(submission), txt, trap: '' })).toEqual(
    logoSubmissionMetadata(submission),
  );
});

it('requires ten trimmed characters per reference, without applying that requirement to the current logo', () => {
  const state = completeLogoBrief();
  state.answers.project = 'Complete redesign';
  state.answers.references = 'Yes';
  state.images = [
    { id: '1', filename: 'ref.png', data: '', width: 1, height: 1, explanation: ' Plain ' },
    {
      id: '2',
      filename: 'old.png',
      purpose: 'current-logo',
      data: '',
      width: 1,
      height: 1,
      explanation: '',
    },
  ];
  expect(rules.validateField(field('images'), state)).toContain('at least 10');
  state.images[0].explanation = 'Clear typography and generous spacing';
  expect(rules.validateField(field('images'), state)).toBeUndefined();
  expect(rules.validateField(field('currentLogo'), state)).toBeUndefined();
  expect(imagesForField(state, field('images'))).toHaveLength(1);
  state.answers.references = 'No';
  rules.pruneBrief(state);
  expect(state.images).toHaveLength(1);
});

it('creates deterministic UTF-8 text, preserves explicit choices and omits inapplicable fields', () => {
  const state = completeLogoBrief();
  Object.assign(state.answers, {
    tagline: 'No tagline',
    taglineText: 'STALE',
    legalDifferent: 'No',
    legal: 'STALE',
    future: 'Not sure',
    futureDetail: 'We may add repairs.',
    format: 'Designer to recommend',
    designStyle: 'Not sure — help me choose',
    anything: 'Café & care\nKeep this exact sentence.',
    brandStory: '',
  });
  const submission = canonicalLogoSubmission(state, date);
  const txt = formatLogoBrief(submission);
  expect(txt).toBe(formatLogoBrief(submission));
  expect(txt).not.toContain('[POSITIONING]');
  for (const text of [
    'No tagline',
    'Not sure — help me choose',
    'Designer to recommend',
    'Café & care\n  Keep this exact sentence.',
    'Brand/name story:\n  Not provided',
  ])
    expect(txt).toContain(text);
  expect(txt).not.toContain('STALE');
  state.answers.trading = 'Changed after review';
  expect(txt).not.toContain('Changed after review');
  expect(validateLogoSubmission({ ...logoSubmissionMetadata(submission), txt, trap: '' })).toEqual(
    logoSubmissionMetadata(submission),
  );
});

it('generates PDF and TXT using the very same detached canonical data and completion date', async () => {
  const source = completeLogoBrief();
  const submission = canonicalLogoSubmission(source, date);
  source.answers.trading = 'Later edits';
  const pdf = new Blob(['pdf']);
  const createPDF = vi.fn().mockResolvedValue(pdf);
  vi.doMock('../src/lib/logo-brief/pdf', () => ({ createLogoBriefPDF: createPDF }));
  try {
    const outputs = await createLogoOutputs(submission);
    expect(createPDF).toHaveBeenCalledWith(submission.state, new Date(date));
    expect(createPDF.mock.calls[0][0]).toBe(submission.state);
    expect(outputs).toEqual({ pdf, txt: formatLogoBrief(submission) });
    expect(outputs.txt).not.toContain('Later edits');
  } finally {
    vi.doUnmock('../src/lib/logo-brief/pdf');
  }
});

it('rejects missing fields, mismatched text, arbitrary types, binary images and excess selections server-side', () => {
  for (const mutate of [
    (input: ReturnType<typeof payload>) => {
      delete input.state.answers.designStyle;
    },
    (input: ReturnType<typeof payload>) => {
      input.txt += 'invented';
    },
    (input: ReturnType<typeof payload>) => {
      input.state.answers.personality = [
        'Professional',
        'Trustworthy',
        'Friendly',
        'Modern',
        'Established',
        'Creative',
      ];
    },
    (input: ReturnType<typeof payload>) => {
      input.state.answers.nameConfirmed = false;
    },
    (input: ReturnType<typeof payload>) => {
      input.state.images.push({
        id: 'x',
        filename: 'x.png',
        data: 'data:image/jpeg;base64,abc',
        width: 1,
        height: 1,
        explanation: 'Readable lettering',
      });
    },
  ]) {
    const input = payload();
    mutate(input);
    expect(() => validateLogoSubmission(input)).toThrow();
  }
  expect(() => validateLogoSubmission({ ...payload(), state: [] })).toThrow();
});

const origin = 'https://fintaxtech.co.uk';
const webhook = 'https://hooks.slack.com/services/TEST_ONLY';
function harness(fetcher = vi.fn().mockResolvedValue(new Response('ok')), configured = webhook) {
  const handle = createWebsiteBriefAPI({
    origin,
    webhook: configured,
    fetcher,
    pause: async () => {},
  });
  const transport: typeof fetch = async (input, init) =>
    handle(
      new Request(new URL(String(input), origin), {
        ...init,
        headers: { ...Object.fromEntries(new Headers(init?.headers)), Origin: origin },
      }),
      '192.0.2.2',
    );
  return { fetcher, handle, transport, delivery: createLogoDelivery(transport, async () => {}) };
}

describe('logo server delivery', () => {
  it('posts full TXT, disables Slack parsing, and coalesces concurrent and subsequent submissions', async () => {
    const { delivery, fetcher } = harness();
    const status = vi.fn();
    const submission = canonical();
    const results = await Promise.all([
      delivery.complete(submission, status),
      delivery.complete(submission, status),
    ]);
    expect(results.map((result) => result.status)).toEqual(['delivered', 'delivered']);
    await delivery.complete(submission, status);
    expect(fetcher).toHaveBeenCalledTimes(1);
    const message = JSON.parse(fetcher.mock.calls[0][1].body);
    expect(message.text).toContain('New FinTaxTech Brand Brief');
    expect(message.text).toContain(formatLogoBrief(submission));
    expect(message.mrkdwn).toBe(false);
    expect(status.mock.calls.flat().join(' ')).not.toContain('Slack');
    expect(status.mock.calls.flat().join(' ')).not.toContain(webhook);
  });
  it('retains tickets across a lost browser response and recovers without resending', async () => {
    const { transport, fetcher } = harness();
    let dropped = false;
    const delivery = createLogoDelivery(
      async (input, init) => {
        const response = await transport(input, init);
        if (String(input) === logoSubmissionPath && !dropped) {
          dropped = true;
          throw new Error('lost response');
        }
        return response;
      },
      async () => {},
    );
    expect((await delivery.complete(canonical(), () => {})).status).toBe('delivered');
    expect(fetcher).toHaveBeenCalledTimes(1);
  });
  it('returns generic failure, allows a definite rejection to retry, and keeps uncertain sends from repeating', async () => {
    const rejected = harness(
      vi
        .fn()
        .mockResolvedValueOnce(new Response('private upstream detail', { status: 400 }))
        .mockResolvedValue(new Response('ok')),
    );
    const status = vi.fn();
    expect((await rejected.delivery.complete(canonical(), status)).status).toBe('failed');
    expect(status.mock.calls.flat().join(' ')).not.toContain('private upstream detail');
    expect((await rejected.delivery.complete(canonical(), status)).status).toBe('delivered');
    const uncertain = harness(vi.fn().mockRejectedValue(new Error(webhook)));
    expect((await uncertain.delivery.complete(canonical(), status)).status).toBe('uncertain');
    await uncertain.delivery.complete(canonical(), status);
    expect(uncertain.fetcher).toHaveBeenCalledTimes(1);
    expect(status.mock.calls.flat().join(' ')).not.toContain(webhook);
  });
  it('handles unavailable configuration and rejects cross-origin calls', async () => {
    const { delivery, handle, fetcher } = harness(vi.fn(), '');
    expect((await delivery.complete(canonical(), () => {})).status).toBe('failed');
    expect(fetcher).not.toHaveBeenCalled();
    const response = await handle(
      new Request(origin + logoSubmissionPath, {
        method: 'POST',
        headers: { origin: 'https://example.org', 'content-type': 'application/json' },
        body: '{}',
      }),
      'client',
    );
    expect(response.status).toBe(403);
  });
});

it('preserves all text in bounded Slack messages and escapes mentions', () => {
  const submission = canonical();
  for (const field of logoBriefSections
    .flatMap((section) => section.fields)
    .filter((field) => field.type === 'long' && !field.when))
    submission.state.answers[field.id] = '&'.repeat(2000);
  submission.state.answers.anything = '<!channel>\n' + '&'.repeat(1900);
  const parts = slackLogoParts(submission, 'test-id');
  expect(parts.length).toBeGreaterThan(1);
  expect(parts.every((part) => part.text.length <= 33000)).toBe(true);
  const decoded = parts
    .map((part) => part.text)
    .join('')
    .replaceAll('&lt;', '<')
    .replaceAll('&gt;', '>')
    .replaceAll('&amp;', '&');
  expect(decoded).toContain(formatLogoBrief(submission));
  expect(parts[0].text).not.toContain('<!channel>');
});

it('server coalesces concurrent logo requests and rejects changed answers on the same ticket', async () => {
  const { transport, fetcher } = harness();
  const ticket = await (
    await transport(logoSubmissionPath + 'challenge/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{}',
    })
  ).json();
  const post = (data: ReturnType<typeof payload>) =>
    transport(logoSubmissionPath, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Brief-Token': ticket.token },
      body: JSON.stringify({ ...data, submissionId: ticket.submissionId }),
    });
  const results = await Promise.all([post(payload()), post(payload())]);
  expect(results.map((response) => response.status)).toEqual([200, 200]);
  expect((await post(payload())).status).toBe(200);
  expect(fetcher).toHaveBeenCalledTimes(1);
  const changed = payload();
  changed.state.answers.trading = 'Changed business';
  changed.txt = formatLogoBrief(changed);
  expect((await post(changed)).status).toBe(409);
  expect(fetcher).toHaveBeenCalledTimes(1);
});

it('omits approval and deadline from the brief, TXT export and accepted payload', () => {
  const removed = ['approver', 'approverName', 'groupContact', 'deadline', 'deadlineDate'];
  const fieldIds = logoBriefSections.flatMap((section) => section.fields).map((f) => f.id);
  for (const id of removed) expect(fieldIds).not.toContain(id);
  expect(logoBriefSections.map((section) => section.title)).not.toContain('Approval and timing');
  for (const project of ['New brand', 'Complete redesign']) {
    const state = completeLogoBrief();
    state.answers.project = project;
    if (project === 'Complete redesign') {
      state.answers.identityProblems = 'Hard to read.';
      state.answers.identityImprovements = 'Simpler lettering.';
    }
    const submission = canonicalLogoSubmission(state, date);
    const txt = formatLogoBrief(submission);
    expect(txt).not.toMatch(/\[APPROVAL\]|\[DEADLINE\]|approver|deadline/i);
    for (const id of removed) expect(submission.state.answers).not.toHaveProperty(id);
    const body = { ...logoSubmissionMetadata(submission), txt, trap: '' };
    expect(JSON.stringify(validateLogoSubmission(body))).not.toMatch(/approver|deadline/i);
    // A stale client still sending the removed keys is rejected by the server.
    expect(() =>
      validateLogoSubmission({
        ...body,
        state: { ...body.state, answers: { ...body.state.answers, deadline: 'Yes' } },
      }),
    ).toThrow();
  }
});
