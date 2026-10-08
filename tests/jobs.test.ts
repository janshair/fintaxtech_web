import { describe, it, expect } from 'vitest';
import { jobFields } from '../src/lib/job-schema';
import { activeJobs, jobURL } from '../src/lib/job-posts';
import { jobStructuredData } from '../src/lib/job-seo';
import { breadcrumbs } from '../src/lib/seo';

const fields = {
  title: 'Front-End Developer',
  summary: 'Build accessible static websites using Astro.',
  location: 'Remote or Dundee, Scotland',
  active: true,
  publishedDate: new Date('2026-10-07'),
};
const entry = (id: string, active = true, publishedDate = '2026-10-07') => ({
  id,
  data: { ...fields, active, publishedDate: new Date(publishedDate) },
});
describe('careers publishing', () => {
  it('requires an explicit Boolean active and valid frontmatter', () => {
    for (const active of [undefined, null, 'true', 'false', 0, 1])
      expect(jobFields.safeParse({ ...fields, active }).success).toBe(false);
    for (const active of [true, false])
      expect(jobFields.parse({ ...fields, active }).active).toBe(active);
    for (const override of [
      { title: '' },
      { summary: '' },
      { location: '' },
      { publishedDate: 'invalid' },
      { publishedDate: null },
      { publishedDate: undefined },
      { employmentType: '' },
      { closingDate: '2026-10-06' },
    ])
      expect(jobFields.safeParse({ ...fields, ...override }).success).toBe(false);
    expect(
      jobFields.parse({
        ...fields,
        department: 'Development',
        employmentType: 'PART_TIME',
        closingDate: '2026-11-01',
      }).closingDate,
    ).toBeInstanceOf(Date);
  });
  it('only publishes active jobs, newest first, without mutating the collection', () => {
    const input = [entry('older', true, '2026-01-01'), entry('inactive', false), entry('newest')];
    expect(activeJobs(input).map(jobURL)).toEqual(['/careers/newest/', '/careers/older/']);
    expect(input.map((job) => job.id)).toEqual(['older', 'inactive', 'newest']);
    expect(activeJobs([entry('inactive', false)])).toEqual([]);
    expect(activeJobs([])).toEqual([]);
    expect(() => activeJobs([entry('../private')])).toThrow();
    expect(() => activeJobs([entry('same'), entry('same')])).toThrow();
  });
  it('adds factual JobPosting metadata only to active detail pages', () => {
    const job = {
      ...fields,
      descriptionHTML: '<h2>Role</h2><p>Build accessible pages.</p>',
      jobLocation: { locality: 'Dundee', region: 'Scotland', country: 'GB' },
    };
    expect(
      jobStructuredData('/careers/frontend-developer/', { ...job, active: false }),
    ).toBeUndefined();
    expect(jobStructuredData('/careers/', job)).toBeUndefined();
    const schema = jobStructuredData('/careers/frontend-developer/', job)!;
    expect(schema).toMatchObject({
      '@type': 'JobPosting',
      title: fields.title,
      datePosted: '2026-10-07',
      jobLocation: { address: { addressLocality: 'Dundee', addressCountry: 'GB' } },
    });
    expect(schema.description).toContain(job.descriptionHTML);
    expect(schema.description).toContain('mailto:ask@fintaxtech.co.uk');
    for (const key of [
      'baseSalary',
      'employmentType',
      'validThrough',
      'jobLocationType',
      'applicantLocationRequirements',
    ])
      expect(schema).not.toHaveProperty(key);
    expect(breadcrumbs('/careers/frontend-developer/', fields.title).map((c) => c.url)).toEqual([
      'https://fintaxtech.co.uk/',
      'https://fintaxtech.co.uk/careers/',
      'https://fintaxtech.co.uk/careers/frontend-developer/',
    ]);
  });
});
