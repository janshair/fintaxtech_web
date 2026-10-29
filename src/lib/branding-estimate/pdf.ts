import { jsPDF } from 'jspdf';
import { company, ui } from '../../content/site';
import { brandingEstimateCopy as c } from '../../content/branding-estimate';
import { pdfTokens as t } from '../../design/pdf-tokens';
import { loadPDFFont, preparePDFText, pdfEmojiNotice } from '../pdf-font';
import { catalogItems, money, tax } from './calculate';
import type { EstimateDocument } from './types';

export async function createEstimatePDF(data: EstimateDocument): Promise<Blob> {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  await loadPDFFont(doc);
  doc.setProperties({ title: c.documentTitle, author: company.legal, subject: data.reference });
  const { margin, width, bottom } = t.layout;
  let y: number = t.layout.start;
  const textColor = () => doc.setTextColor(...t.color.text);
  const newPage = () => {
    doc.addPage();
    y = t.layout.start;
    textColor();
  };
  const ensure = (height: number) => {
    if (y + height > bottom) newPage();
  };
  const split = (value: string, available: number = width) =>
    doc.splitTextToSize(preparePDFText(doc, value), available) as string[];
  function text(value: string, size: number = t.type.body) {
    doc.setFontSize(size);
    const lines = split(value);
    for (const line of lines) {
      ensure(size * t.type.lineHeight);
      doc.text(line, margin, y);
      y += size * t.type.lineHeight;
    }
    y += t.space.paragraph;
  }
  function heading(value: string) {
    ensure(22);
    y += t.space.heading;
    doc.setTextColor(...t.color.accent);
    text(value, t.type.heading);
    textColor();
  }
  const logo = await fetch('/mark-print.png');
  if (!logo.ok) throw new Error('Logo unavailable');
  doc.addImage(new Uint8Array(await logo.arrayBuffer()), 'PNG', margin, 16, 14, 13.3);
  doc.setFontSize(t.type.brand);
  textColor();
  doc.text(company.name, margin + 20, 22);
  y = 37;
  text(`${company.url}  |  ${company.email}`, t.type.small);
  text(`${company.phone}  |  ${ui.registration}`, t.type.small);
  heading(c.documentTitle);
  text(`${c.reference}: ${data.reference}`, t.type.small);
  text(
    `${c.issued}: ${new Intl.DateTimeFormat('en-GB', { dateStyle: 'long', timeZone: 'Europe/London' }).format(new Date(data.issued))}`,
    t.type.small,
  );
  text(`${c.catalogue}: ${data.estimate.catalogVersion}`, t.type.small);
  text(c.indicative, t.type.small);
  heading(c.customerHeading);
  for (const key of Object.keys(c.customer) as (keyof typeof c.customer)[]) {
    if (data.customer[key]) text(`${c.customer[key]}: ${data.customer[key]}`);
  }
  heading(c.requirements);
  const tableHeader = () => {
    ensure(17);
    doc.setFillColor(...t.color.border);
    doc.rect(margin, y - 4, width, 10, 'F');
    doc.setFontSize(8);
    textColor();
    doc.text(c.table[0], margin + 2, y);
    doc.text(c.table[1], margin + 112, y);
    doc.text(c.table[2], margin + width - 2, y, { align: 'right' });
    y += 13;
  };
  tableHeader();
  for (const line of data.estimate.lines) {
    doc.setFontSize(t.type.body);
    const descriptions = [line.name, ...line.deliverables.map((d) => `- ${d}`)].flatMap((s) =>
      split(s, 103),
    );
    // Keep ordinary rows together; long custom lists continue with a repeated table header.
    const height = descriptions.length * 5 + 7;
    if (height <= bottom - t.layout.start - 17 && y + height > bottom) {
      newPage();
      tableHeader();
    }
    descriptions.forEach((description, index) => {
      if (y + 6 > bottom) {
        newPage();
        tableHeader();
      }
      doc.setFontSize(t.type.body);
      textColor();
      doc.text(description, margin + 2, y);
      if (index === 0) {
        doc.text(String(line.quantity), margin + 116, y, { align: 'center' });
        doc.text(
          line.amountMinor === null ? c.pending : money(line.amountMinor),
          margin + width - 2,
          y,
          { align: 'right' },
        );
      }
      y += 5;
    });
    doc.setDrawColor(...t.color.border);
    doc.line(margin, y, margin + width, y);
    y += 5;
  }
  ensure(35);
  const e = data.estimate;
  text(`${e.incomplete ? c.knownSubtotal : c.subtotal}: ${money(e.subtotalMinor)}`);
  text(`${c.vat(e.vatRatePercent)}: ${money(e.vatMinor)}`);
  text(`${e.incomplete ? c.knownTotal : c.total}: ${money(e.knownTotalMinor)}`);
  text(tax.quoteLabel, t.type.small);
  if (e.reviewReasons.length) {
    heading(c.manual);
    text(e.incomplete ? c.incomplete : c.reviewNote);
    e.reviewReasons.forEach((reason) => text(`- ${reason}`));
  }
  ensure(40);
  heading(c.packages);
  for (const line of e.lines) {
    const item = catalogItems[line.id];
    heading(line.name);
    for (const inclusion of item.includes)
      text(
        `- ${c.included(inclusion.label, inclusion.quantity, inclusion.minimumPages, inclusion.maximumPages)}`,
      );
    if (item.assumptions.length) {
      ensure(20);
      text(c.assumptions, t.type.small);
      item.assumptions.forEach((assumption) => text(`- ${assumption}`, t.type.small));
    }
    if (item.exclusions.length) {
      ensure(20);
      text(c.exclusions, t.type.small);
      item.exclusions.forEach((exclusion) => text(`- ${exclusion}`, t.type.small));
    }
  }
  const extraItems = e.lines
    .map((line) => catalogItems[line.id])
    .filter((item) => item.extras.length || item.quote?.additionalWorkNotice);
  if (extraItems.length) {
    heading(c.extras);
    for (const item of extraItems) {
      text(item.quoteName);
      for (const extra of item.extras.filter((extra) => !extra.calculatedFromCategoryQuantity))
        text(c.perItem(extra.name, money(extra.amountMinor)), t.type.small);
      if (item.quote?.additionalWorkNotice) text(item.quote.additionalWorkNotice, t.type.small);
    }
  }
  heading(c.exclusions);
  c.conditions.forEach((condition) => text(`- ${condition}`, t.type.small));
  text(c.indicative, t.type.small);
  text(tax.quoteLabel, t.type.small);
  text(pdfEmojiNotice, t.type.small);
  const pages = doc.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);
    doc.setDrawColor(...t.color.border);
    doc.line(margin, t.layout.footerRule, margin + width, t.layout.footerRule);
    doc.setTextColor(...t.color.muted);
    doc.setFontSize(t.type.footer);
    doc.text(company.legal, margin, t.layout.footerText);
    doc.text(c.page(i, pages), margin + width, t.layout.footerText, { align: 'right' });
    doc.text(company.address, margin, t.layout.footerAddress);
  }
  return doc.output('blob');
}
