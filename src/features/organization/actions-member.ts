"use server";

import { createClient } from "@/lib/supabase/server";

function isSupabaseConfigured(): boolean {
  return !!process.env.NEXT_PUBLIC_SUPABASE_URL && !!(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY);
}

export type MemberRow = {
  id: string;
  email: string;
  full_name: string | null;
  is_active: boolean;
  roles: string[];
  division_slugs: string[];
  class_names: string[];
};

export async function getMembers(): Promise<MemberRow[]> {
  if (!isSupabaseConfigured()) {
    return [
      { id: "m1", email: "web.cord@example.com", full_name: "Web Coordinator", is_active: true, roles: ["WEB_COORDINATOR", "MENTOR"], division_slugs: ["web"], class_names: ["Web - Kelas A"] },
      { id: "m2", email: "mentor@example.com", full_name: "Mentor Web", is_active: true, roles: ["MENTOR"], division_slugs: ["web"], class_names: ["Web - Kelas A"] },
      { id: "m3", email: "member@example.com", full_name: "Member ML", is_active: true, roles: ["MEMBER"], division_slugs: ["ml"], class_names: [] },
    ];
  }
  const supabase = await createClient();
  // Join profiles + user_roles + user_divisions + class_members
  const { data: profiles, error } = await supabase
    .from("profiles")
    .select("id, email, full_name, is_active")
    .is("deleted_at", null)
    .limit(50);
  if (error || !profiles) {
    console.error("[members] profiles error:", error);
    return [];
  }

  // Fetch roles & divisions per user (N+1 simpel untuk MVP, nanti optimize dengan view)
  const results: MemberRow[] = [];
  for (const p of profiles) {
    const { data: roles } = await supabase
      .from("user_roles")
      .select("roles(name)")
      .eq("user_id", p.id);
    const { data: divs } = await supabase
      .from("user_divisions")
      .select("divisions(slug)")
      .eq("user_id", p.id);
    const { data: classes } = await supabase
      .from("class_members")
      .select("classes(name)")
      .eq("user_id", p.id);

    results.push({
      id: p.id,
      email: p.email,
      full_name: p.full_name,
      is_active: p.is_active,
      roles: (roles || []).map((r: unknown) => (r as { roles: { name: string } }).roles.name),
      division_slugs: (divs || []).map((d: unknown) => (d as { divisions: { slug: string } }).divisions.slug),
      class_names: (classes || []).map((c: unknown) => (c as { classes: { name: string } }).classes.name),
    });
  }
  return results;
}
