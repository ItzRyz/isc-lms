"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { batchSchema } from "@/lib/validation/batch";

type ActionResult = { success: true } | { success: false; error: { code: string; message: string } };

function isSupabaseConfigured(): boolean {
  return !!process.env.NEXT_PUBLIC_SUPABASE_URL && !!(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY);
}

export async function getBatches() {
  if (!isSupabaseConfigured()) {
    return [
      { id: "b1", name: "Angkatan 2023", slug: "angkatan-2023", year: 2023, description: "Cohort 2023", is_active: true, created_at: new Date().toISOString() },
      { id: "b2", name: "Angkatan 2024", slug: "angkatan-2024", year: 2024, description: "Cohort 2024", is_active: true, created_at: new Date().toISOString() },
      { id: "b3", name: "Angkatan 2025", slug: "angkatan-2025", year: 2025, description: "Cohort 2025", is_active: true, created_at: new Date().toISOString() },
    ];
  }
  const supabase = await createClient();
  const { data, error } = await supabase.from("batches").select("*").is("deleted_at", null).order("year", { ascending: false });
  if (error) {
    console.error("[batches] error:", error);
    return [];
  }
  return data;
}

export async function createBatch(formData: FormData): Promise<ActionResult> {
  const raw = {
    name: String(formData.get("name") || ""),
    slug: String(formData.get("slug") || ""),
    year: formData.get("year"),
    description: String(formData.get("description") || ""),
    is_active: formData.get("is_active") === "true" || formData.get("is_active") === "on",
  };
  const parsed = batchSchema.safeParse(raw);
  if (!parsed.success) return { success: false, error: { code: "VALIDATION_ERROR", message: parsed.error.issues[0].message } };
  if (!isSupabaseConfigured()) {
    revalidatePath("/organization/divisions");
    return { success: true };
  }
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: { code: "UNAUTHENTICATED", message: "Login required" } };
  const { error } = await supabase.from("batches").insert(parsed.data);
  if (error) {
    if (error.code === "23505") return { success: false, error: { code: "CONFLICT", message: "Slug/year already exists" } };
    return { success: false, error: { code: "INTERNAL_ERROR", message: error.message } };
  }
  revalidatePath("/organization/divisions");
  return { success: true };
}

export async function deleteBatch(id: string): Promise<ActionResult> {
  if (!isSupabaseConfigured()) return { success: true };
  const supabase = await createClient();
  const { error } = await supabase.from("batches").update({ deleted_at: new Date().toISOString(), is_active: false }).eq("id", id);
  if (error) return { success: false, error: { code: "INTERNAL_ERROR", message: error.message } };
  revalidatePath("/organization/divisions");
  return { success: true };
}
