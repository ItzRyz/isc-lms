"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { academicPeriodSchema } from "@/lib/validation/academic-period";

type ActionResult = { success: true } | { success: false; error: { code: string; message: string } };

function isSupabaseConfigured(): boolean {
  return !!process.env.NEXT_PUBLIC_SUPABASE_URL && !!(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY);
}

export async function getAcademicPeriods() {
  if (!isSupabaseConfigured()) {
    return [
      { id: "ap1", name: "2025/2026 Ganjil", start_date: "2025-08-01", end_date: "2026-01-31", is_active: true, created_at: new Date().toISOString() },
      { id: "ap2", name: "2025/2026 Genap", start_date: "2026-02-01", end_date: "2026-07-31", is_active: true, created_at: new Date().toISOString() },
    ];
  }
  const supabase = await createClient();
  const { data, error } = await supabase.from("academic_periods").select("*").order("start_date");
  if (error) {
    console.error("[academic_periods] error:", error);
    return [];
  }
  return data;
}

export async function createAcademicPeriod(formData: FormData): Promise<ActionResult> {
  const raw = {
    name: String(formData.get("name") || ""),
    start_date: String(formData.get("start_date") || ""),
    end_date: String(formData.get("end_date") || ""),
    is_active: formData.get("is_active") === "true" || formData.get("is_active") === "on",
  };
  const parsed = academicPeriodSchema.safeParse(raw);
  if (!parsed.success) return { success: false, error: { code: "VALIDATION_ERROR", message: parsed.error.issues[0].message } };
  if (!isSupabaseConfigured()) {
    revalidatePath("/organization/divisions");
    return { success: true };
  }
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: { code: "UNAUTHENTICATED", message: "Login required" } };
  const { error } = await supabase.from("academic_periods").insert(parsed.data);
  if (error) return { success: false, error: { code: "INTERNAL_ERROR", message: error.message } };
  revalidatePath("/organization/divisions");
  return { success: true };
}

export async function deleteAcademicPeriod(id: string): Promise<ActionResult> {
  if (!isSupabaseConfigured()) return { success: true };
  const supabase = await createClient();
  const { error } = await supabase.from("academic_periods").delete().eq("id", id);
  if (error) return { success: false, error: { code: "INTERNAL_ERROR", message: error.message } };
  revalidatePath("/organization/divisions");
  return { success: true };
}
