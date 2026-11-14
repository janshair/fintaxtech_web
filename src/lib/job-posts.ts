import { careersCopy } from '../content/careers';
import { company } from '../content/site';

interface JobSummary {
  id: string;
  data: { active: boolean; publishedDate: Date };
}
export function jobSlug(job: { id: string }) {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(job.id)) throw new Error(`Invalid job slug: ${job.id}`);
  return job.id;
}
export const jobURL = (job: { id: string }) => `${careersCopy.route}${jobSlug(job)}/`;

export function jobApplication(title: string) {
  const subject = `CV[Fintaxtech-Web]: ${title}`;
  return { subject, href: `mailto:${company.email}?subject=${encodeURIComponent(subject)}` };
}

// Listing, static routes and sitemap must all use this exact selection.
export function activeJobs<T extends JobSummary>(jobs: T[]): T[] {
  const active = jobs.filter((job) => job.data.active === true);
  const paths = active.map(jobURL);
  if (new Set(paths).size !== paths.length) throw new Error('Active job slugs must be unique');
  return active.sort(
    (a, b) =>
      b.data.publishedDate.getTime() - a.data.publishedDate.getTime() || a.id.localeCompare(b.id),
  );
}
