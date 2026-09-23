import { z } from "zod";

export const gradeSchema = z.object({
  user_id: z.string().uuid(),
  academic_period_id: z.string().uuid().nullable().optional(),
  course_id: z.string().uuid().nullable().optional(),
  component_id: z.string().uuid(),
  score: z.coerce.number().min(0).max(1000),
  max_score: z.coerce.number().min(1).max(1000).default(100),
});

export const gradeWeightSchema = z.object({
  academic_period_id: z.string().uuid().nullable().optional(),
  course_id: z.string().uuid().nullable().optional(),
  division_id: z.string().uuid().nullable().optional(),
  component_id: z.string().uuid(),
  weight: z.coerce.number().min(0).max(100),
});

export const kkmSchema = z.object({
  course_id: z.string().uuid().nullable().optional(),
  academic_period_id: z.string().uuid().nullable().optional(),
  kkm_score: z.coerce.number().min(0).max(100),
});

export const rankingPeriodSchema = z.object({
  name: z.string().min(3).max(100),
  type: z.enum(["MONTHLY", "SEMESTER"]),
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  division_id: z.string().uuid().nullable().optional(),
  academic_period_id: z.string().uuid().nullable().optional(),
  status: z.enum(["ACTIVE", "CLOSED", "ARCHIVED"]).default("ACTIVE"),
}).refine((d) => d.end_date > d.start_date, { message: "end_date > start_date", path: ["end_date"] });

export type GradeInput = z.infer<typeof gradeSchema>;
export type RankingPeriodInput = z.infer<typeof rankingPeriodSchema>;
