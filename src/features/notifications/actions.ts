"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

function isSupabaseConfigured(): boolean {
  return !!process.env.NEXT_PUBLIC_SUPABASE_URL && !!(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY);
}

const mockNotifications = [
  { id: "n1", type: "ASSIGNMENT_GRADED", title: "Assignment Graded: HTML", body: "Score 90", channel: "IN_APP" as const, read_at: null, created_at: new Date().toISOString() },
  { id: "n2", type: "ANNOUNCEMENT_CREATED", title: "Announcement: Web Workshop", body: "Workshop next week", channel: "IN_APP" as const, read_at: new Date().toISOString(), created_at: new Date(Date.now() - 3600000).toISOString() },
  { id: "n3", type: "GRADE_PUBLISHED", title: "Grade Published", body: "Semester Ganjil", channel: "EMAIL" as const, read_at: null, created_at: new Date(Date.now() - 7200000).toISOString() },
];

export async function getNotifications() {
  if (!isSupabaseConfigured()) return mockNotifications;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];
  const { data } = await supabase.from("notifications").select("*").eq("recipient_id", user.id).order("created_at", { ascending: false }).limit(50);
  return data || [];
}

export async function getUnreadCount() {
  if (!isSupabaseConfigured()) return 2;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return 0;
  const { count } = await supabase.from("notifications").select("*", { count: "exact", head: true }).eq("recipient_id", user.id).is("read_at", null);
  return count || 0;
}

export async function markAsRead(notificationId: string) {
  if (!isSupabaseConfigured()) {
    revalidatePath("/notifications");
    return { success: true };
  }
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: { code: "UNAUTHENTICATED", message: "Login required" } };
  const { error } = await supabase.from("notifications").update({ read_at: new Date().toISOString() }).eq("id", notificationId).eq("recipient_id", user.id);
  if (error) return { success: false, error: { code: "INTERNAL_ERROR", message: error.message } };
  revalidatePath("/notifications");
  return { success: true };
}

export async function markAllAsRead() {
  if (!isSupabaseConfigured()) {
    revalidatePath("/notifications");
    return { success: true };
  }
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: { code: "UNAUTHENTICATED", message: "Login required" } };
  const { error } = await supabase.from("notifications").update({ read_at: new Date().toISOString() }).eq("recipient_id", user.id).is("read_at", null);
  if (error) return { success: false, error: { code: "INTERNAL_ERROR", message: error.message } };
  revalidatePath("/notifications");
  return { success: true };
}

export async function getNotificationPreferences() {
  if (!isSupabaseConfigured()) {
    return [
      { event_type: "ASSIGNMENT_GRADED", in_app: true, realtime: true, email: true },
      { event_type: "GRADE_PUBLISHED", in_app: true, realtime: true, email: true },
      { event_type: "ANNOUNCEMENT_CREATED", in_app: true, realtime: true, email: false },
    ];
  }
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];
  const { data } = await supabase.from("notification_preferences").select("*").eq("user_id", user.id);
  return data || [];
}
