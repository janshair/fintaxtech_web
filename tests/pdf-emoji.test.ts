import { afterEach, beforeAll, expect, it, vi } from 'vitest';
import { jsPDF } from 'jspdf';
import { readFile } from 'node:fs/promises';
import { loadPDFFont, preparePDFText, checkPDFGlyphs, pdfEmojiNotice } from '../src/lib/pdf-font';
import { completeLogoBrief } from './fixtures/logo-brief';
import { canonicalLogoSubmission, createLogoOutputs } from '../src/lib/logo-brief/submission';
import { validateLogoSubmission } from '../src/server/logo-brief-validation';
import { logoSubmissionMetadata } from '../src/lib/logo-brief/submission';

let doc: jsPDF;
beforeAll(async () => {
  vi.stubGlobal('fetch', async (path: string) => new Response(await readFile(`public${path}`)));
  doc = new jsPDF();
  await loadPDFFont(doc);
  vi.unstubAllGlobals();
});
afterEach(() => vi.unstubAllGlobals());

it.each([
  ['🌍', '[globe showing Europe-Africa]'],
  ['🎥', '[movie camera]'],
  ['🚶‍♂️', '[man walking]'],
  ['👍🏽', '[thumbs up: medium skin tone]'],
  ['👨‍👩‍👧', '[family: man, woman, girl]'],
  ['🇬🇧', '[flag: United Kingdom]'],
  ['1️⃣', '[keycap: 1]'],
  ['🪿', '[goose]'],
])('renders the entire emoji sequence %s as one readable description', (emoji, description) => {
  expect(preparePDFText(doc, `Before ${emoji}\nAfter`)).toBe(`Before ${description}\nAfter`);
});

it('preserves ordinary text and still rejects unsupported non-emoji text instead of corrupting it', () => {
  const value = 'Café — exact wording\nAnother line; 2026 ©';
  expect(preparePDFText(doc, value)).toBe(value);
  expect(() => preparePDFText(doc, 'Unrenderable 𓀀')).toThrow('Unsupported PDF glyph');
  expect(() => checkPDFGlyphs(doc, preparePDFText(doc, 'A story 🌍 🎥 🚶‍♂️'))).not.toThrow();
});

it('generates a real PDF with emoji without changing original canonical answers or submission text', async () => {
  vi.stubGlobal('fetch', async (path: string) => new Response(await readFile(`public${path}`)));
  const state = completeLogoBrief();
  const original = 'A fictional travel studio.\n🌍 Explore places\n🎥 Make videos\n🚶‍♂️ Take walks';
  state.answers.brandStory = original;
  const submission = canonicalLogoSubmission(state, '2026-10-25T12:00:00.000Z');
  const before = JSON.stringify(submission);
  const { pdf, txt } = await createLogoOutputs(submission);
  expect(
    Buffer.from(await pdf.arrayBuffer())
      .subarray(0, 5)
      .toString(),
  ).toBe('%PDF-');
  expect(txt).toContain(original.replaceAll('\n', '\n  '));
  expect(txt).not.toContain('[movie camera]');
  expect(JSON.stringify(submission)).toBe(before);
  expect(validateLogoSubmission({ ...logoSubmissionMetadata(submission), txt, trap: '' })).toEqual(
    logoSubmissionMetadata(submission),
  );
  expect(pdfEmojiNotice).toContain('original answers are unchanged');
});
