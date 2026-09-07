import { pdfTokens as t } from '../design/pdf-tokens';
import { jsPDF } from 'jspdf';
import { company } from '../content/site';
import { quizCopy as c } from '../content/questionnaire';
import { promoCopy, promoStatus } from '../content/promo';
import { services } from '../content/services';
import { visibleSummary, promoAllowed } from './rules';
import type { Journey, SummaryRow } from './types';
export interface PDFInput {
  journey: Journey;
  customer: SummaryRow[];
  partial?: boolean;
}
// jsPDF 4.2.1 exposes 40-bit RC4, not modern secure PDF encryption. Never offer it as protection.
export const supportsSecurePasswordProtection = false;
export async function createPDF({ journey, customer, partial = false }: PDFInput): Promise<Blob> {
  const doc = new jsPDF({ unit: 'mm', format: 'a4', compress: true });
  // Local Unicode font covers Latin, Greek, Cyrillic and several other scripts.
  // Reject unsupported glyphs rather than silently dropping customer text.
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
  doc.setProperties({ title: c.pdfTitle, author: company.legal, creator: company.name });
  let y = t.layout.start as number;
  const { margin, width, bottom } = t.layout;
  function page() {
    doc.addPage();
    y = t.layout.start;
  }
  function text(
    value: string,
    size: number = t.type.body,
    color: readonly [number, number, number] = t.color.text,
  ) {
    const font = doc.getFont().metadata as unknown as {
      characterToGlyph: (code: number) => number;
    };
    for (const character of value) {
      const code = character.codePointAt(0)!;
      if (code > 32 && !font.characterToGlyph(code)) throw new Error('Unsupported PDF glyph');
    }
    doc.setFontSize(size);
    doc.setTextColor(...color);
    const lines = doc.splitTextToSize(value, width) as string[];
    for (const line of lines) {
      if (y + size * 0.4 > bottom) page();
      doc.text(line, margin, y);
      y += size * t.type.lineHeight;
    }
    y += t.space.paragraph;
  }
  function heading(value: string) {
    if (y + 20 > bottom) page();
    y += t.space.heading;
    text(value, t.type.heading, t.color.accent);
  }
  const logoResponse = await fetch('/mark-print.png');
  if (!logoResponse.ok) throw new Error('Logo unavailable');
  doc.addImage(new Uint8Array(await logoResponse.arrayBuffer()), 'PNG', 18, 16, 14, 13.3);
  y = 21;
  doc.setFontSize(t.type.brand);
  doc.text(company.name, 38, y);
  y = 35;
  text(`${company.email}  |  ${company.phone}`, 9);
  heading(journey.short ? c.pdfShortTitle : c.pdfTitle);
  text(
    `${c.pdfDate}: ${new Intl.DateTimeFormat('en-GB', { dateStyle: 'long' }).format(new Date())}`,
    9,
  );
  const service = services.find((s) => s.id === journey.service)!;
  text(`${c.pdfService}: ${service.name}`);
  if (partial) text(c.pdfPartial);
  heading(c.pdfCustomer);
  if (customer.length) customer.forEach((row) => text(`${row.label}: ${row.value}`));
  else text(c.notProvided);
  heading(c.pdfAnswers);
  for (const row of visibleSummary(journey)) {
    if (y > 242) page();
    text(row.label, t.type.body, t.color.muted);
    text(row.value);
  }
  heading(c.pdfAssumptions);
  text(service.boundary);
  text(service.ownership);
  if (promoAllowed(promoStatus, journey.promo)) {
    heading(promoCopy.title);
    text(promoCopy.price);
    text(promoCopy.intro);
    heading(promoCopy.scopeTitle);
    promoCopy.scope.forEach((x) => text('• ' + x));
    heading(promoCopy.exclusionsTitle);
    promoCopy.exclusions.forEach((x) => text('• ' + x));
    text(promoCopy.pdfNotice);
  }
  heading(c.pdfNext);
  text(c.pdfNextText);
  const count = doc.getNumberOfPages();
  for (let i = 1; i <= count; i++) {
    doc.setPage(i);
    doc.setDrawColor(...t.color.border);
    doc.line(18, 278, 192, 278);
    doc.setFontSize(t.type.footer);
    doc.setTextColor(...t.color.muted);
    doc.text(c.pdfFooter, 18, 284);
    doc.text(company.address, 18, 289);
    doc.text(`${i} / ${count}`, 192, 284, { align: 'right' });
  }
  return doc.output('blob');
}
