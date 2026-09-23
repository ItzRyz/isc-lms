import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ success: false, data: null, error: { code: "UNAUTHENTICATED", message: "Login required" } }, { status: 401 });
  const { searchParams } = new URL(req.url);
  const sessionId = searchParams.get("session_id");
  let query = supabase.from("attendance_records").select("*, attendance_sessions(title)").order("created_at", { ascending: false }).limit(20);
  if (sessionId) query = query.eq("session_id", sessionId);
  else query = query.eq("user_id", user.id);
  const { data, error } = await query;
  if (error) return NextResponse.json({ success: false, data: null, error: { code: "INTERNAL_ERROR", message: error.message } }, { status: 500 });
  return NextResponse.json({ success: true, data, error: null });
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ success: false, data: null, error: { code: "UNAUTHENTICATED", message: "Login required" } }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  if (body.action === "check-in") {
    const { checkInAttendance } = await import("@/features/attendance/actions");
    const fd = new FormData();
    fd.set("session_id", body.session_id);
    fd.set("qr_token", body.qr_token);
    if (body.latitude) fd.set("latitude", String(body.latitude));
    if (body.longitude) fd.set("longitude", String(body.longitude));
    const res = await checkInAttendance(fd);
    if (!res.success) return NextResponse.json({ success: false, data: null, error: res.error }, { status: 400 });
    return NextResponse.json({ success: true, data: res.data, error: null });
  }
  if (body.action === "create-session") {
    const { createAttendanceSession } = await import("@/features/attendance/actions");
    const fd = new FormData();
    fd.set("title", body.title || "Attendance Session");
    fd.set("started_at", body.started_at);
    fd.set("ended_at", body.ended_at);
    if (body.division_id) fd.set("division_id", body.division_id);
    if (body.latitude) fd.set("latitude", String(body.latitude));
    const res = await createAttendanceSession(fd);
    if (!res.success) return NextResponse.json({ success: false, data: null, error: res.error }, { status: 400 });
    return NextResponse.json({ success: true, data: res.data, error: null });
  }
  return NextResponse.json({ success: false, data: null, error: { code: "VALIDATION_ERROR", message: "action required: check-in|create-session" } }, { status: 400 });
}
