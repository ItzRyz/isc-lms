"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { attendanceSessionSchema, checkInSchema, correctAttendanceSchema } from "@/lib/validation/attendance";
import { haversineDistance } from "@/lib/utils/geofence";

type ActionResult = { success: true; data?: unknown } | { success: false; error: { code: string; message: string } };

function isSupabaseConfigured(): boolean {
  return !!process.env.NEXT_PUBLIC_SUPABASE_URL && !!(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY);
}

// Mock seed untuk dev
const mockSessions = [
  {
    id: "sess-web",
    title: "Web Kelas A Today",
    division_id: "web-id",
    class_id: "c1",
    started_at: new Date(new Date().setHours(8, 0, 0, 0)).toISOString(),
    ended_at: new Date(new Date().setHours(17, 0, 0, 0)).toISOString(),
    latitude: -6.2,
    longitude: 106.816666,
    radius_meters: 200,
    qr_token: "mock-qr-token-web-123",
    status: "OPEN" as const,
  },
];

const mockRecords: Array<{ id: string; session_id: string; user_id: string; status: string; checked_in_at: string | null }> = [
  { id: "rec1", session_id: "sess-web", user_id: "m3", status: "PRESENT", checked_in_at: new Date().toISOString() },
  { id: "rec2", session_id: "sess-web", user_id: "m2", status: "LATE", checked_in_at: new Date().toISOString() },
];

export async function getAttendanceSessions() {
  if (!isSupabaseConfigured()) return mockSessions;
  const supabase = await createClient();
  const { data, error } = await supabase.from("attendance_sessions").select("*").order("started_at", { ascending: false }).limit(20);
  if (error) {
    console.error("[attendance] sessions error:", error);
    return [];
  }
  return data;
}

export async function getAttendanceSessionById(id: string) {
  if (!isSupabaseConfigured()) return mockSessions.find((s) => s.id === id) || null;
  const supabase = await createClient();
  const { data } = await supabase.from("attendance_sessions").select("*").eq("id", id).maybeSingle();
  return data;
}

export async function getAttendanceRecords(sessionId?: string) {
  if (!isSupabaseConfigured()) {
    if (sessionId) return mockRecords.filter((r) => r.session_id === sessionId);
    return mockRecords;
  }
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  let query = supabase.from("attendance_records").select("*, profiles(email, full_name), attendance_sessions(title)").order("created_at");
  if (sessionId) query = query.eq("session_id", sessionId);
  // RLS: own or privileged; for mentor view, app layer will filter
  const { data, error } = await query;
  if (error) {
    console.error("[attendance] records error:", error);
    return [];
  }
  return data;
}

export async function createAttendanceSession(formData: FormData): Promise<ActionResult> {
  const raw = {
    division_id: formData.get("division_id") ? String(formData.get("division_id")) : null,
    class_id: formData.get("class_id") ? String(formData.get("class_id")) : null,
    title: String(formData.get("title") || "Attendance Session"),
    started_at: formData.get("started_at") ? new Date(String(formData.get("started_at"))).toISOString() : "",
    ended_at: formData.get("ended_at") ? new Date(String(formData.get("ended_at"))).toISOString() : "",
    latitude: formData.get("latitude") ? Number(formData.get("latitude")) : null,
    longitude: formData.get("longitude") ? Number(formData.get("longitude")) : null,
    radius_meters: formData.get("radius_meters") ? Number(formData.get("radius_meters")) : null,
    status: String(formData.get("status") || "OPEN") as "OPEN" | "CLOSED" | "CANCELLED",
  };
  const parsed = attendanceSessionSchema.safeParse(raw);
  if (!parsed.success) return { success: false, error: { code: "VALIDATION_ERROR", message: parsed.error.issues[0].message } };

  if (!isSupabaseConfigured()) {
    revalidatePath("/attendance");
    revalidatePath("/mentor/attendance");
    return { success: true };
  }
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: { code: "UNAUTHENTICATED", message: "Login required" } };

  const { error } = await supabase.from("attendance_sessions").insert({
    ...parsed.data,
    created_by: user.id,
    qr_token: Math.random().toString(36).slice(2, 10) + Math.random().toString(36).slice(2, 10), // server short-lived token
  });
  if (error) return { success: false, error: { code: "INTERNAL_ERROR", message: error.message } };
  revalidatePath("/attendance");
  return { success: true };
}

// QR check-in — server validates: session exists, OPEN, time window, qr_token, geofence Haversine (AGENTS.md §17)
export async function checkInAttendance(formData: FormData): Promise<ActionResult & { data?: { status: string; distance?: number } }> {
  const raw = {
    session_id: String(formData.get("session_id") || ""),
    qr_token: String(formData.get("qr_token") || ""),
    latitude: formData.get("latitude") ? Number(formData.get("latitude")) : undefined,
    longitude: formData.get("longitude") ? Number(formData.get("longitude")) : undefined,
  };
  const parsed = checkInSchema.safeParse(raw);
  if (!parsed.success) return { success: false, error: { code: "VALIDATION_ERROR", message: parsed.error.issues[0].message } };

  if (!isSupabaseConfigured()) {
    // Dev mock: just return PRESENT
    return { success: true, data: { status: "PRESENT", distance: 10 } };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: { code: "UNAUTHENTICATED", message: "Login required" } };

  const { data: session } = await supabase.from("attendance_sessions").select("*").eq("id", parsed.data.session_id).maybeSingle();
  if (!session) return { success: false, error: { code: "NOT_FOUND", message: "Session not found" } };
  const sess = session as {
    id: string;
    qr_token: string;
    status: string;
    started_at: string;
    ended_at: string;
    latitude: number | null;
    longitude: number | null;
    radius_meters: number | null;
  };

  // Never trust client says "inside geofence" — server calculates (AGENTS.md §17)
  if (sess.status !== "OPEN") return { success: false, error: { code: "FORBIDDEN", message: "Session not open" } };
  const now = new Date();
  if (now < new Date(sess.started_at)) return { success: false, error: { code: "FORBIDDEN", message: "Session not yet started" } };
  if (now > new Date(sess.ended_at)) return { success: false, error: { code: "FORBIDDEN", message: "Session ended" } };
  if (sess.qr_token !== parsed.data.qr_token) return { success: false, error: { code: "FORBIDDEN", message: "Invalid QR token" } };

  // Geofence validation server-side
  let distance: number | null = null;
  let isGeofenceValid: boolean | null = null;
  if (sess.latitude !== null && sess.longitude !== null && sess.radius_meters !== null) {
    if (parsed.data.latitude === undefined || parsed.data.longitude === undefined) {
      return { success: false, error: { code: "VALIDATION_ERROR", message: "Location required for geofenced session" } };
    }
    distance = haversineDistance(parsed.data.latitude, parsed.data.longitude, sess.latitude, sess.longitude);
    isGeofenceValid = distance <= sess.radius_meters;
    if (!isGeofenceValid) return { success: false, error: { code: "FORBIDDEN", message: `Outside geofence: ${Math.round(distance)}m > ${sess.radius_meters}m` } };
  }

  // Determine status PRESENT vs LATE (grace 15m after started_at)
  const graceMs = 15 * 60 * 1000;
  const isLate = now.getTime() - new Date(sess.started_at).getTime() > graceMs;
  const status = isLate ? "LATE" : "PRESENT";

  // Prevent duplicate (UNIQUE session_id,user_id) — upsert
  const { error } = await supabase.from("attendance_records").upsert(
    {
      session_id: parsed.data.session_id,
      user_id: user.id,
      status,
      checked_in_at: now.toISOString(),
      latitude: parsed.data.latitude ?? null,
      longitude: parsed.data.longitude ?? null,
      distance_meters: distance,
      is_geofence_valid: isGeofenceValid,
      qr_token_used: parsed.data.qr_token,
    },
    { onConflict: "session_id,user_id" }
  );
  if (error) {
    if (error.code === "23505") return { success: false, error: { code: "CONFLICT", message: "Already checked in" } };
    return { success: false, error: { code: "INTERNAL_ERROR", message: error.message } };
  }

  revalidatePath("/attendance");
  return { success: true, data: { status, distance: distance || undefined } };
}

// Manual attendance by mentor/secretary
export async function manualAttendance(formData: FormData): Promise<ActionResult> {
  const userId = String(formData.get("user_id") || "");
  const sessionId = String(formData.get("session_id") || "");
  const status = String(formData.get("status") || "PRESENT") as "PRESENT" | "LATE" | "PERMITTED" | "SICK" | "ABSENT";
  if (!userId || !sessionId) return { success: false, error: { code: "VALIDATION_ERROR", message: "user_id & session_id required" } };

  if (!isSupabaseConfigured()) {
    revalidatePath("/attendance");
    return { success: true };
  }
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: { code: "UNAUTHENTICATED", message: "Login required" } };

  const { error } = await supabase.from("attendance_records").upsert(
    { session_id: sessionId, user_id: userId, status, checked_in_at: new Date().toISOString() },
    { onConflict: "session_id,user_id" }
  );
  if (error) return { success: false, error: { code: "INTERNAL_ERROR", message: error.message } };
  revalidatePath("/attendance");
  return { success: true };
}

// Correction — must create audit (AGENTS.md §16, §30)
export async function correctAttendance(formData: FormData): Promise<ActionResult> {
  const raw = {
    record_id: String(formData.get("record_id") || ""),
    new_status: String(formData.get("new_status") || "") as "PRESENT" | "LATE" | "PERMITTED" | "SICK" | "ABSENT",
    reason: String(formData.get("reason") || ""),
  };
  const parsed = correctAttendanceSchema.safeParse(raw);
  if (!parsed.success) return { success: false, error: { code: "VALIDATION_ERROR", message: parsed.error.issues[0].message } };

  if (!isSupabaseConfigured()) {
    revalidatePath("/attendance");
    return { success: true };
  }
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: { code: "UNAUTHENTICATED", message: "Login required" } };

  const { data: record } = await supabase.from("attendance_records").select("status").eq("id", parsed.data.record_id).maybeSingle();
  if (!record) return { success: false, error: { code: "NOT_FOUND", message: "Record not found" } };
  const oldStatus = (record as { status: string }).status;

  const { error } = await supabase.from("attendance_records").update({ status: parsed.data.new_status, updated_at: new Date().toISOString() }).eq("id", parsed.data.record_id);
  if (error) return { success: false, error: { code: "INTERNAL_ERROR", message: error.message } };

  await supabase.from("attendance_corrections").insert({
    record_id: parsed.data.record_id,
    old_status: oldStatus,
    new_status: parsed.data.new_status,
    reason: parsed.data.reason,
    corrected_by: user.id,
  });

  // Audit log
  await supabase.from("audit_logs").insert({
    actor_id: user.id,
    action: "ATTENDANCE_CORRECTED",
    entity_type: "attendance_records",
    entity_id: parsed.data.record_id,
    old_value: { status: oldStatus },
    new_value: { status: parsed.data.new_status, reason: parsed.data.reason },
  });

  revalidatePath("/attendance");
  return { success: true };
}
