import { afterEach, expect, it, vi } from 'vitest';
import { readFile } from 'node:fs/promises';
import { completeLogoBrief } from './fixtures/logo-brief';
import { logoBriefSections } from '../src/content/logo-brief';
import { createBriefRules, isVisible } from '../src/lib/client-brief/rules';
import {
  canonicalLogoSubmission,
  createLogoOutputs,
  formatLogoBrief,
  logoSubmissionMetadata,
  LOGO_BRIEF_SCHEMA_VERSION,
} from '../src/lib/logo-brief/submission';
import { validateLogoSubmission } from '../src/server/logo-brief-validation';
import { slackLogoParts } from '../src/server/logo-brief-format';

const rules = createBriefRules(logoBriefSections);
const field = (id: string) =>
  logoBriefSections.flatMap((section) => section.fields).find((field) => field.id === id)!;
const idea = 'Explore a circular symbol based on the initials.';
const story = 'Fin means Finance, Tax means taxation and Tech means technology.';
const core = 'This is a core idea and should appear in most concepts';
const section = (text: string, name: string) => text.split(`[${name}]\n`)[1]?.split('\n\n')[0];
afterEach(() => vi.unstubAllGlobals());

it.each(['', '   \n\t'])(
  'hides and prunes priority when the logo idea is empty (%j), even with a brand story',
  (empty) => {
    const state = completeLogoBrief();
    state.answers.brandStory = story;
    state.answers.welcomeIdeas = empty;
    state.answers.welcomeIdeasPriority = core;
    expect(isVisible(field('welcomeIdeasPriority'), state.answers)).toBe(false);
    expect(rules.validateField(field('welcomeIdeasPriority'), state)).toBeUndefined();
    const canonical = canonicalLogoSubmission(state);
    expect(canonical.state.answers.welcomeIdeasPriority).toBeUndefined();
    expect(formatLogoBrief(canonical)).not.toContain('Creative idea priority:');
    expect(formatLogoBrief(canonical)).toContain(story);
  },
);

it.each([
  'Designer discretion',
  'Please explore it in at least one concept',
  core,
  'This is mandatory and must appear in every concept',
])('preserves the supplied idea and exact priority: %s', (priority) => {
  const state = completeLogoBrief();
  state.answers.brandStory = story;
  state.answers.welcomeIdeas = idea;
  expect(isVisible(field('welcomeIdeasPriority'), state.answers)).toBe(true);
  expect(rules.validateField(field('welcomeIdeasPriority'), state)).toBeTruthy();
  expect(() => canonicalLogoSubmission(state)).toThrow('Incomplete logo brief');
  state.answers.welcomeIdeasPriority = priority;
  const canonical = canonicalLogoSubmission(state);
  const txt = formatLogoBrief(canonical);
  expect(canonical.state.answers.brandStory).toBe(story);
  expect(canonical.state.answers.welcomeIdeas).toBe(idea);
  expect(canonical.state.answers.welcomeIdeasPriority).toBe(priority);
  expect(section(txt, 'LOGO DIRECTION')).toContain(
    `Ideas/symbols/themes to consider:\n  ${idea}\nCreative idea priority:\n  ${priority}`,
  );
  expect(section(txt, 'BUSINESS')).toContain(`Brand/name story:\n  ${story}`);
  expect(section(txt, 'LOGO DIRECTION')).not.toContain(story);
});

it('allows long visual explanations and rejects invalid priorities without defaulting them', () => {
  const state = completeLogoBrief();
  state.answers.welcomeIdeas = 'The visual idea and its meaning. '.repeat(20);
  state.answers.welcomeIdeasPriority = 'Please do whatever';
  expect(field('welcomeIdeas').type).toBe('long');
  expect(rules.validateField(field('welcomeIdeas'), state)).toBeUndefined();
  expect(rules.validateField(field('welcomeIdeasPriority'), state)).toBeTruthy();
  state.answers.welcomeIdeasPriority = core;
  expect(rules.invalidSection(state)).toBe(-1);
  state.answers.welcomeIdeas = '';
  rules.pruneBrief(state);
  expect(state.answers.welcomeIdeasPriority).toBeUndefined();
});

it('keeps redesign problems, requested improvements and retained elements separate', () => {
  const state = completeLogoBrief();
  Object.assign(state.answers, {
    project: 'Complete redesign',
    identityProblems: 'The current logo feels dated.',
    identityImprovements: 'Make it simpler and more modern.',
    identityRetain: 'Keep the existing navy blue colour.',
  });
  const canonical = canonicalLogoSubmission(state);
  const redesign = section(formatLogoBrief(canonical), 'REDESIGN');
  expect(redesign).toBe(
    'Current identity problems:\n  The current logo feels dated.\nRequested improvements:\n  Make it simpler and more modern.\nElements to retain:\n  Keep the existing navy blue colour.',
  );
  expect(canonical.state.answers.identityRetain).toBe('Keep the existing navy blue colour.');
  delete state.answers.identityImprovements;
  expect(rules.validateField(field('identityImprovements'), state)).toBeTruthy();
  state.answers.project = 'New brand';
  expect(rules.validateField(field('identityImprovements'), state)).toBeUndefined();
  const newBrand = canonicalLogoSubmission(state);
  expect(newBrand.state.answers.identityProblems).toBeUndefined();
  expect(newBrand.state.answers.identityRetain).toBeUndefined();
  expect(formatLogoBrief(newBrand)).not.toContain('[REDESIGN]');
});

it.each([undefined, '', ' \n '])(
  'omits unsupplied retained elements (%j) without inferring any from improvements',
  (retained) => {
    const state = completeLogoBrief();
    Object.assign(state.answers, {
      project: 'Complete redesign',
      identityProblems: 'The logo is too complicated.',
      identityImprovements: 'Create a cleaner identity suitable for mobile use.',
    });
    if (retained !== undefined) state.answers.identityRetain = retained;
    const txt = formatLogoBrief(canonicalLogoSubmission(state));
    expect(section(txt, 'REDESIGN')).toBe(
      'Current identity problems:\n  The logo is too complicated.\nRequested improvements:\n  Create a cleaner identity suitable for mobile use.',
    );
    expect(txt).not.toContain('Elements to retain:');
  },
);

it('generates PDF, validated TXT and Slack text with v2 direction while preserving asset handling', async () => {
  const state = completeLogoBrief();
  Object.assign(state.answers, {
    project: 'Complete redesign',
    identityProblems: 'The current logo feels dated.',
    identityImprovements: 'Make it simpler and more modern.',
    brandStory: story,
    welcomeIdeas: idea,
    welcomeIdeasPriority: core,
  });
  const canonical = canonicalLogoSubmission(state);
  vi.stubGlobal('fetch', async (path: string) => new Response(await readFile(`public${path}`)));
  const { pdf, txt } = await createLogoOutputs(canonical);
  expect(
    Buffer.from(await pdf.arrayBuffer())
      .subarray(0, 5)
      .toString(),
  ).toBe('%PDF-');
  expect(txt).toBe(formatLogoBrief(canonical));
  const validated = validateLogoSubmission({ ...logoSubmissionMetadata(canonical), txt, trap: '' });
  const slack = slackLogoParts(validated, 'test-v2')
    .map((part) => part.text)
    .join('');
  expect(slack).toContain(txt);
  expect(slack).toContain(`Brief schema version:\n  ${LOGO_BRIEF_SCHEMA_VERSION}`);
  expect(slack).toContain(`Creative idea priority:\n  ${core}`);
  expect(section(txt, 'ASSETS')).toBe(
    'Current logo supplied:\n  No\nReference images supplied:\n  No',
  );
  expect(slack).not.toMatch(/data:image|base64|SLACK_WEBHOOK/);
  const summary = JSON.stringify(rules.briefSummary(canonical.state));
  for (const value of [story, idea, core, state.answers.identityImprovements])
    expect(summary).toContain(value);
});
