import { jsPDF } from 'jspdf';
import { loadPDFFont, preparePDFText } from '../pdf-font';
import { pdfTokens as t } from '../../design/pdf-tokens';
import { company, ui } from '../../content/site';
import { websiteEstimateCopy as c } from '../../content/website-estimate';
import { services } from './config';
import { estimateText } from './presentation';
import { answerSummary } from './answers';
import type { Estimate } from './calculate';
export async function createWebsitePDF(e: Estimate) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4', compress: true });
  await loadPDFFont(doc);
  doc.setProperties({ title: c.pdfTitle, author: company.legal });
  let y = 20;
  const text = (value: string, size: number = t.type.body) => {
    doc.setFontSize(size);
    for (const line of doc.splitTextToSize(preparePDFText(doc, value), t.layout.width)) {
      if (y + 7 > t.layout.bottom) {
        doc.addPage();
        y = 20;
      }
      doc.text(line, t.layout.margin, y);
      y += 6;
    }
    y += 3;
  };
  const logo = await fetch('/mark-print.png');
  if (!logo.ok) throw Error('Logo unavailable');
  doc.addImage(new Uint8Array(await logo.arrayBuffer()), 'PNG', t.layout.margin, 16, 14, 13);
  y = 38;
  text(company.name, t.type.brand);
  text(`${company.legal} | ${company.email} | ${company.phone}`);
  text(ui.registration);
  text(c.pdfTitle, t.type.heading);
  text(
    `${c.date}: ${new Date().toLocaleDateString('en-GB', { timeZone: 'Europe/London' })} (Europe/London)`,
  );
  text(`${c.version}: ${services.schemaVersion}`);
  if (e.fullTotalMinor === null) text(services.pdf.pendingReviewHeader, t.type.heading);
  for (const line of estimateText(e)) text(line);
  text(c.requirements, t.type.heading);
  for (const line of answerSummary(e.answers)) text(line);
  text(c.brandingTitle, t.type.heading);
  text(c.brandingBody);
  text(company.url + c.brandingRoute);
  doc.textWithLink(c.brandingLink, t.layout.margin, y, { url: company.url + c.brandingRoute });
  for (let n = 1; n <= doc.getNumberOfPages(); n++) {
    doc.setPage(n);
    doc.setFontSize(t.type.footer);
    doc.text(
      `${company.legal} · ${n} / ${doc.getNumberOfPages()}`,
      t.layout.margin,
      t.layout.footerText,
    );
    doc.text(company.address, t.layout.margin, t.layout.footerAddress);
  }
  return doc.output('blob');
}
