"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { eventSchema } from "@/lib/validation/event";

type ActionResult = { success: true; data?: unknown } | { success: false; error: { code: string; message: string } };

function isSupabaseConfigured(): boolean {
  return !!process.env.NEXT_PUBLIC_SUPABASE_URL && !!(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY);
}

const mockEvents = [
  { id: "ev1", title: "Workshop Next.js 16", description: "Hands-on Next.js 16 + Supabase", type: "WORKSHOP" as const, division_id: "web-id", location: "Lab Web", start_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), end_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000).toISOString(), max_participants: 30, points_reward: 20, is_published: true, participant_count: 5 },
  { id: "ev2", title: "Seminar ML Basics", description: "Intro ML", type: "SEMINAR" as const, division_id: "ml-id", location: "Auditorium", start_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(), end_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000).toISOString(), max_participants: 50, points_reward: 15, is_published: true, participant_count: 12 },
];

export async function getEvents(divisionId?: string) {
  if (!isSupabaseConfigured()) {
    if (divisionId) return mockEvents.filter((e) => e.division_id === divisionId);
    return mockEvents;
  }
  const supabase = await createClient();
  let query = supabase.from("events").select("*, divisions(name)").is("deleted_at", null).eq("is_published", true).order("start_at");
  if (divisionId) query = query.eq("division_id", divisionId);
  const { data, error } = await query;
  if (error) {
    console.error("[events] error:", error);
    return [];
  }
  return (data as unknown as Array<Record<string, unknown>>).map((r) => ({
    id: r.id,
    title: r.title,
    description: r.description,
    type: r.type,
    division_id: r.division_id,
    location: r.location,
    start_at: r.start_at,
    end_at: r.end_at,
    max_participants: r.max_participants,
    points_reward: r.points_reward,
    is_published: r.is_published,
    division_name: (r.divisions as { name?: string } | null)?.name || "",
  }));
}

export async function getEventById(id: string) {
  if (!isSupabaseConfigured()) return mockEvents.find((e) => e.id === id) || null;
  const supabase = await createClient();
  const { data } = await supabase.from("events").select("*, divisions(name)").eq("id", id).maybeSingle();
  return data;
}

export async function createEvent(formData: FormData): Promise<ActionResult> {
  const raw = {
    title: String(formData.get("title") || ""),
    description: String(formData.get("description") || ""),
    type: String(formData.get("type") || "OTHER") as "WORKSHOP" | "SEMINAR" | "COMPETITION" | "MEETING" | "STUDY_SESSION" | "OTHER",
    division_id: formData.get("division_id") ? String(formData.get("division_id")) : null,
    location: String(formData.get("location") || ""),
    start_at: formData.get("start_at") ? new Date(String(formData.get("start_at"))).toISOString() : "",
    end_at: formData.get("end_at") ? new Date(String(formData.get("end_at"))).toISOString() : "",
    max_participants: formData.get("max_participants") ? Number(formData.get("max_participants")) : null,
    requires_registration: formData.get("requires_registration") !== "false",
    points_reward: formData.get("points_reward") ? Number(formData.get("points_reward")) : 0,
    is_published: formData.get("is_published") !== "false",
  };
  const parsed = eventSchema.safeParse(raw);
  if (!parsed.success) return { success: false, error: { code: "VALIDATION_ERROR", message: parsed.error.issues[0].message } };
  if (!isSupabaseConfigured()) {
    revalidatePath("/organization/events");
    return { success: true };
  }
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: { code: "UNAUTHENTICATED", message: "Login required" } };
  const { error } = await supabase.from("events").insert({ ...parsed.data, created_by: user.id });
  if (error) return { success: false, error: { code: "INTERNAL_ERROR", message: error.message } };
  revalidatePath("/organization/events");
  return { success: true };
}

export async function registerForEvent(eventId: string): Promise<ActionResult> {
  if (!isSupabaseConfigured()) {
    revalidatePath("/organization/events");
    return { success: true };
  }
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: { code: "UNAUTHENTICATED", message: "Login required" } };
  // Check max_participants
  const { data: event } = await supabase.from("events").select("max_participants").eq("id", eventId).maybeSingle();
  if (event) {
    const { count } = await supabase.from("event_participants").select("*", { count: "exact", head: true }).eq("event_id", eventId);
    if ((event as { max_participants: number | null }).max_participants && (count || 0) >= (event as { max_participants: number }).max_participants) {
      return { success: false, error: { code: "CONFLICT", message: "Event full" } };
    }
  }
  const { error } = await supabase.from("event_participants").insert({ event_id: eventId, user_id: user.id });
  if (error) {
    if (error.code === "23505") return { success: false, error: { code: "CONFLICT", message: "Already registered" } };
    return { success: false, error: { code: "INTERNAL_ERROR", message: error.message } };
  }
  // Award points if event has points_reward (on registration? or attendance? For P9, award on registration for MVP)
  const { data: ev } = await supabase.from("events").select("points_reward").eq("id", eventId).maybeSingle();
  const points = (ev as { points_reward?: number } | null)?.points_reward || 0;
  if (points > 0) {
    await supabase.from("point_transactions").insert({ user_id: user.id, amount: points, type: "EARN", source_type: "COMPETITION", source_id: eventId, description: "Event registration" });
  }
  revalidatePath("/organization/events");
  return { success: true };
}

export async function markEventAttendance(eventId: string, userId: string): Promise<ActionResult> {
  if (!isSupabaseConfigured()) return { success: true };
  const supabase = await createClient();
  const { error } = await supabase.from("event_participants").update({ attended: true, attended_at: new Date().toISOString() }).eq("event_id", eventId).eq("user_id", userId);
  if (error) return { success: false, error: { code: "INTERNAL_ERROR", message: error.message } };
  revalidatePath("/organization/events");
  return { success: true };
}
