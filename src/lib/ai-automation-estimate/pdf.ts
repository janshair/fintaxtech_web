import { jsPDF } from 'jspdf';
import { loadPDFFont, preparePDFText } from '../pdf-font';
import { pdfTokens as t } from '../../design/pdf-tokens';
import { company, ui } from '../../content/site';
import { aiEstimateCopy as c } from '../../content/ai-automation-estimate';
import { estimateText } from './presentation';
import type { Estimate } from './calculate';
export async function createAIEstimatePDF(e: Estimate) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4', compress: true });
  await loadPDFFont(doc);
  doc.setProperties({ title: c.pdfTitle, author: company.legal, subject: e.reference });
  let y = 20;
  const text = (value: string, size: number = t.type.body, accent = false) => {
    doc.setFontSize(size);
    const color = accent ? t.color.accent : t.color.text;
    doc.setTextColor(color[0], color[1], color[2]);
    const lines: string[] = doc.splitTextToSize(preparePDFText(doc, value), t.layout.width);
    for (const line of lines) {
      if (y + 7 > t.layout.bottom) {
        doc.addPage();
        y = 22;
      }
      doc.text(line, t.layout.margin, y);
      y += 6;
    }
    y += t.space.paragraph;
  };
  const logo = await fetch('/mark-print.png');
  if (!logo.ok) throw Error('Logo unavailable');
  doc.addImage(new Uint8Array(await logo.arrayBuffer()), 'PNG', t.layout.margin, 16, 14, 13);
  y = 38;
  text(company.name, t.type.brand);
  text(`${company.legal} | ${company.email} | ${company.phone}`);
  text(ui.registration);
  text(c.pdfTitle, t.type.heading, true);
  for (const line of estimateText(e)) {
    const prominent =
      line === c.disclaimer ||
      line === c.status ||
      line.startsWith(c.implementation + ':') ||
      line.startsWith(c.monthly + ':');
    text(line, prominent ? t.type.heading : t.type.body, prominent);
  }
  text(company.url);
  text(company.address, t.type.small);
  for (let n = 1; n <= doc.getNumberOfPages(); n++) {
    doc.setPage(n);
    doc.setFontSize(t.type.footer);
    doc.setTextColor(...t.color.muted);
    doc.text(
      `${company.legal} · ${n} / ${doc.getNumberOfPages()}`,
      t.layout.margin,
      t.layout.footerText,
    );
    doc.text(company.url + ' | ' + company.email, t.layout.margin, t.layout.footerAddress);
  }
  return doc.output('blob');
}
