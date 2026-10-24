import { expect, it } from 'vitest';
import { questionSets } from '../src/content/questions';
import { contactField } from '../src/lib/enquiry-contact';
import { pruneHiddenAnswers, visibleQuestions, visibleSummary } from '../src/lib/rules';
import {
  validateAnswer,
  validateQuestion,
  validContactEmail,
  validWhatsAppNumber,
} from '../src/lib/validation';
import type { Journey, ServiceId } from '../src/lib/types';

const journey = (service: ServiceId): Journey => ({
  service,
  stage: '1',
  short: false,
  promo: false,
  answers: {},
});

it('keeps only the five first-conversation branding questions with stable IDs', () => {
  const state = journey('branding');
  expect(visibleQuestions(state).map((question) => question.id)).toEqual([
    'branding-1-2',
    'branding-1-design',
    'branding-1-4',
    'branding-1-7',
    'branding-1-8',
  ]);
  for (const id of ['branding-1-1', 'branding-1-3', 'branding-1-5', 'branding-1-6'])
    state.answers[id] = 'Obsolete answer';
  expect(pruneHiddenAnswers(state)).toEqual({});
  expect(visibleSummary(state)).toEqual([]);
});

it.each(['branding', 'websites', 'mobile-apps', 'ai-automation'] as const)(
  '%s requires the selected inline contact field and excludes the other method from state, review and PDF summaries',
  (service) => {
    const state = journey(service);
    const question = visibleQuestions(state).find((question) => question.type === 'contact')!;
    expect(question.label).toBe('How should we contact you?');
    expect(question.options).toEqual(['Email', 'WhatsApp']);
    expect(contactField(question, state.answers)).toBeUndefined();
    expect(validateQuestion(question, state.answers)).toBeTruthy();
    state.answers[question.id] = 'Zoom call';
    expect(validateQuestion(question, state.answers)).toBeTruthy();
    state.answers[question.id] = ['Email'];
    expect(validateQuestion(question, state.answers)).toBeTruthy();
    state.answers[question.id] = 'Email';
    const email = contactField(question, state.answers)!;
    expect(email.type).toBe('email');
    expect(validateQuestion(question, state.answers)).toContain('email address');
    state.answers[email.id] = 'not an email';
    expect(validateQuestion(question, state.answers)).toBeTruthy();
    state.answers[email.id] = 'client@example.com';
    expect(validateQuestion(question, state.answers)).toBeNull();
    expect(pruneHiddenAnswers(state)).toEqual(state.answers);
    expect(visibleSummary(state)).toContainEqual({
      label: 'Email address',
      value: 'client@example.com',
    });

    state.answers[question.id] = 'WhatsApp';
    const whatsapp = contactField(question, state.answers)!;
    expect(whatsapp.type).toBe('tel');
    expect(validateQuestion(question, state.answers)).toContain('WhatsApp number');
    state.answers[whatsapp.id] = '+44 7700 900123';
    expect(validateQuestion(question, state.answers)).toBeNull();
    expect(JSON.stringify(visibleSummary(state))).not.toContain('client@example.com');
    expect(visibleSummary(state)).toContainEqual({
      label: 'WhatsApp number',
      value: '+44 7700 900123',
    });
    state.answers = pruneHiddenAnswers(state);
    expect(state.answers[email.id]).toBeUndefined();
    expect(state.answers[whatsapp.id]).toBe('+44 7700 900123');
    expect(pruneHiddenAnswers(state)).toEqual(state.answers); // Revisiting keeps the active value.
    state.answers[question.id] = 'Email';
    state.answers = pruneHiddenAnswers(state);
    expect(state.answers[whatsapp.id]).toBeUndefined();
    expect(validateQuestion(question, state.answers)).toBeTruthy();
  },
);

it.each([
  'client@example.com',
  'first.last+enquiry@sub.example.co.uk',
  "o'neill@example.com",
  '  client@example.com  ',
])('accepts the email format %s', (value) => expect(validContactEmail(value)).toBe(true));
it.each([
  '',
  ' ',
  'name',
  'name@localhost',
  'name@@example.com',
  '.name@example.com',
  'name.@example.com',
  'first..last@example.com',
  'name@-example.com',
  'name@example..com',
  'name@exam_ple.com',
  'a'.repeat(65) + '@example.com',
  'Name <name@example.com>',
  'name@ example.com',
  'name@example.com\nInjected: value',
])('rejects invalid email input %j', (value) => expect(validContactEmail(value)).toBe(false));
it.each([
  '07700 900123',
  '020 7946 0018',
  '07700-900123',
  '+44 7700 900123',
  '+44 (7700) 900123',
  '0044 7700 900123',
  '+1 212 555 0123',
  '+91 98765 43210',
])('accepts the WhatsApp number format %s', (value) =>
  expect(validWhatsAppNumber(value)).toBe(true),
);
it.each([
  '',
  ' ',
  '123',
  '1234567890',
  '0770090012',
  '00000000000',
  '+44 07700 900123',
  '+44 7700 90012',
  '+0 7700 900123',
  '++44 7700 900123',
  '+1234567890123456',
  '07700 900123 ext 4',
  'https://wa.me/447700900123',
  '+44 (7700 900123',
  '+44 7700) 900123',
])('rejects invalid WhatsApp input %j', (value) => expect(validWhatsAppNumber(value)).toBe(false));

it('leaves all detailed Stage 2 questions using their existing question types and validation', () => {
  for (const stages of Object.values(questionSets)) {
    expect(stages['2'].some((question) => question.type === 'contact')).toBe(false);
    for (const question of stages['2']) {
      const answer =
        question.type === 'text'
          ? 'Example requirement'
          : question.type === 'multi'
            ? [question.options![0]]
            : question.options![0];
      expect(validateAnswer(question, answer)).toBeNull();
    }
  }
});
