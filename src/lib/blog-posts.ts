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

// Posts to suggest under an article: the same category first, then the newest of the rest.
export function relatedPosts<T extends PostSummary & { data: { category: string } }>(
  current: T,
  published: T[],
  limit = 2,
): T[] {
  const others = published.filter((post) => post.id !== current.id);
  return [
    ...others.filter((post) => post.data.category === current.data.category),
    ...others.filter((post) => post.data.category !== current.data.category),
  ].slice(0, limit);
}

// Search results cut titles off at about 60 characters, so the brand is only added when it fits.
export const searchTitle = (title: string, brand: string) =>
  `${title} | ${brand}`.length <= 60 ? `${title} | ${brand}` : title;

export const formatPostDate = (date: Date) =>
  new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(date);
