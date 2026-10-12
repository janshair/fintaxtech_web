import { logoBriefSections } from '../content/logo-brief';
import {
  canonicalLogoSubmission,
  formatLogoBrief,
  type LogoSubmission,
} from '../lib/logo-brief/submission';
import { emptyBrief, limits } from '../lib/client-brief/rules';
import { SubmissionError } from './website-brief-validation';
const record = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === 'object' && !Array.isArray(value);
const text = (value: unknown, max: number = limits.long): value is string =>
  typeof value === 'string' &&
  value.length <= max &&
  !/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(value);
const keys = (value: Record<string, unknown>, allowed: string[]) =>
  Object.keys(value).every((key) => allowed.includes(key));

export function validateLogoSubmission(input: unknown): LogoSubmission {
  if (
    !record(input) ||
    !keys(input, ['kind', 'state', 'completedAt', 'txt', 'submissionId', 'trap']) ||
    input.kind !== 'logo' ||
    input.trap !== '' ||
    !text(input.completedAt, 30) ||
    !text(input.txt, 100000) ||
    !record(input.state)
  )
    throw new SubmissionError('invalid');
  const source = input.state;
  if (
    !keys(source, ['answers', 'competitors', 'images', 'rows', 'additionalPages']) ||
    !record(source.answers) ||
    !Array.isArray(source.competitors) ||
    source.competitors.length > limits.competitors ||
    !Array.isArray(source.images) ||
    source.images.length > limits.images + 1 ||
    !record(source.rows) ||
    Object.keys(source.rows).length ||
    !Array.isArray(source.additionalPages) ||
    source.additionalPages.length
  )
    throw new SubmissionError('invalid');
  const fields = logoBriefSections.flatMap((section) => section.fields);
  if (
    !keys(
      source.answers,
      fields.flatMap((field) => [field.id, `${field.id}Other`]),
    )
  )
    throw new SubmissionError('invalid');
  const state = emptyBrief();
  for (const [id, answer] of Object.entries(source.answers)) {
    if (
      text(answer) ||
      (id === 'nameConfirmed' && typeof answer === 'boolean') ||
      (Array.isArray(answer) &&
        answer.length <= 30 &&
        answer.every((value) => text(value, limits.short)) &&
        new Set(answer).size === answer.length)
    )
      state.answers[id] = answer;
    else throw new SubmissionError('invalid');
  }
  state.competitors = source.competitors.map((item, index) => {
    if (
      !record(item) ||
      !keys(item, ['id', 'name', 'website']) ||
      !text(item.name, limits.short) ||
      !text(item.website, limits.short)
    )
      throw new SubmissionError('invalid');
    return { id: String(index), name: item.name, website: item.website };
  });
  state.images = source.images.map((image, index) => {
    if (
      !record(image) ||
      !keys(image, ['id', 'data', 'filename', 'purpose', 'width', 'height', 'explanation']) ||
      image.data !== '' ||
      !text(image.filename, 255) ||
      !image.filename.trim() ||
      !text(image.explanation, limits.short) ||
      (image.purpose !== undefined && image.purpose !== 'current-logo') ||
      typeof image.width !== 'number' ||
      typeof image.height !== 'number' ||
      !Number.isInteger(image.width) ||
      !Number.isInteger(image.height) ||
      image.width < 1 ||
      image.height < 1 ||
      image.width > limits.imageSide ||
      image.height > limits.imageSide
    )
      throw new SubmissionError('invalid');
    return {
      id: String(index),
      data: '',
      filename: image.filename,
      purpose: image.purpose,
      width: image.width,
      height: image.height,
      explanation: image.explanation,
    };
  });
  let canonical: LogoSubmission;
  try {
    canonical = canonicalLogoSubmission(state, input.completedAt);
  } catch {
    throw new SubmissionError('incomplete');
  }
  // Never forward client-supplied text without checking it against server-validated answers.
  if (formatLogoBrief(canonical) !== input.txt) throw new SubmissionError('invalid');
  return canonical;
}
