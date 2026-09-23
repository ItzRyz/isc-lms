import { z } from "zod";

export const pointTransactionSchema = z.object({
  user_id: z.string().uuid(),
  amount: z.number().int().refine((v) => v !== 0, { message: "amount cannot be 0" }),
  type: z.enum(["EARN", "PENALTY", "CORRECTION"]).default("EARN"),
  source_type: z.enum(["QUIZ", "ASSIGNMENT", "ATTENDANCE", "COMPETITION", "PRACTICE", "MANUAL"]),
  source_id: z.string().uuid().nullable().optional(),
  description: z.string().max(500).optional().nullable(),
});

export type PointTransactionInput = z.infer<typeof pointTransactionSchema>;
