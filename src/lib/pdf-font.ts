import type { jsPDF } from 'jspdf';
import emojiLabels from '../content/pdf-emoji-labels.json';

// Emoji labels are derived from Unicode CLDR 48; see /licenses/unicode-cldr.txt.
const labels: Record<string, string> = emojiLabels;
const graphemes = new Intl.Segmenter('en', { granularity: 'grapheme' });
const emojiPattern = /[\p{Extended_Pictographic}\p{Regional_Indicator}\u20e3]/u;
export const pdfEmojiNotice =
  'Emoji are shown as descriptions in square brackets in this PDF. Your original answers are unchanged.';

// Both questionnaires use the same bundled Unicode font.
export async function loadPDFFont(doc: jsPDF) {
  const response = await fetch('/fonts/DejaVuSans.ttf');
  if (!response.ok) throw new Error('Font unavailable');
  const bytes = new Uint8Array(await response.arrayBuffer());
  let binary = '';
  for (let i = 0; i < bytes.length; i += 8192)
    binary += String.fromCharCode(...bytes.subarray(i, i + 8192));
  doc.addFileToVFS('FinTaxTech.ttf', btoa(binary));
  doc.addFont('FinTaxTech.ttf', 'FinTaxTech', 'normal');
  doc.setFont('FinTaxTech');
  doc.setLanguage('en-GB');
}
export function preparePDFText(doc: jsPDF, value: string): string {
  const font = doc.getFont().metadata as unknown as { characterToGlyph: (code: number) => number };
  const result = Array.from(graphemes.segment(value), ({ segment }) => {
    if (!emojiPattern.test(segment)) return segment;
    // jsPDF's TTF text encoding cannot safely represent supplementary emoji or ZWJ sequences.
    const unsupported = Array.from(segment).some((character) => {
      const code = character.codePointAt(0)!;
      return code > 0xffff || (code > 32 && !font.characterToGlyph(code));
    });
    if (!unsupported) return segment;
    const key = segment.replace(/[\ufe0e\ufe0f]/gu, '');
    const description =
      labels[key] ??
      `emoji ${Array.from(segment)
        .map((character) => `U+${character.codePointAt(0)!.toString(16).toUpperCase()}`)
        .join(' ')}`;
    return `[${description}]`;
  }).join('');
  checkPDFGlyphs(doc, result);
  return result;
}
export function checkPDFGlyphs(doc: jsPDF, value: string) {
  const font = doc.getFont().metadata as unknown as { characterToGlyph: (code: number) => number };
  for (const character of value) {
    const code = character.codePointAt(0)!;
    if (code > 32 && !font.characterToGlyph(code)) throw new Error('Unsupported PDF glyph');
  }
}
