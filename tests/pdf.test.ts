import { afterEach, it, expect, vi } from 'vitest';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import type { Journey } from '../src/lib/types';
const state = vi.hoisted(() => ({ status: 'available' }));
vi.mock('../src/content/promo', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../src/content/promo')>()),
  get promoStatus() {
    return state.status;
  },
}));
afterEach(() => vi.unstubAllGlobals());
const journey: Journey = {
  service: 'websites',
  stage: '1',
  short: false,
  promo: true,
  answers: {
    'promo-uk': 'Yes',
    'promo-recent': 'Yes',
    'promo-website': 'No',
    'websites-1-1': 'New business website',
    'websites-1-9': 'A clear and accessible website.',
  },
};
async function create(status: string, answers = journey.answers) {
  state.status = status;
  vi.stubGlobal('fetch', async (path: string) => new Response(await readFile(`public${path}`)));
  const { createPDF, supportsSecurePasswordProtection } = await import('../src/lib/pdf');
  expect(supportsSecurePasswordProtection).toBe(false);
  const blob = await createPDF({
    journey: { ...journey, answers },
    customer: [
      { label: 'Company name', value: 'Example Testing Ltd' },
      { label: 'UK company number', value: 'SC123456' },
    ],
  });
  const buffer = Buffer.from(await blob.arrayBuffer());
  expect(buffer.subarray(0, 5).toString()).toBe('%PDF-');
  await mkdir('test-results/pdf-unit', { recursive: true });
  await writeFile(`test-results/pdf-unit/${status}.pdf`, buffer);
  return buffer;
}
it('generates a real active campaign PDF using local assets', async () => {
  expect((await create('available')).length).toBeGreaterThan(10000);
});
it('final-place status still allows a PDF without guaranteeing availability', async () => {
  expect((await create('final-place')).length).toBeGreaterThan(10000);
});
it('closed status removes campaign content from a stale journey', async () => {
  const active = await create('available');
  const closed = await create('closed');
  expect(closed.length).toBeLessThan(active.length);
});
it('unsupported customer glyphs fail instead of corrupting the PDF', async () => {
  await expect(create('closed', { 'websites-1-9': 'Unsupported: 🪿' })).rejects.toThrow(
    'Unsupported PDF glyph',
  );
});
