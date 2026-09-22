import { z } from "zod";

const academicPeriodBase = z.object({
  name: z.string().min(3).max(100),
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "YYYY-MM-DD"),
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "YYYY-MM-DD"),
  is_active: z.boolean().default(true),
});

export const academicPeriodSchema = academicPeriodBase.refine((d) => d.end_date > d.start_date, {
  message: "end_date harus > start_date",
  path: ["end_date"],
});

export const academicPeriodUpdateSchema = academicPeriodBase.partial();

export type AcademicPeriodInput = z.infer<typeof academicPeriodSchema>;
