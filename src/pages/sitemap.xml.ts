import { indexablePaths } from '../content/seo';
import { canonicalURL } from '../lib/seo';
import { getPublishedPosts } from '../lib/blog';
import { postURL } from '../lib/blog-posts';
import { getActiveJobs } from '../lib/jobs';
import { jobURL } from '../lib/job-posts';
export async function GET() {
  const paths = [
    ...indexablePaths,
    ...(await getPublishedPosts()).map(postURL),
    ...(await getActiveJobs()).map(jobURL),
  ];
  const urls = [...new Set(paths.map(canonicalURL))];
  return new Response(
    `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls.map((url) => `<url><loc>${url}</loc></url>`).join('')}</urlset>`,
    { headers: { 'Content-Type': 'application/xml' } },
  );
}
