import { afterEach, expect, it, vi } from 'vitest';
import { readFile } from 'node:fs/promises';
import sharp from 'sharp';
import { completeLogoBrief } from './fixtures/logo-brief';
import {
  LOGO_BRIEF_SCHEMA_VERSION,
  canonicalLogoSubmission,
  createLogoOutputs,
  formatLogoBrief,
  logoSubmissionMetadata,
} from '../src/lib/logo-brief/submission';
import { createLogoBriefPDF } from '../src/lib/logo-brief/pdf';
import { slackLogoParts } from '../src/server/logo-brief-format';
import { validateLogoSubmission } from '../src/server/logo-brief-validation';

const delivery = 'Included in client PDF; not included in this Slack message';
const section = (text: string, name: string) => text.split(`[${name}]\n`)[1].split('\n\n')[0];
afterEach(() => vi.unstubAllGlobals());

function submission(redesign: boolean, current: boolean, references: number) {
  const state = completeLogoBrief();
  state.answers.project = redesign ? 'Complete redesign' : 'New brand';
  if (redesign) {
    state.answers.identityProblems = 'The current lettering is hard to read.';
    state.answers.identityImprovements = 'Make the lettering easier to read.';
  }
  state.answers.references = references ? 'Yes' : 'No';
  if (current)
    state.images.push({
      id: 'current',
      purpose: 'current-logo',
      filename: 'current-logo.png',
      data: 'CURRENT_IMAGE_BINARY',
      width: 30,
      height: 20,
      explanation: '',
    });
  for (let i = 0; i < references; i++)
    state.images.push({
      id: `ref-${i}`,
      filename: `reference-${i + 1}.png`,
      data: `REFERENCE_IMAGE_BINARY_${i}`,
      width: 40,
      height: 20,
      explanation: `Reference ${i + 1} has clear lettering and balanced spacing.`,
    });
  return canonicalLogoSubmission(state, '2026-10-12T12:00:00.000Z');
}

it('adds the exported brief schema version and clean asset status for a new brand without images', () => {
  expect(LOGO_BRIEF_SCHEMA_VERSION).toBe('fintaxtech-logo-brief-v2');
  const txt = formatLogoBrief(submission(false, false, 0));
  expect(txt).toContain(
    `[PROJECT]\nBrief schema version:\n  ${LOGO_BRIEF_SCHEMA_VERSION}\nProject type:\n  New brand`,
  );
  expect(section(txt, 'ASSETS')).toBe(
    'Current logo supplied:\n  Not applicable\nReference images supplied:\n  No',
  );
  expect(txt).not.toContain('Current logo filename:');
});

it('describes new-brand reference availability without suggesting that the image is attached', () => {
  const txt = formatLogoBrief(submission(false, false, 2));
  expect(section(txt, 'ASSETS')).toBe(
    `Current logo supplied:\n  Not applicable\nReference images supplied:\n  Yes\nReference image count:\n  2\nReference images delivery:\n  ${delivery}`,
  );
  expect(txt).not.toContain('Current logo filename:');
});

it('describes a redesign with no current logo without adding a filename or delivery line', () => {
  const txt = formatLogoBrief(submission(true, false, 0));
  expect(section(txt, 'ASSETS')).toBe(
    'Current logo supplied:\n  No\nReference images supplied:\n  No',
  );
  expect(txt).not.toContain('Current logo filename:');
  expect(txt).not.toContain('Current logo delivery:');
});

it('reports the current logo filename and delivery for a redesign', () => {
  const txt = formatLogoBrief(submission(true, true, 0));
  expect(section(txt, 'ASSETS')).toBe(
    `Current logo supplied:\n  Yes\nCurrent logo filename:\n  current-logo.png\nCurrent logo delivery:\n  ${delivery}\nReference images supplied:\n  No`,
  );
});

it('keeps multiple reference names and explanations in REFERENCES and availability only in ASSETS', () => {
  const canonical = submission(true, true, 3);
  const txt = formatLogoBrief(canonical);
  const assets = section(txt, 'ASSETS');
  expect(assets).toContain('Current logo filename:\n  current-logo.png');
  expect(assets).toContain('Reference image count:\n  3');
  expect(assets.split(delivery)).toHaveLength(3);
  expect(assets).not.toContain('explanation:');
  for (const image of canonical.state.images.filter((image) => !image.purpose)) {
    expect(section(txt, 'REFERENCES')).toContain(image.filename);
    expect(section(txt, 'REFERENCES')).toContain(image.explanation);
    expect(assets).not.toContain(image.explanation);
  }
  expect(txt.indexOf('[ASSETS]')).toBeGreaterThan(txt.indexOf('[REFERENCES]'));
  expect(txt.indexOf('[ASSETS]')).toBeLessThan(txt.indexOf('[COLOUR]'));
});

it('includes schema and assets in the validated Slack text without any image binaries', () => {
  const canonical = submission(true, true, 2);
  const metadata = logoSubmissionMetadata(canonical);
  const txt = formatLogoBrief(canonical);
  const validated = validateLogoSubmission({ ...metadata, txt, trap: '' });
  const parts = slackLogoParts(validated, 'test-id');
  expect(parts[0].text).toMatch(
    /^New FinTaxTech Brand Brief\n\nClient: Example business\nProject: Complete redesign\nSubmission ID: test-id\n/,
  );
  expect(parts[0].text).toContain(`Brief schema version:\n  ${LOGO_BRIEF_SCHEMA_VERSION}`);
  expect(parts[0].text).toContain(`[ASSETS]\n${section(txt, 'ASSETS')}`);
  const wire = JSON.stringify({ ...metadata, txt });
  expect(metadata.state.images.every((image) => image.data === '')).toBe(true);
  for (const output of [wire, JSON.stringify(parts)]) {
    expect(output).not.toMatch(/CURRENT_IMAGE_BINARY|REFERENCE_IMAGE_BINARY|data:image|base64/);
    expect(output).not.toContain('SLACK_WEBHOOK');
  }
});

it('keeps PDF output identical to the existing generator and embeds current-logo and reference images', async () => {
  const canonical = submission(true, true, 2);
  // Use distinct real images so the PDF cannot deduplicate the three supplied assets.
  for (const [index, image] of canonical.state.images.entries()) {
    const jpeg = await sharp({
      create: {
        width: image.width,
        height: image.height,
        channels: 3,
        background: ['#123456', '#789abc', '#abcdef'][index],
      },
    })
      .jpeg()
      .toBuffer();
    image.data = `data:image/jpeg;base64,${jpeg.toString('base64')}`;
  }
  vi.stubGlobal('fetch', async (path: string) => new Response(await readFile(`public${path}`)));
  const before = structuredClone(canonical);
  const outputs = await createLogoOutputs(canonical);
  const unchanged = await createLogoBriefPDF(canonical.state, new Date(canonical.completedAt));
  const normalize = async (blob: Blob) =>
    Buffer.from(await blob.arrayBuffer())
      .toString('latin1')
      .replace(/\/ID\s*\[[^\]]+\]/g, '/ID []')
      .replace(/\/CreationDate\s*\([^)]*\)/g, '/CreationDate ()');
  const pdf = await normalize(outputs.pdf);
  expect(pdf.startsWith('%PDF-')).toBe(true);
  expect(pdf.match(/\/Subtype \/Image/g)?.length).toBeGreaterThanOrEqual(4); // Brand mark + 3 client images.
  expect(pdf).toBe(await normalize(unchanged));
  expect(canonical).toEqual(before);
  expect(outputs.txt).toContain('[ASSETS]');
});
