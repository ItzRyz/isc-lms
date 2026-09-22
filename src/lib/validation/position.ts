import { z } from "zod";

export const positionSchema = z.object({
  name: z.string().min(3).max(50),
  slug: z.string().min(3).max(50).regex(/^[a-z0-9-]+$/, "Hanya lowercase, angka, strip"),
  description: z.string().max(500).optional().nullable(),
  is_active: z.boolean().default(true),
});

export const positionUpdateSchema = positionSchema.partial();
export type PositionInput = z.infer<typeof positionSchema>;
