import { jsPDF } from 'jspdf';
import { logoBriefCopy as c } from '../../content/logo-brief';
import { company } from '../../content/site';
import { quizCopy } from '../../content/questionnaire';
import { pdfTokens as t } from '../../design/pdf-tokens';
import { loadPDFFont, checkPDFGlyphs } from '../pdf-font';
import { briefSummary, invalidSection } from './rules';
import type { BriefState } from './types';

export async function createLogoBriefPDF(state: BriefState, completed = new Date()): Promise<Blob> {
  if (invalidSection(state) !== -1) throw new Error('Incomplete logo brief');
  const doc = new jsPDF({ unit: 'mm', format: 'a4', compress: true });
  await loadPDFFont(doc);
  doc.setProperties({ title: c.title, author: company.legal, creator: company.name });
  const { margin, width, start, bottom } = t.layout;
  let y: number = start;
  const page = () => {
    doc.addPage();
    y = start;
  };
  const lines = (text: string, size: number): string[] => {
    checkPDFGlyphs(doc, text);
    doc.setFontSize(size);
    return doc.splitTextToSize(text, width);
  };
  const height = (value: string, size: number) =>
    lines(value, size).length * size * t.type.lineHeight + t.space.paragraph;
  const reserve = (space: number) => {
    if (y + space > bottom && y > start) page();
  };
  function text(
    value: string,
    size: number = t.type.body,
    color: readonly [number, number, number] = t.color.text,
  ) {
    const wrapped = lines(value, size);
    doc.setTextColor(...color);
    for (const line of wrapped) {
      reserve(size * t.type.lineHeight);
      doc.text(line, margin, y);
      y += size * t.type.lineHeight;
    }
    y += t.space.paragraph;
  }
  function heading(value: string, following = 20) {
    reserve(height(value, t.type.heading) + following + t.space.heading);
    y += t.space.heading;
    text(value, t.type.heading, t.color.accent);
  }
  const logo = await fetch('/mark-print.png');
  if (!logo.ok) throw new Error('Logo unavailable');
  doc.addImage(new Uint8Array(await logo.arrayBuffer()), 'PNG', margin, 16, 14, 13.3);
  doc.setFontSize(t.type.brand);
  doc.text(company.name, 38, 24);
  y = 38;
  heading(c.title);
  text(String(state.answers.trading));
  text(
    `${c.pdfDate}: ${new Intl.DateTimeFormat('en-GB', { dateStyle: 'long' }).format(completed)}`,
    t.type.small,
    t.color.muted,
  );
  text(c.disclaimer, t.type.small);
  const rowSpace = (label: string, value: string) => {
    const labelHeight = height(label, t.type.small);
    const total = labelHeight + height(value, t.type.body);
    return total <= bottom - start - 30 ? total : labelHeight + 3 * t.type.body * t.type.lineHeight;
  };
  for (const section of briefSummary(state)) {
    const first = section.rows[0];
    heading(section.title, first ? rowSpace(first.label, first.value) : 0);
    for (const row of section.rows) {
      reserve(rowSpace(row.label, row.value));
      text(row.label, t.type.small, t.color.muted);
      text(row.value);
    }
    if (section.references) {
      if (state.answers.references === 'Yes')
        for (const [index, reference] of state.images.entries()) {
          const scale = Math.min(width / reference.width, 115 / reference.height);
          const imageWidth = reference.width * scale,
            imageHeight = reference.height * scale;
          const caption = `${c.explanation}\n${reference.explanation.trim()}`;
          reserve(
            height(c.reference(index + 1), t.type.body) +
              imageHeight +
              height(caption, t.type.body) +
              10,
          );
          text(c.reference(index + 1));
          doc.addImage(
            reference.data,
            'JPEG',
            margin + (width - imageWidth) / 2,
            y,
            imageWidth,
            imageHeight,
          );
          y += imageHeight + 7;
          text(caption);
        }
    }
  }
  reserve(20);
  text(c.disclaimer, t.type.small, t.color.muted);
  text(`${company.email} | ${company.phone}`, t.type.small);
  const count = doc.getNumberOfPages();
  for (let i = 1; i <= count; i++) {
    doc.setPage(i);
    doc.setDrawColor(...t.color.border);
    doc.line(margin, t.layout.footerRule, margin + width, t.layout.footerRule);
    doc.setFontSize(t.type.footer);
    doc.setTextColor(...t.color.muted);
    doc.text(quizCopy.pdfFooter, margin, t.layout.footerText);
    doc.text(`${i} / ${count}`, margin + width, t.layout.footerText, { align: 'right' });
  }
  return doc.output('blob');
}
