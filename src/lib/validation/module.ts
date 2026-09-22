import { z } from "zod";

export const moduleSchema = z.object({
  course_id: z.string().uuid(),
  title: z.string().min(3).max(100),
  order_index: z.coerce.number().int().min(1).max(100),
  is_published: z.boolean().default(false),
});

export const moduleUpdateSchema = moduleSchema.partial();
export type ModuleInput = z.infer<typeof moduleSchema>;
