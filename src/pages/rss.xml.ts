import rss from '@astrojs/rss';
import { company } from '../content/site';
import { blogCopy } from '../content/blog';
import { getPublishedPosts } from '../lib/blog';
import { postURL } from '../lib/blog-posts';

export async function GET() {
  return rss({
    title: blogCopy.feedTitle,
    description: blogCopy.description,
    site: company.url,
    customData: '<language>en-GB</language>',
    items: (await getPublishedPosts()).map((post) => ({
      title: post.data.title,
      description: post.data.description,
      pubDate: post.data.pubDate,
      categories: [post.data.category, ...post.data.tags],
      link: postURL(post),
    })),
  });
}
