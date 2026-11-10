import { describe, expect, it } from 'vitest';
import { strFromU8, unzipSync } from 'fflate';
import { completeLogoBrief } from './fixtures/logo-brief';
import { canonicalLogoSubmission, formatLogoBrief } from '../src/lib/logo-brief/submission';
import { createLogoBriefDownload, logoBriefDownloadName } from '../src/lib/logo-brief/download';

const date = '2026-11-09T12:00:00.000Z';
const reference = (file: File, purpose?: 'current-logo') => ({
  id: crypto.randomUUID(),
  filename: file.name,
  purpose,
  data: 'data:image/jpeg;base64,resized-preview',
  width: 100,
  height: 100,
  explanation: purpose ? '' : 'Clear lettering with generous space.',
});

describe('local logo brief download', () => {
  it('downloads lossless Unicode TXT from the reviewed snapshot without requiring a PDF', async () => {
    const state = completeLogoBrief();
    state.answers.trading = 'Café & Co / Dundee';
    state.answers.anything = 'Original notes 🙂\n你好 — keep this exact text.';
    const submission = canonicalLogoSubmission(state, date);
    state.answers.anything = 'Edited after review';
    const result = await createLogoBriefDownload(submission, []);
    expect(result.filename).toBe('cafe-and-co-dundee-fintaxtech-logo-brief.txt');
    expect(result.blob.type).toBe('text/plain;charset=utf-8');
    expect(await result.blob.text()).toBe(formatLogoBrief(submission));
    expect(await result.blob.text()).toContain('Original notes 🙂\n  你好');
    expect(await result.blob.text()).not.toContain('Edited after review');
  });

  it('includes exact original bytes, both image roles, duplicate filenames and a TXT manifest in ZIP', async () => {
    const state = completeLogoBrief();
    Object.assign(state.answers, {
      project: 'Complete redesign',
      identityProblems: 'The current mark is hard to read.',
      identityImprovements: 'Improve the lettering.',
      references: 'Yes',
      trading: 'Acme Studio',
    });
    const files = [
      new File([new Uint8Array([137, 80, 78, 71, 1])], 'same.png', { type: 'image/png' }),
      new File([new Uint8Array([137, 80, 78, 71, 2])], 'same.png', { type: 'image/png' }),
      new File([new Uint8Array([255, 216, 255, 3])], '../private\\same.jpg', {
        type: 'image/jpeg',
      }),
    ];
    state.images = files.map((file, i) => reference(file, i === 0 ? 'current-logo' : undefined));
    const submission = canonicalLogoSubmission(state, date);
    const result = await createLogoBriefDownload(submission, files);
    expect(result.filename).toBe('acme-studio-fintaxtech-logo-brief.zip');
    expect(result.blob.type).toBe('application/zip');
    const entries = unzipSync(new Uint8Array(await result.blob.arrayBuffer()));
    const paths = [
      'attachments/1-current-logo-same.png',
      'attachments/2-reference-same.png',
      'attachments/3-reference-same.jpg',
    ];
    expect(Object.keys(entries).sort()).toEqual(
      [...paths, 'acme-studio-fintaxtech-logo-brief.txt'].sort(),
    );
    for (const [index, path] of paths.entries())
      expect(entries[path]).toEqual(new Uint8Array(await files[index].arrayBuffer()));
    const text = strFromU8(entries['acme-studio-fintaxtech-logo-brief.txt']);
    expect(text.startsWith(formatLogoBrief(submission))).toBe(true);
    for (const path of paths) expect(text).toContain(path);
    expect(text).toContain('Clear lettering with generous space.');
    expect(text).not.toContain('resized-preview');
  });

  it('uses ZIP when only a current logo is attached and rejects missing or mismatched originals', async () => {
    const state = completeLogoBrief();
    Object.assign(state.answers, {
      project: 'Complete redesign',
      identityProblems: 'The current mark is hard to read.',
      identityImprovements: 'Improve the lettering.',
    });
    const file = new File(['original'], 'current.png', { type: 'image/png' });
    state.images = [reference(file, 'current-logo')];
    const submission = canonicalLogoSubmission(state, date);
    expect((await createLogoBriefDownload(submission, [file])).filename).toMatch(/\.zip$/);
    await expect(createLogoBriefDownload(submission, [])).rejects.toThrow('Missing');
    await expect(createLogoBriefDownload(submission, [undefined])).rejects.toThrow('Missing');
    await expect(
      createLogoBriefDownload(submission, [new File(['x'], 'wrong.png')]),
    ).rejects.toThrow('Missing');
  });

  it('keeps international customer names and bounds filename bytes safely', () => {
    const state = completeLogoBrief();
    state.answers.trading = '客户设计';
    const submission = canonicalLogoSubmission(state, date);
    expect(logoBriefDownloadName(submission)).toBe('客户设计-fintaxtech-logo-brief');
    submission.state.answers.trading = '😀 / ..';
    expect(logoBriefDownloadName(submission)).toBe('customer-fintaxtech-logo-brief');
    submission.state.answers.trading = '设计'.repeat(100);
    expect(
      new TextEncoder().encode(`${logoBriefDownloadName(submission)}.zip`).length,
    ).toBeLessThan(120);
  });
});
