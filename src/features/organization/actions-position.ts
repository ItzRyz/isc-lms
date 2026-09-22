"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { positionSchema } from "@/lib/validation/position";

type ActionResult = { success: true } | { success: false; error: { code: string; message: string } };

function isSupabaseConfigured(): boolean {
  return !!process.env.NEXT_PUBLIC_SUPABASE_URL && !!(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY);
}

export async function getPositions() {
  if (!isSupabaseConfigured()) {
    return [
      { id: "p1", name: "Leader", slug: "leader", description: "Organization leadership", is_active: true, created_at: new Date().toISOString() },
      { id: "p2", name: "Secretary", slug: "secretary", description: "Administration", is_active: true, created_at: new Date().toISOString() },
      { id: "p3", name: "Mentor", slug: "mentor", description: "Teaching", is_active: true, created_at: new Date().toISOString() },
      { id: "p4", name: "Member", slug: "member", description: "Learning participant", is_active: true, created_at: new Date().toISOString() },
    ];
  }
  const supabase = await createClient();
  const { data, error } = await supabase.from("positions").select("*").is("deleted_at", null).order("name");
  if (error) {
    console.error("[positions] error:", error);
    return [];
  }
  return data;
}

export async function createPosition(formData: FormData): Promise<ActionResult> {
  const raw = {
    name: String(formData.get("name") || ""),
    slug: String(formData.get("slug") || ""),
    description: String(formData.get("description") || ""),
    is_active: formData.get("is_active") === "true" || formData.get("is_active") === "on",
  };
  const parsed = positionSchema.safeParse(raw);
  if (!parsed.success) return { success: false, error: { code: "VALIDATION_ERROR", message: parsed.error.issues[0].message } };
  if (!isSupabaseConfigured()) {
    revalidatePath("/organization/divisions");
    return { success: true };
  }
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: { code: "UNAUTHENTICATED", message: "Login required" } };
  const { error } = await supabase.from("positions").insert(parsed.data);
  if (error) {
    if (error.code === "23505") return { success: false, error: { code: "CONFLICT", message: "Slug already exists" } };
    return { success: false, error: { code: "INTERNAL_ERROR", message: error.message } };
  }
  revalidatePath("/organization/divisions");
  return { success: true };
}

export async function deletePosition(id: string): Promise<ActionResult> {
  if (!isSupabaseConfigured()) return { success: true };
  const supabase = await createClient();
  const { error } = await supabase.from("positions").update({ deleted_at: new Date().toISOString(), is_active: false }).eq("id", id);
  if (error) return { success: false, error: { code: "INTERNAL_ERROR", message: error.message } };
  revalidatePath("/organization/divisions");
  return { success: true };
}
