import type { JobData } from './job-schema';
import { careersCopy } from '../content/careers';
import { company } from '../content/site';
import { jobApplication } from './job-posts';

export interface JobSEO extends JobData {
  descriptionHTML: string;
}

export function jobStructuredData(path: string, job?: JobSEO) {
  if (!job?.active || !path.startsWith(careersCopy.route) || path === careersCopy.route)
    return undefined;
  const url = new URL(path, company.url).href;
  const { href, subject } = jobApplication(job.title);
  const subjectHTML = subject
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');
  return {
    '@type': 'JobPosting',
    '@id': `${url}#job`,
    url,
    title: job.title,
    description: `${job.descriptionHTML}<p>${careersCopy.application}<a href="${href}">${company.email}</a>${careersCopy.applicationSubjectLine}<br> <strong>${subjectHTML}</strong><br> ${careersCopy.applicationWarning}</p>`,
    datePosted: job.publishedDate.toISOString().slice(0, 10),
    hiringOrganization: { '@id': `${company.url}/#organization` },
    mainEntityOfPage: { '@id': `${url}#webpage` },
    ...(job.jobLocation
      ? {
          jobLocation: {
            '@type': 'Place',
            name: job.location,
            address: {
              '@type': 'PostalAddress',
              addressLocality: job.jobLocation.locality,
              addressRegion: job.jobLocation.region,
              addressCountry: job.jobLocation.country,
            },
          },
        }
      : {}),
    ...(job.employmentType ? { employmentType: job.employmentType } : {}),
    ...(job.closingDate ? { validThrough: job.closingDate.toISOString().slice(0, 10) } : {}),
  };
}
