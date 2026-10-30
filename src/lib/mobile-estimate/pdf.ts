import { jsPDF } from 'jspdf';
import { pdfTokens as t } from '../../design/pdf-tokens';
import { loadPDFFont, preparePDFText, pdfEmojiNotice } from '../pdf-font';
import { company, ui } from '../../content/site';
import { mobileEstimateCopy as c, mobileServices } from '../../content/mobile-estimate';
import type { EstimateCustomer } from '../branding-estimate/types';
import type { MobileEstimate } from './types';
import { answerLabel } from './answers';
import {
  issueDate,
  lineAmount,
  monthlyAmount,
  money,
  pendingMessages,
  maintenanceDescription,
} from './presentation';
export async function createMobileEstimatePDF(
  e: MobileEstimate,
  customer: EstimateCustomer,
  reference: string,
  issued: string,
): Promise<Blob> {
  const doc = new jsPDF({ unit: 'mm', format: 'a4', compress: true });
  await loadPDFFont(doc);
  doc.setProperties({ title: c.pdfTitle, author: company.legal, subject: reference });
  const { margin, width, bottom, start } = t.layout;
  let y: number = start;
  const reserve = (height: number) => {
    if (y + height > bottom) {
      doc.addPage();
      y = start;
    }
  };
  function text(value: string, size: number = t.type.body, accent = false) {
    doc.setFontSize(size);
    const color = accent ? t.color.accent : t.color.text;
    doc.setTextColor(color[0], color[1], color[2]);
    const lines: string[] = doc.splitTextToSize(preparePDFText(doc, value), width);
    for (const line of lines) {
      reserve(size * t.type.lineHeight);
      doc.text(line, margin, y);
      y += size * t.type.lineHeight;
    }
    y += t.space.paragraph;
  }
  function heading(value: string) {
    reserve(25);
    y += t.space.heading;
    text(value, t.type.heading, true);
  }
  const logo = await fetch('/mark-print.png');
  if (!logo.ok) throw new Error('Logo unavailable');
  doc.addImage(new Uint8Array(await logo.arrayBuffer()), 'PNG', margin, 16, 14, 13.3);
  doc.setFontSize(t.type.brand);
  doc.text(company.name, margin + 20, 23);
  y = 37;
  text(`${company.url} | ${company.email} | ${company.phone}`, t.type.small);
  text(ui.registration, t.type.small);
  heading(c.pdfTitle);
  text(c.nonBinding, t.type.small);
  text(`${c.reference}: ${reference}`, t.type.small);
  text(`${c.issued}: ${issueDate(issued)}`, t.type.small);
  text(
    `${c.versions}: ${e.versions.services} / ${e.versions.pricing} / ${e.versions.calculation}`,
    t.type.small,
  );
  heading(c.details);
  text(customer.name);
  if (customer.business) text(customer.business);
  text(customer.email);
  if (customer.phone) text(customer.phone);
  for (const [type, title] of [
    ['one_time', c.oneTime],
    ['monthly', c.monthly],
  ] as const) {
    heading(title);
    for (const line of e.lines.filter((line) => line.charge_type === type)) {
      reserve(15);
      text(line.label, t.type.small);
      text(lineAmount(line));
    }
    reserve(22);
    text(type === 'one_time' ? c.subtotal : c.monthlySubtotal, t.type.small);
    text(
      type === 'one_time' ? money(e.one_time_subtotal_pence) : monthlyAmount(e),
      t.type.heading,
      true,
    );
    if (type === 'monthly') text(maintenanceDescription(e), t.type.small);
  }
  if (e.has_pending_scope) {
    heading(c.pendingTitle);
    text(c.pendingNote);
    pendingMessages(e).forEach((v) => text(`- ${v}`));
  }
  if (e.is_lower_bound) text(c.lowerBound);
  heading(c.vat);
  text(e.tax.message);
  if (e.tax.status === 'calculated')
    for (const [label, amount] of [
      [c.oneTax, e.tax.one_time_vat_pence],
      [c.monthlyTax, e.tax.monthly_vat_pence],
      [c.oneIncluding, e.tax.one_time_including_vat_pence],
      [c.monthlyIncluding, e.tax.monthly_including_vat_pence],
    ] as const)
      text(`${label}: ${money(amount!)}`);
  heading(c.review);
  for (const section of mobileServices.steps) {
    heading(section.title);
    for (const q of section.questions) {
      reserve(16);
      text(q.label, t.type.small);
      text(answerLabel(q, e.answers));
    }
  }
  for (const [title, messages] of [
    [c.assumptions, e.assumptions],
    [c.exclusions, e.exclusions],
  ] as const) {
    heading(title);
    messages.forEach((v) => text(`- ${v}`, t.type.small));
  }
  text(mobileServices.delivery.customer_status_label);
  if (['apple', 'google', 'both'].includes(String(e.answers.publishing)))
    text(mobileServices.steps[4].questions[0].notice!, t.type.small);
  text(c.nonBinding, t.type.small);
  text(pdfEmojiNotice, t.type.small);
  for (let page = 1; page <= doc.getNumberOfPages(); page++) {
    doc.setPage(page);
    doc.setDrawColor(...t.color.border);
    doc.line(margin, t.layout.footerRule, margin + width, t.layout.footerRule);
    doc.setTextColor(...t.color.muted);
    doc.setFontSize(t.type.footer);
    doc.text(company.legal, margin, t.layout.footerText);
    doc.text(`${page} / ${doc.getNumberOfPages()}`, margin + width, t.layout.footerText, {
      align: 'right',
    });
    doc.text(company.address, margin, t.layout.footerAddress);
  }
  return doc.output('blob');
}
