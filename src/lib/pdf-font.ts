import type { jsPDF } from 'jspdf';

// Both questionnaires use the same bundled Unicode font and reject unsupported glyphs.
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
export function checkPDFGlyphs(doc: jsPDF, value: string) {
  const font = doc.getFont().metadata as unknown as { characterToGlyph: (code: number) => number };
  for (const character of value) {
    const code = character.codePointAt(0)!;
    if (code > 32 && !font.characterToGlyph(code)) throw new Error('Unsupported PDF glyph');
  }
}
