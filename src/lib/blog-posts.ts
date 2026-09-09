import { slugSchema } from './blog-schema';

interface PostSummary {
  id: string;
  data: { draft: boolean; pubDate: Date; slug?: string };
}
export const postSlug = (post: { id: string; data: { slug?: string } }) =>
  slugSchema.parse(post.data.slug ?? post.id);
export const postURL = (post: { id: string; data: { slug?: string } }) =>
  `/blog/${postSlug(post)}/`;

// All public consumers use this selection, including static routes, RSS and sitemap.
export function publishedPosts<T extends PostSummary>(posts: T[]): T[] {
  const published = posts.filter((post) => !post.data.draft);
  const urls = published.map(postURL);
  if (new Set(urls).size !== urls.length) throw new Error('Published blog slugs must be unique');
  return published.sort(
    (a, b) => b.data.pubDate.getTime() - a.data.pubDate.getTime() || a.id.localeCompare(b.id),
  );
}

export const formatPostDate = (date: Date) =>
  new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(date);
