import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { blogFields, validUpdatedDate } from './lib/blog-schema';

const blog = defineCollection({
  // Preserve independent entries so duplicate explicit slugs can fail the build instead of overwriting a post.
  loader: glob({
    pattern: '**/*.md',
    base: './src/content/blog',
    generateId: ({ entry }) => entry.replace(/\.md$/, ''),
  }),
  schema: ({ image }) =>
    blogFields
      .extend({ featuredImage: image().optional() })
      .refine(validUpdatedDate, {
        message: 'updatedDate must not precede pubDate',
        path: ['updatedDate'],
      })
      .refine((data) => Boolean(data.featuredImage) === Boolean(data.imageAlt), {
        message: 'Supply both featuredImage and descriptive imageAlt, or omit both',
        path: ['imageAlt'],
      }),
});
export const collections = { blog };
