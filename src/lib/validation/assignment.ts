import { z } from "zod";

export const assignmentSchema = z.object({
  course_id: z.string().uuid(),
  module_id: z.string().uuid().nullable().optional(),
  title: z.string().min(3).max(150),
  description: z.string().max(2000).optional().nullable(),
  type: z.enum(["INDIVIDUAL", "GROUP"]).default("INDIVIDUAL"),
  submission_type: z.enum(["FILE", "TEXT", "FILE_AND_TEXT"]).default("FILE_AND_TEXT"),
  due_at: z.string().datetime({ offset: true }).nullable().optional(),
  allow_late: z.boolean().default(true),
  max_score: z.coerce.number().int().min(1).max(1000).default(100),
  max_attempts: z.coerce.number().int().min(1).max(10).default(1),
  is_published: z.boolean().default(false),
});

export const assignmentUpdateSchema = assignmentSchema.partial();
export type AssignmentInput = z.infer<typeof assignmentSchema>;

export const submissionSchema = z.object({
  assignment_id: z.string().uuid(),
  content_text: z.string().max(10000).optional().nullable(),
  // files handled separately via storage
});

export const gradeSchema = z.object({
  submission_id: z.string().uuid(),
  score: z.coerce.number().int().min(0).max(1000),
  feedback: z.string().max(5000).optional().nullable(),
  status: z.enum(["GRADED", "REVISION_REQUIRED"]).default("GRADED"),
  rubric_scores: z.array(z.object({ rubric_item_id: z.string().uuid(), points: z.number().int().min(0) })).optional(),
});

export type GradeInput = z.infer<typeof gradeSchema>;
