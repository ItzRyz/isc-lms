import { z } from "zod";

export const classSchema = z.object({
  division_id: z.string().uuid(),
  academic_period_id: z.string().uuid().nullable().optional(),
  name: z.string().min(3).max(100),
  slug: z.string().min(3).max(50).regex(/^[a-z0-9-]+$/, "Hanya lowercase, angka, strip"),
  is_active: z.boolean().default(true),
});

export const classUpdateSchema = classSchema.partial().extend({
  name: z.string().min(3).max(100).optional(),
  slug: z.string().min(3).max(50).regex(/^[a-z0-9-]+$/).optional(),
});

export type ClassInput = z.infer<typeof classSchema>;
