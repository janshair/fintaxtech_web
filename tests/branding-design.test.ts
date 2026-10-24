import { expect, it } from 'vitest';
import { readFile } from 'node:fs/promises';
import { brandingDesignQuestion as question } from '../src/content/branding-design';
import { visibleQuestions, visibleSummary, pruneHiddenAnswers } from '../src/lib/rules';
import { validateQuestion } from '../src/lib/validation';
import type { Journey } from '../src/lib/types';

it('replaces the redundant first question with the illustrated design choices and deferred guidance options in second position', async () => {
  const journey: Journey = {
    service: 'branding',
    stage: '1',
    answers: { 'branding-1-1': 'Logo only' },
    short: false,
    promo: false,
  };
  expect(visibleQuestions(journey).map((q) => q.id)).toEqual([
    'branding-1-2',
    'branding-1-design',
    'branding-1-4',
    'branding-1-7',
    'branding-1-8',
  ]);
  expect(question.options).toEqual([
    'Skeuomorphism',
    'Neomorphism',
    'Glassmorphism',
    'Claymorphism',
    'Minimalism',
    'Maximalism',
    'Brutalism',
    'Liquid Glass',
    'Spatial UI',
    'Flat design',
    'Geometric',
    'Retro / Vintage',
    'Hand-drawn / Organic',
    'Typographic',
    'Illustrative / Mascot',
    'Luxury / Elegant',
    'Abstract',
    'Not sure — help me choose',
    'Other — share a reference later',
  ]);
  expect(Object.keys(question.examples!)).toEqual(question.options!.slice(0, -2));
  expect(validateQuestion(question, journey.answers)).toBeTruthy();
  for (const option of question.options!) {
    journey.answers[question.id] = option;
    expect(validateQuestion(question, journey.answers)).toBeNull();
    expect(pruneHiddenAnswers(journey)).toEqual({ [question.id]: option });
    expect(visibleSummary(journey)).toEqual([{ label: 'Choose desired design', value: option }]);
    const example = question.examples![option];
    if (!example) {
      expect(['Not sure — help me choose', 'Other — share a reference later']).toContain(option);
      continue;
    }
    expect(example.alt.length).toBeGreaterThan(15);
    expect(example.credit).toBeTruthy();
    const bytes = await readFile(`public${example.image}`);
    expect(bytes.byteLength).toBeGreaterThan(1000);
    if (example.image.endsWith('.webp')) {
      expect(bytes.toString('ascii', 0, 4)).toBe('RIFF');
      expect(bytes.toString('ascii', 8, 12)).toBe('WEBP');
    }
  }
  journey.answers[question.id] = ['Minimalism', 'Maximalism'];
  expect(validateQuestion(question, journey.answers)).toBeTruthy();
  journey.answers[question.id] = 'Unknown';
  expect(validateQuestion(question, journey.answers)).toBeTruthy();
});
