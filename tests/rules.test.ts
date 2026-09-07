import { describe, it, expect } from 'vitest';
import { questionSets } from '../src/content/questions';
import {
  visibleQuestions,
  visibleSummary,
  pruneHiddenAnswers,
  needsBranding,
  promoAllowed,
  routeService,
} from '../src/lib/rules';
import { validateAnswer, validCompanyNumber, validEmail } from '../src/lib/validation';
import type { Journey, Question } from '../src/lib/types';
const website = (answers = {}): Journey => ({
  service: 'websites',
  stage: '2',
  answers,
  promo: false,
  short: false,
});
describe('approved questionnaire coverage', () => {
  it('keeps every approved stage question', () => {
    expect(Object.values(questionSets).map((s) => [s['1'].length, s['2'].length])).toEqual([
      [8, 11],
      [9, 11],
      [11, 10],
      [10, 12],
    ]);
  });
  it('uses unique ids and no budget or price questions', () => {
    const all = Object.values(questionSets).flatMap((s) => [...s['1'], ...s['2']]);
    expect(new Set(all.map((q) => q.id)).size).toBe(all.length);
    expect(JSON.stringify(all)).not.toMatch(/budget|£|quoted price/i);
  });
  it('each journey supports valid choices and optional final text', () => {
    for (const sets of Object.values(questionSets)) {
      for (const qs of Object.values(sets)) {
        expect(qs.at(-1)?.optional).toBe(true);
        for (const q of qs) {
          expect(
            validateAnswer(
              q as Question,
              q.type === 'text' ? '' : q.type === 'multi' ? [q.options![0]] : q.options![0],
            ),
          ).toBeNull();
        }
      }
    }
  });
});
describe('conditional answers', () => {
  it('shows the redesign follow-up only for a rebuild', () => {
    expect(visibleQuestions(website()).map((q) => q.id)).not.toContain('websites-2-9');
    expect(
      visibleQuestions(website({ 'websites-1-1': 'Complete redesign and rebuild' })).map(
        (q) => q.id,
      ),
    ).toContain('websites-2-9');
  });
  it('removes stale hidden answers from review, export and state', () => {
    const j = website({
      'websites-1-1': 'New business website',
      'websites-2-9': 'Archive privately',
      'websites-custom-page': 'Private plans',
    });
    expect(JSON.stringify(visibleSummary(j))).not.toMatch(/Archive privately|Private plans/);
    expect(pruneHiddenAnswers(j)).toEqual({ 'websites-1-1': 'New business website' });
  });
  it('reveals optional custom page details only for that selection', () => {
    const j = website({ 'websites-2-2': ['Home', 'Custom page'] });
    expect(visibleQuestions(j).some((q) => q.id === 'websites-custom-page')).toBe(true);
  });
  it('offers separate branding for missing assets in either website stage', () => {
    expect(needsBranding({ ...website({ 'websites-1-5': 'No assets' }), stage: '1' })).toBe(true);
    expect(needsBranding(website({ 'websites-2-4': 'No assets' }))).toBe(true);
    expect(needsBranding(website({ 'websites-2-4': 'Logo only' }))).toBe(false);
  });
  it('short branding is separate and limited', () => {
    const j: Journey = { service: 'branding', stage: '2', answers: {}, promo: false, short: true };
    expect(visibleQuestions(j)).toHaveLength(6);
    expect(visibleQuestions(j).every((q) => q.id.startsWith('branding-'))).toBe(true);
  });
});
describe('business boundaries', () => {
  it('blocks promo context when closed, including stale requests', () => {
    expect(promoAllowed('closed', true)).toBe(false);
    expect(promoAllowed('available', false)).toBe(false);
    expect(promoAllowed('available', true)).toBe(true);
    expect(promoAllowed('final-place', true)).toBe(true);
  });
  it('adds declarations to the normal website flow only', () => {
    const j = { ...website(), promo: true };
    expect(
      visibleQuestions(j)
        .slice(0, 3)
        .map((q) => q.id),
    ).toEqual(['promo-uk', 'promo-recent', 'promo-website']);
    expect(
      visibleQuestions({ ...j, service: 'branding' }).some((q) => q.id.startsWith('promo')),
    ).toBe(false);
  });
  it('routes outcomes without paid package recommendations', () =>
    expect([0, 1, 2, 3].map(routeService)).toEqual([
      'branding',
      'websites',
      'mobile-apps',
      'prompt-services',
    ]));
  it('validates limits, exclusive options and unexpected options', () => {
    const q: Question = {
      id: 'x',
      label: 'x',
      type: 'multi',
      stage: 1,
      optional: false,
      max: 2,
      options: ['A', 'B', 'C', 'None', 'Not sure'],
    };
    expect(validateAnswer(q, ['A', 'B'])).toBeNull();
    expect(validateAnswer(q, ['A', 'B', 'C'])).not.toBeNull();
    expect(validateAnswer(q, ['A', 'None'])).not.toBeNull();
    expect(validateAnswer(q, ['injected'])).not.toBeNull();
  });
  it('validates contact and UK company fields', () => {
    expect(validEmail('')).toBe(true);
    expect(validEmail('me@example.com')).toBe(true);
    expect(validEmail('not an email')).toBe(false);
    expect(validCompanyNumber('SC807896')).toBe(true);
    expect(validCompanyNumber('12345678')).toBe(true);
    expect(validCompanyNumber('1234')).toBe(false);
  });
});
