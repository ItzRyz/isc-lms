import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ success: false, data: null, error: { code: "UNAUTHENTICATED", message: "Login required" } }, { status: 401 });
  const { searchParams } = new URL(req.url);
  const courseId = searchParams.get("course_id");
  let query = supabase.from("quizzes").select("id, title, type, duration_minutes, is_published").is("deleted_at", null);
  if (courseId) query = query.eq("course_id", courseId);
  const { data, error } = await query;
  if (error) return NextResponse.json({ success: false, data: null, error: { code: "INTERNAL_ERROR", message: error.message } }, { status: 500 });
  return NextResponse.json({ success: true, data, error: null });
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ success: false, data: null, error: { code: "UNAUTHENTICATED", message: "Login required" } }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  if (body.action === "start") {
    const { startQuizAttempt } = await import("@/features/quizzes/actions");
    const res = await startQuizAttempt(body.quiz_id);
    if (!res.success) return NextResponse.json({ success: false, data: null, error: res.error }, { status: 400 });
    return NextResponse.json({ success: true, data: res.data, error: null });
  }
  if (body.action === "submit") {
    const { submitQuizAttempt } = await import("@/features/quizzes/actions");
    const fd = new FormData();
    fd.set("attempt_id", body.attempt_id);
    fd.set("answers", JSON.stringify(body.answers || []));
    const res = await submitQuizAttempt(fd);
    if (!res.success) return NextResponse.json({ success: false, data: null, error: res.error }, { status: 400 });
    return NextResponse.json({ success: true, data: res.data, error: null });
  }
  return NextResponse.json({ success: false, data: null, error: { code: "VALIDATION_ERROR", message: "action required: start|submit" } }, { status: 400 });
}
