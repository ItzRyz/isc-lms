import { z } from "zod";

export const divisionSchema = z.object({
  name: z.string().min(3, "Min 3 karakter").max(100),
  slug: z
    .string()
    .min(3)
    .max(50)
    .regex(/^[a-z0-9-]+$/, "Hanya lowercase, angka, strip"),
  description: z.string().max(500).optional().nullable(),
  is_active: z.boolean().default(true),
});

export const divisionUpdateSchema = divisionSchema.partial();

export const divisionQuerySchema = z.object({
  search: z.string().optional(),
  is_active: z.coerce.boolean().optional(),
  page: z.coerce.number().int().min(1).default(1),
  perPage: z.coerce.number().int().min(1).max(100).default(10),
});

export type DivisionInput = z.infer<typeof divisionSchema>;
export type DivisionUpdateInput = z.infer<typeof divisionUpdateSchema>;
