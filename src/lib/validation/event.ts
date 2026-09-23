import { z } from "zod";

const eventBase = z.object({
  title: z.string().min(3).max(150),
  description: z.string().max(5000).optional().nullable(),
  type: z.enum(["WORKSHOP", "SEMINAR", "COMPETITION", "MEETING", "STUDY_SESSION", "OTHER"]).default("OTHER"),
  division_id: z.string().uuid().nullable().optional(),
  location: z.string().max(200).optional().nullable(),
  start_at: z.string().datetime({ offset: true }),
  end_at: z.string().datetime({ offset: true }),
  max_participants: z.coerce.number().int().min(1).max(1000).nullable().optional(),
  requires_registration: z.boolean().default(true),
  points_reward: z.coerce.number().int().min(0).max(1000).default(0),
  is_published: z.boolean().default(true),
});

export const eventSchema = eventBase.refine((d) => new Date(d.end_at) > new Date(d.start_at), { message: "end_at > start_at", path: ["end_at"] });

export const eventUpdateSchema = eventBase.partial();
export type EventInput = z.infer<typeof eventSchema>;

export const certificateSchema = z.object({
  user_id: z.string().uuid(),
  division_id: z.string().uuid().nullable().optional(),
  program_id: z.string().uuid().nullable().optional(),
  event_id: z.string().uuid().nullable().optional(),
  competition_id: z.string().uuid().nullable().optional(),
  issuer: z.string().min(1).max(100).default("Study Club"),
});

export const financeTransactionSchema = z.object({
  account_id: z.string().uuid(),
  category_id: z.string().uuid().nullable().optional(),
  amount: z.coerce.number().refine((v) => v !== 0, { message: "amount cannot be 0" }),
  description: z.string().max(500).optional().nullable(),
});
