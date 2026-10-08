import { z } from 'astro/zod';

const requiredText = z.string().trim().min(1);
const date = z.union([requiredText, z.date()]).pipe(z.coerce.date());
export const jobFields = z
  .object({
    title: requiredText,
    summary: requiredText.min(20),
    location: requiredText,
    active: z.boolean(),
    publishedDate: date,
    department: requiredText.optional(),
    employmentType: z
      .enum([
        'FULL_TIME',
        'PART_TIME',
        'CONTRACTOR',
        'TEMPORARY',
        'INTERN',
        'VOLUNTEER',
        'PER_DIEM',
        'OTHER',
      ])
      .optional(),
    closingDate: date.optional(),
    // Optional factual address for search engines; never infer eligibility from the display label.
    jobLocation: z
      .object({
        locality: requiredText,
        region: requiredText,
        country: z.string().regex(/^[A-Z]{2}$/),
      })
      .optional(),
  })
  .refine((data) => !data.closingDate || data.closingDate >= data.publishedDate, {
    message: 'closingDate must not precede publishedDate',
    path: ['closingDate'],
  });
export type JobData = z.infer<typeof jobFields>;
