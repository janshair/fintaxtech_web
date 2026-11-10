import { formatLogoBrief, type LogoSubmission } from './submission';

function shorten(value: string, maxBytes: number) {
  const encoder = new TextEncoder();
  let result = '';
  let bytes = 0;
  for (const char of value) {
    bytes += encoder.encode(char).length;
    if (bytes > maxBytes) break;
    result += char;
  }
  return result;
}

export function logoBriefDownloadName(submission: LogoSubmission) {
  const customer =
    shorten(
      String(submission.state.answers.trading ?? '')
        .normalize('NFKD')
        .replace(/\p{M}/gu, '')
        .toLowerCase()
        .replace(/&/g, ' and ')
        .replace(/[^\p{L}\p{N}]+/gu, '-')
        .replace(/^-+|-+$/g, ''),
      80,
    ).replace(/-+$/g, '') || 'customer';
  return `${customer}-fintaxtech-logo-brief`;
}

function attachmentName(filename: string) {
  // Keep archive entries inside their folder, including filenames supplied by mobile devices.
  const name = filename.normalize('NFKC').split(/[\\/]/).at(-1) ?? '';
  return (
    shorten(name.replace(/[<>:"|?*\u0000-\u001f\u007f]/g, '_'), 180).replace(
      /^[.\s]+|[.\s]+$/g,
      '',
    ) || 'image'
  );
}

// Original files stay separate from BriefState, so submission metadata never contains file bytes.
export async function createLogoBriefDownload(
  submission: LogoSubmission,
  originals: readonly (File | undefined)[],
) {
  const base = logoBriefDownloadName(submission);
  const text = formatLogoBrief(submission);
  const images = submission.state.images;
  if (originals.length !== images.length) throw new Error('Missing original attachments');
  if (!images.length)
    return {
      blob: new Blob([text], { type: 'text/plain;charset=utf-8' }),
      filename: `${base}.txt`,
    };

  const entries: Record<string, Uint8Array> = Object.create(null);
  const manifest: string[] = [];
  for (const [index, image] of images.entries()) {
    const file = originals[index];
    if (!file || !file.size || file.name !== image.filename)
      throw new Error('Missing original attachment');
    const role = image.purpose === 'current-logo' ? 'current-logo' : 'reference';
    const path = `attachments/${index + 1}-${role}-${attachmentName(file.name)}`;
    entries[path] = new Uint8Array(await file.arrayBuffer());
    manifest.push(
      `${image.purpose === 'current-logo' ? 'Current logo' : 'Reference image'}: ${path}`,
    );
  }
  const { strToU8, zipSync } = await import('fflate');
  entries[`${base}.txt`] = strToU8(`${text}\n[ZIP ATTACHMENTS]\n${manifest.join('\n')}\n`);
  // Images are already compressed; store them without recompression or worker requirements.
  return {
    blob: new Blob([zipSync(entries, { level: 0 })], { type: 'application/zip' }),
    filename: `${base}.zip`,
  };
}
