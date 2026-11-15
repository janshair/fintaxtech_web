import { z } from 'astro/zod';

export const slugSchema = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
export const blogFields = z.object({
  title: z.string().trim().min(1),
  seoTitle: z.string().trim().min(1).optional(),
  description: z.string().trim().min(20),
  pubDate: z.coerce.date(),
  updatedDate: z.coerce.date().optional(),
  author: z.string().trim().min(1),
  category: z.string().trim().min(1),
  tags: z.array(z.string().trim().min(1)),
  imageAlt: z.string().trim().min(1).optional(),
  // A short, direct answer to the article's main question, shown first and used by answer engines.
  summary: z.string().trim().min(20).optional(),
  // Questions the headings do not already answer; shown at the end and published as FAQPage data.
  faqs: z
    .array(z.object({ question: z.string().trim().min(5), answer: z.string().trim().min(10) }))
    .default([]),
  slug: slugSchema.optional(),
  draft: z.boolean().default(true),
  cta: z.enum(['mobile-apps', 'general']).default('general'),
});

export function validUpdatedDate(data: { pubDate: Date; updatedDate?: Date }) {
  return !data.updatedDate || data.updatedDate >= data.pubDate;
}
