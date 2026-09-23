"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

function isSupabaseConfigured(): boolean {
  return !!process.env.NEXT_PUBLIC_SUPABASE_URL && !!(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY);
}

const mockUsers = [
  { id: "u1", email: "admin@isc.com", full_name: "Super Admin", roles: ["SUPER_ADMIN"], is_active: true },
  { id: "u2", email: "web.cord@isc.com", full_name: "Web Coordinator", roles: ["WEB_COORDINATOR", "MENTOR"], is_active: true },
  { id: "u3", email: "member@isc.com", full_name: "Member", roles: ["MEMBER"], is_active: true },
];

export async function getUsers() {
  if (!isSupabaseConfigured()) return mockUsers;
  const supabase = await createClient();
  const { data: profiles } = await supabase.from("profiles").select("id, email, full_name, is_active").is("deleted_at", null).limit(50);
  if (!profiles) return [];
  const results = [];
  for (const p of profiles as Array<{ id: string; email: string; full_name: string | null; is_active: boolean }>) {
    const { data: roles } = await supabase.from("user_roles").select("roles(name)").eq("user_id", p.id);
    results.push({
      id: p.id,
      email: p.email,
      full_name: p.full_name,
      is_active: p.is_active,
      roles: (roles as Array<{ roles: { name: string } }> | null)?.map((r) => r.roles.name) || [],
    });
  }
  return results;
}

export async function getRoles() {
  if (!isSupabaseConfigured()) {
    return [
      { id: "r1", name: "SUPER_ADMIN", description: "Full" },
      { id: "r2", name: "MEMBER", description: "Learning" },
      { id: "r3", name: "MENTOR", description: "Teaching" },
    ];
  }
  const supabase = await createClient();
  const { data } = await supabase.from("roles").select("*").order("name");
  return data || [];
}

export async function getPermissions() {
  if (!isSupabaseConfigured()) {
    return [
      { id: "p1", name: "user.view", description: "View users" },
      { id: "p2", name: "division.create", description: "Create division" },
      { id: "p3", name: "assignment.grade", description: "Grade assignment" },
    ];
  }
  const supabase = await createClient();
  const { data } = await supabase.from("permissions").select("*").order("name");
  return data || [];
}

export async function getAuditLogs() {
  if (!isSupabaseConfigured()) {
    return [
      { id: "a1", actor_id: "u1", action: "USER_ROLE_CHANGED", entity_type: "user_roles", entity_id: "u2", old_value: { role: "MEMBER" }, new_value: { role: "MENTOR" }, created_at: new Date().toISOString() },
      { id: "a2", actor_id: "u1", action: "ATTENDANCE_CORRECTED", entity_type: "attendance_records", entity_id: "rec1", old_value: { status: "ABSENT" }, new_value: { status: "PRESENT" }, created_at: new Date().toISOString() },
    ];
  }
  const supabase = await createClient();
  const { data } = await supabase.from("audit_logs").select("*").order("created_at", { ascending: false }).limit(50);
  return data || [];
}

export async function assignRole(formData: FormData) {
  const userId = String(formData.get("user_id") || "");
  const roleName = String(formData.get("role") || "");
  if (!userId || !roleName) return { success: false, error: { code: "VALIDATION_ERROR", message: "user_id & role required" } };
  if (!isSupabaseConfigured()) {
    revalidatePath("/admin/users");
    return { success: true };
  }
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: { code: "UNAUTHENTICATED", message: "Login required" } };
  // Check SUPER_ADMIN
  const { data: roles } = await supabase.from("user_roles").select("roles(name)").eq("user_id", user.id);
  const isSuper = (roles as Array<{ roles: { name: string } }> | null)?.some((r) => r.roles.name === "SUPER_ADMIN");
  if (!isSuper) return { success: false, error: { code: "FORBIDDEN", message: "Only SUPER_ADMIN" } };
  const { data: role } = await supabase.from("roles").select("id").eq("name", roleName).maybeSingle();
  if (!role) return { success: false, error: { code: "NOT_FOUND", message: "Role not found" } };
  const { error } = await supabase.from("user_roles").insert({ user_id: userId, role_id: (role as { id: string }).id });
  if (error && error.code !== "23505") return { success: false, error: { code: "INTERNAL_ERROR", message: error.message } };
  // Audit
  await supabase.from("audit_logs").insert({ actor_id: user.id, action: "USER_ROLE_CHANGED", entity_type: "user_roles", entity_id: userId, old_value: null, new_value: { role: roleName } });
  revalidatePath("/admin/users");
  return { success: true };
}

export async function getSystemSettings() {
  if (!isSupabaseConfigured()) return [{ key: "site_name", value: "ISC LMS" }, { key: "maintenance", value: "false" }];
  const supabase = await createClient();
  const { data } = await supabase.from("system_settings").select("*");
  return data || [];
}
