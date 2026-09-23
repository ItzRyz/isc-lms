"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { announcementSchema } from "@/lib/validation/communication";

type ActionResult = { success: true } | { success: false; error: { code: string; message: string } };

function isSupabaseConfigured(): boolean {
  return !!process.env.NEXT_PUBLIC_SUPABASE_URL && !!(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY);
}

const mockAnnouncements = [
  { id: "ann1", title: "Welcome to ISC LMS — P8 Communication", content: "Forum, announcements, messages, notifications realtime + Resend selective per §47.", division_id: null, is_pinned: true, is_published: true, created_at: new Date().toISOString(), profiles: { full_name: "Leader" } },
  { id: "ann2", title: "Web Dev Workshop — Next.js 16", content: "Workshop Web Development division scheduled next week.", division_id: "web-id", is_pinned: false, is_published: true, created_at: new Date().toISOString(), profiles: { full_name: "Web Coordinator" } },
];

export async function getAnnouncements(divisionId?: string) {
  if (!isSupabaseConfigured()) {
    if (divisionId) return mockAnnouncements.filter((a) => !a.division_id || a.division_id === divisionId);
    return mockAnnouncements;
  }
  const supabase = await createClient();
  let query = supabase.from("announcements").select("*, profiles(full_name)").is("deleted_at", null).eq("is_published", true).order("is_pinned", { ascending: false }).order("created_at", { ascending: false });
  if (divisionId) query = query.or(`division_id.is.null,division_id.eq.${divisionId}`);
  const { data, error } = await query;
  if (error) {
    console.error("[announcements] error:", error);
    return [];
  }
  return data;
}

export async function createAnnouncement(formData: FormData): Promise<ActionResult> {
  const raw = {
    title: String(formData.get("title") || ""),
    content: String(formData.get("content") || ""),
    division_id: formData.get("division_id") ? String(formData.get("division_id")) : null,
    class_id: formData.get("class_id") ? String(formData.get("class_id")) : null,
    is_pinned: formData.get("is_pinned") === "true" || formData.get("is_pinned") === "on",
    is_published: formData.get("is_published") !== "false",
  };
  const parsed = announcementSchema.safeParse(raw);
  if (!parsed.success) return { success: false, error: { code: "VALIDATION_ERROR", message: parsed.error.issues[0].message } };
  if (!isSupabaseConfigured()) {
    revalidatePath("/organization/announcements");
    revalidatePath("/discussions");
    return { success: true };
  }
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: { code: "UNAUTHENTICATED", message: "Login required" } };

  const { error } = await supabase.from("announcements").insert({ ...parsed.data, created_by: user.id });
  if (error) return { success: false, error: { code: "INTERNAL_ERROR", message: error.message } };

  // Create notifications for relevant division members (IN_APP + REALTIME, selective email if major)
  // For MVP, create notification for all profiles (in real, filter by division)
  const { data: profiles } = await supabase.from("profiles").select("id").is("deleted_at", null).limit(100);
  if (profiles) {
    const notifs = (profiles as Array<{ id: string }>).map((p) => ({
      recipient_id: p.id,
      type: "ANNOUNCEMENT_CREATED",
      title: parsed.data.title,
      body: parsed.data.content.slice(0, 200),
      entity_type: "announcement",
      channel: "IN_APP" as const,
    }));
    await supabase.from("notifications").insert(notifs);
  }

  revalidatePath("/organization/announcements");
  revalidatePath("/discussions");
  return { success: true };
}

export async function deleteAnnouncement(id: string): Promise<ActionResult> {
  if (!isSupabaseConfigured()) return { success: true };
  const supabase = await createClient();
  const { error } = await supabase.from("announcements").update({ deleted_at: new Date().toISOString(), is_published: false }).eq("id", id);
  if (error) return { success: false, error: { code: "INTERNAL_ERROR", message: error.message } };
  revalidatePath("/organization/announcements");
  return { success: true };
}
