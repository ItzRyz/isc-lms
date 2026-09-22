import { z } from "zod";

export const quizSchema = z.object({
  course_id: z.string().uuid(),
  title: z.string().min(3).max(150),
  description: z.string().max(2000).optional().nullable(),
  type: z.enum(["ICE_BREAKING", "WEEKLY", "ASSESSMENT"]).default("WEEKLY"),
  duration_minutes: z.coerce.number().int().min(1).max(180).default(30),
  max_attempts: z.coerce.number().int().min(1).max(10).default(1),
  shuffle_questions: z.boolean().default(false),
  shuffle_choices: z.boolean().default(false),
  available_from: z.string().datetime({ offset: true }).nullable().optional(),
  available_until: z.string().datetime({ offset: true }).nullable().optional(),
  is_published: z.boolean().default(false),
  pass_score: z.coerce.number().int().min(0).max(100).default(60),
}).refine((d) => !d.available_from || !d.available_until || new Date(d.available_until) > new Date(d.available_from), {
  message: "available_until harus > available_from",
  path: ["available_until"],
});

export const quizUpdateSchema = z.object({
  title: z.string().min(3).max(150).optional(),
  description: z.string().max(2000).optional().nullable(),
  type: z.enum(["ICE_BREAKING", "WEEKLY", "ASSESSMENT"]).optional(),
  duration_minutes: z.coerce.number().int().min(1).max(180).optional(),
  max_attempts: z.coerce.number().int().min(1).max(10).optional(),
  shuffle_questions: z.boolean().optional(),
  shuffle_choices: z.boolean().optional(),
  available_from: z.string().datetime({ offset: true }).nullable().optional(),
  available_until: z.string().datetime({ offset: true }).nullable().optional(),
  is_published: z.boolean().optional(),
  pass_score: z.coerce.number().int().min(0).max(100).optional(),
});

export type QuizInput = z.infer<typeof quizSchema>;

export const questionSchema = z.object({
  course_id: z.string().uuid().nullable().optional(),
  type: z.enum(["MULTIPLE_CHOICE", "TRUE_FALSE", "MULTIPLE_ANSWER"]),
  content: z.string().min(3).max(2000),
  choices: z
    .array(z.object({ id: z.string(), text: z.string().min(1), is_correct: z.boolean() }))
    .min(2)
    .refine((arr) => arr.some((c) => c.is_correct), { message: "At least one correct choice" }),
  explanation: z.string().max(2000).optional().nullable(),
  points: z.coerce.number().int().min(1).max(100).default(10),
});

export type QuestionInput = z.infer<typeof questionSchema>;

export const submitQuizSchema = z.object({
  attempt_id: z.string().uuid(),
  answers: z.array(
    z.object({
      question_id: z.string().uuid(),
      selected_choice_ids: z.array(z.string()).max(10),
    })
  ),
});

export type SubmitQuizInput = z.infer<typeof submitQuizSchema>;
