import { z } from 'astro/zod';

export const slugSchema = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
export const blogFields = z.object({
  title: z.string().trim().min(1),
  description: z.string().trim().min(20),
  pubDate: z.coerce.date(),
  updatedDate: z.coerce.date().optional(),
  author: z.string().trim().min(1),
  category: z.string().trim().min(1),
  tags: z.array(z.string().trim().min(1)),
  imageAlt: z.string().trim().min(1).optional(),
  slug: slugSchema.optional(),
  draft: z.boolean().default(true),
  cta: z.enum(['mobile-apps', 'general']).default('general'),
});

export function validUpdatedDate(data: { pubDate: Date; updatedDate?: Date }) {
  return !data.updatedDate || data.updatedDate >= data.pubDate;
}
