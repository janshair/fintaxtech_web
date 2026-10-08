import { getCollection } from 'astro:content';
import { activeJobs } from './job-posts';
export const getActiveJobs = async () => activeJobs(await getCollection('jobs'));
