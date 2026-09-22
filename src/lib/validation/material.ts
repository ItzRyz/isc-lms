import { z } from "zod";

export const materialTypeEnum = z.enum(["DOCUMENT", "EXTERNAL_LINK", "VIDEO", "ASSIGNMENT_REF", "QUIZ_REF"]);

export const materialSchema = z.object({
  module_id: z.string().uuid(),
  course_id: z.string().uuid(),
  title: z.string().min(3).max(150),
  type: materialTypeEnum,
  content_url: z.string().url().nullable().optional(),
  storage_path: z.string().nullable().optional(),
  assignment_id: z.string().uuid().nullable().optional(),
  quiz_id: z.string().uuid().nullable().optional(),
  is_published: z.boolean().default(false),
  scheduled_at: z.string().datetime({ offset: true }).nullable().optional(),
  estimated_duration: z.coerce.number().int().min(1).max(10000).nullable().optional(),
  visibility: z.enum(["PUBLIC", "ENROLLED"]).default("ENROLLED"),
  prerequisite_ids: z.array(z.string().uuid()).max(5).optional(),
  tags: z.array(z.string().regex(/^[a-z0-9-]+$/)).max(10).optional(),
});

export const materialUpdateSchema = materialSchema.partial();
export type MaterialInput = z.infer<typeof materialSchema>;
