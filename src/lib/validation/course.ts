import { z } from "zod";

export const courseSchema = z.object({
  division_id: z.string().uuid(),
  name: z.string().min(3).max(100),
  slug: z.string().min(3).max(50).regex(/^[a-z0-9-]+$/, "Hanya lowercase, angka, strip"),
  description: z.string().max(500).optional().nullable(),
  is_published: z.boolean().default(false),
  scheduled_at: z.string().datetime({ offset: true }).nullable().optional(),
  estimated_duration: z.coerce.number().int().min(1).max(10000).nullable().optional(),
});

export const courseUpdateSchema = courseSchema.partial();
export type CourseInput = z.infer<typeof courseSchema>;
