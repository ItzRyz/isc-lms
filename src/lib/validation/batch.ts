import { z } from "zod";

export const batchSchema = z.object({
  name: z.string().min(3).max(100),
  slug: z.string().min(3).max(50).regex(/^[a-z0-9-]+$/, "Hanya lowercase, angka, strip"),
  year: z.coerce.number().int().min(2000).max(2100),
  description: z.string().max(500).optional().nullable(),
  is_active: z.boolean().default(true),
});

export const batchUpdateSchema = batchSchema.partial();
export type BatchInput = z.infer<typeof batchSchema>;
