"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { classSchema } from "@/lib/validation/class";

type ActionResult = { success: true } | { success: false; error: { code: string; message: string } };

function isSupabaseConfigured(): boolean {
  return !!process.env.NEXT_PUBLIC_SUPABASE_URL && !!(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY);
}

async function canManageClassDivision(supabase: Awaited<ReturnType<typeof createClient>>, userId: string, divisionId: string): Promise<boolean> {
  const { data: roles } = await supabase.from("user_roles").select("roles(name)").eq("user_id", userId);
  const roleNames = (roles || []).map((r: unknown) => (r as { roles: { name: string } }).roles.name);
  if (roleNames.includes("SUPER_ADMIN") || roleNames.includes("LEADER") || roleNames.includes("CO_LEADER")) return true;
  const isCoordinator = roleNames.some((n: string) => n.endsWith("_COORDINATOR"));
  if (!isCoordinator) return false;
  const { data: ud } = await supabase.from("user_divisions").select("division_id").eq("user_id", userId).eq("division_id", divisionId).maybeSingle();
  return !!ud;
}

export async function getClasses() {
  if (!isSupabaseConfigured()) {
    return [
      { id: "c1", division_id: "web", division_name: "Web Development", academic_period_id: "ap1", name: "Web - Kelas A 2025 Ganjil", slug: "web-a-2025-ganjil", is_active: true, created_at: new Date().toISOString() },
    ];
  }
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("classes")
    .select("id, division_id, academic_period_id, name, slug, is_active, created_at, divisions(name)")
    .is("deleted_at", null)
    .order("name");
  if (error) {
    console.error("[classes] error:", error);
    return [];
  }
  return data.map((r: unknown) => {
    const row = r as Record<string, unknown>;
    const div = row.divisions as { name?: string } | null;
    return {
      id: row.id,
      division_id: row.division_id,
      academic_period_id: row.academic_period_id,
      name: row.name,
      slug: row.slug,
      is_active: row.is_active,
      created_at: row.created_at,
      division_name: div?.name || row.division_id,
    };
  });
}

export async function createClass(formData: FormData): Promise<ActionResult> {
  const raw = {
    division_id: String(formData.get("division_id") || ""),
    academic_period_id: formData.get("academic_period_id") ? String(formData.get("academic_period_id")) : null,
    name: String(formData.get("name") || ""),
    slug: String(formData.get("slug") || ""),
    is_active: formData.get("is_active") === "true" || formData.get("is_active") === "on",
  };
  const parsed = classSchema.safeParse(raw);
  if (!parsed.success) return { success: false, error: { code: "VALIDATION_ERROR", message: parsed.error.issues[0].message } };

  if (!isSupabaseConfigured()) {
    revalidatePath("/organization/divisions");
    return { success: true };
  }
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: { code: "UNAUTHENTICATED", message: "Login required" } };

  if (!(await canManageClassDivision(supabase, user.id, parsed.data.division_id))) {
    return { success: false, error: { code: "FORBIDDEN", message: "Coordinator only for own division" } };
  }

  const { error } = await supabase.from("classes").insert({
    division_id: parsed.data.division_id,
    academic_period_id: parsed.data.academic_period_id || null,
    name: parsed.data.name,
    slug: parsed.data.slug,
    is_active: parsed.data.is_active,
  });
  if (error) {
    if (error.code === "23505") return { success: false, error: { code: "CONFLICT", message: "Slug already exists in division" } };
    return { success: false, error: { code: "INTERNAL_ERROR", message: error.message } };
  }
  revalidatePath("/organization/divisions");
  return { success: true };
}

export async function deleteClass(id: string): Promise<ActionResult> {
  if (!isSupabaseConfigured()) return { success: true };
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: { code: "UNAUTHENTICATED", message: "Login required" } };
  // Fetch division for scope check
  const { data: cls } = await supabase.from("classes").select("division_id").eq("id", id).maybeSingle();
  if (cls && !(await canManageClassDivision(supabase, user.id, (cls as { division_id: string }).division_id))) {
    return { success: false, error: { code: "FORBIDDEN", message: "Not allowed for this division" } };
  }
  const { error } = await supabase.from("classes").update({ deleted_at: new Date().toISOString(), is_active: false }).eq("id", id);
  if (error) return { success: false, error: { code: "INTERNAL_ERROR", message: error.message } };
  revalidatePath("/organization/divisions");
  return { success: true };
}
