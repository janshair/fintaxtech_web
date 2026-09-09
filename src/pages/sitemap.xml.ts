import { indexablePaths } from '../content/seo';
import { company } from '../content/site';
import { getPublishedPosts } from '../lib/blog';
import { postURL } from '../lib/blog-posts';
export async function GET() {
  const paths = [...indexablePaths, ...(await getPublishedPosts()).map(postURL)];
  return new Response(
    `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${paths.map((p) => `<url><loc>${company.url}${p}</loc></url>`).join('')}</urlset>`,
    { headers: { 'Content-Type': 'application/xml' } },
  );
}
