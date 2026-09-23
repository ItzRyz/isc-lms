import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ success: false, data: null, error: { code: "UNAUTHENTICATED", message: "Login required" } }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const courseId = searchParams.get("course_id");
  let query = supabase.from("assignments").select("id, title, due_at, is_published").is("deleted_at", null).order("due_at");
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
  if (!body.assignment_id) return NextResponse.json({ success: false, data: null, error: { code: "VALIDATION_ERROR", message: "assignment_id required" } }, { status: 400 });

  // Delegate to server action logic (deadline server, late detection)
  const { submitAssignment } = await import("@/features/assignments/actions");
  const fd = new FormData();
  fd.set("assignment_id", body.assignment_id);
  if (body.content_text) fd.set("content_text", body.content_text);
  if (body.is_draft) fd.set("is_draft", String(body.is_draft));
  const res = await submitAssignment(fd);
  if (!res.success) return NextResponse.json({ success: false, data: null, error: res.error }, { status: 400 });
  return NextResponse.json({ success: true, data: res.data, error: null });
}
