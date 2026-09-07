import { company } from '../content/site';
import { quizCopy as c } from '../content/questionnaire';
export const emailHref = () =>
  `mailto:${company.email}?subject=${encodeURIComponent(c.shareSubject)}&body=${encodeURIComponent(c.shareBody)}`;
export const whatsappHref = () =>
  `https://wa.me/${company.whatsapp}?text=${encodeURIComponent(c.shareBody)}`;
export function canShare(file: File): boolean {
  try {
    return !!navigator.canShare?.({ files: [file] });
  } catch {
    return false;
  }
}
export async function share(file: File) {
  await navigator.share({ files: [file], title: c.shareSubject });
}
export function download(blob: Blob) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = c.pdfFilename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
