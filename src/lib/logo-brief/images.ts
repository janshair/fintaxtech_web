import { logoBriefCopy as c } from '../../content/logo-brief';
import { limits } from './rules';
import { pdfTokens } from '../../design/pdf-tokens';
import type { ReferenceImage } from './types';

export function validateImageFile(file: Pick<File, 'type' | 'size'>) {
  if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) throw new Error(c.imageType);
  if (file.size > limits.imageBytes) throw new Error(c.imageSize);
  if (!file.size) throw new Error(c.imageInvalid);
}
export async function prepareReference(file: File): Promise<ReferenceImage> {
  validateImageFile(file);
  const signature = new Uint8Array(await file.slice(0, 12).arrayBuffer());
  const matches =
    file.type === 'image/png'
      ? signature[0] === 137 && signature[1] === 80 && signature[2] === 78 && signature[3] === 71
      : file.type === 'image/jpeg'
        ? signature[0] === 255 && signature[1] === 216 && signature[2] === 255
        : String.fromCharCode(...signature.slice(0, 4)) === 'RIFF' &&
          String.fromCharCode(...signature.slice(8, 12)) === 'WEBP';
  if (!matches) throw new Error(c.imageInvalid);
  const url = URL.createObjectURL(file);
  try {
    const image = new Image();
    image.src = url;
    await image.decode();
    const w = image.naturalWidth,
      h = image.naturalHeight;
    if (!w || !h) throw new Error(c.imageInvalid);
    if (w * h > 40_000_000 || Math.max(w, h) > 16000) throw new Error(c.imageDimensions);
    const scale = Math.min(1, limits.imageSide / Math.max(w, h));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(w * scale));
    canvas.height = Math.max(1, Math.round(h * scale));
    const context = canvas.getContext('2d');
    if (!context) throw new Error(c.imageInvalid);
    context.fillStyle = `rgb(${pdfTokens.color.paper.join(',')})`;
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    const data = canvas.toDataURL('image/jpeg', 0.84);
    return {
      id: crypto.randomUUID(),
      data,
      width: canvas.width,
      height: canvas.height,
      explanation: '',
    };
  } catch (error) {
    if (error instanceof Error && error.message === c.imageDimensions) throw error;
    throw new Error(c.imageInvalid);
  } finally {
    URL.revokeObjectURL(url);
  }
}
