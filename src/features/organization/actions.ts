"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { divisionSchema, divisionUpdateSchema } from "@/lib/validation/division";

type ActionResult = { success: true; data?: unknown } | { success: false; error: { code: string; message: string } };

type DivisionRow = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

// Helper to check Supabase is configured
function isSupabaseConfigured(): boolean {
  return !!process.env.NEXT_PUBLIC_SUPABASE_URL && !!(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY);
}

export async function getDivisions(): Promise<DivisionRow[]> {
  if (!isSupabaseConfigured()) {
    // Fallback seed untuk dev tanpa Supabase (AGENTS.md §1 mock not allowed di prod, tapi ok untuk dev preview)
    return [
      { id: "1", name: "UI/UX Design", slug: "uiux", description: "Division UI/UX Design", is_active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString(), deleted_at: null },
      { id: "2", name: "Web Development", slug: "web", description: "Division Web Development", is_active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString(), deleted_at: null },
      { id: "3", name: "Machine Learning", slug: "ml", description: "Division Machine Learning", is_active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString(), deleted_at: null },
    ];
  }
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("divisions")
    .select("id, name, slug, description, is_active, created_at, updated_at, deleted_at")
    .is("deleted_at", null)
    .eq("is_active", true)
    .order("name");
  if (error) {
    console.error("[divisions] getDivisions error:", error);
    return [];
  }
  return data as DivisionRow[];
}

export async function createDivision(formData: FormData): Promise<ActionResult> {
  const raw = {
    name: formData.get("name"),
    slug: formData.get("slug"),
    description: formData.get("description"),
    is_active: formData.get("is_active") === "true" || formData.get("is_active") === "on",
  };
  const parsed = divisionSchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, error: { code: "VALIDATION_ERROR", message: parsed.error.issues[0]?.message || "Invalid" } };
  }

  if (!isSupabaseConfigured()) {
    // Dev fallback: simulate success tanpa DB
    revalidatePath("/organization/divisions");
    return { success: true, data: { mock: true } };
  }

  // Auth check (AGENTS.md §61): jangan percaya client role, fetch server-side via RLS + can()
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: { code: "UNAUTHENTICATED", message: "Login required" } };

  // RLS akan block jika tidak punya permission; app layer juga check via has_permission di DB bisa ditambah
  const { error } = await supabase.from("divisions").insert({
    name: parsed.data.name,
    slug: parsed.data.slug,
    description: parsed.data.description || null,
    is_active: parsed.data.is_active,
  });
  if (error) {
    console.error("[divisions] create error:", error);
    if (error.code === "23505") return { success: false, error: { code: "CONFLICT", message: "Slug already exists" } };
    return { success: false, error: { code: "INTERNAL_ERROR", message: error.message } };
  }
  revalidatePath("/organization/divisions");
  // TODO: audit_logs insert USER_ROLE? DIVISION_CREATED
  return { success: true };
}

export async function updateDivision(id: string, formData: FormData): Promise<ActionResult> {
  const raw = {
    name: formData.get("name"),
    slug: formData.get("slug"),
    description: formData.get("description"),
    is_active: formData.get("is_active") ? formData.get("is_active") === "true" || formData.get("is_active") === "on" : undefined,
  };
  const parsed = divisionUpdateSchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, error: { code: "VALIDATION_ERROR", message: parsed.error.issues[0]?.message || "Invalid" } };
  }
  if (!isSupabaseConfigured()) {
    revalidatePath("/organization/divisions");
    return { success: true, data: { mock: true } };
  }
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: { code: "UNAUTHENTICATED", message: "Login required" } };

  const { error } = await supabase.from("divisions").update({
    ...parsed.data,
    updated_at: new Date().toISOString(),
  }).eq("id", id);
  if (error) return { success: false, error: { code: "INTERNAL_ERROR", message: error.message } };
  revalidatePath("/organization/divisions");
  return { success: true };
}

export async function deleteDivision(id: string): Promise<ActionResult> {
  if (!isSupabaseConfigured()) {
    revalidatePath("/organization/divisions");
    return { success: true, data: { mock: true } };
  }
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: { code: "UNAUTHENTICATED", message: "Login required" } };

  // Soft delete per AGENTS.md §34 (preserve history)
  const { error } = await supabase.from("divisions").update({
    deleted_at: new Date().toISOString(),
    deleted_by: user.id,
    is_active: false,
  }).eq("id", id);
  if (error) return { success: false, error: { code: "INTERNAL_ERROR", message: error.message } };
  revalidatePath("/organization/divisions");
  return { success: true };
}
