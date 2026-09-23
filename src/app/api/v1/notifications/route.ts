import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ success: false, data: null, error: { code: "UNAUTHENTICATED", message: "Login required" } }, { status: 401 });
  const { data, error } = await supabase.from("notifications").select("*").eq("recipient_id", user.id).order("created_at", { ascending: false }).limit(50);
  if (error) return NextResponse.json({ success: false, data: null, error: { code: "INTERNAL_ERROR", message: error.message } }, { status: 500 });
  return NextResponse.json({ success: true, data, error: null });
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ success: false, data: null, error: { code: "UNAUTHENTICATED", message: "Login required" } }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  if (body.action === "mark-read") {
    const { error } = await supabase.from("notifications").update({ read_at: new Date().toISOString() }).eq("id", body.notification_id).eq("recipient_id", user.id);
    if (error) return NextResponse.json({ success: false, data: null, error: { code: "INTERNAL_ERROR", message: error.message } }, { status: 500 });
    return NextResponse.json({ success: true, data: {}, error: null });
  }
  if (body.action === "mark-all-read") {
    const { error } = await supabase.from("notifications").update({ read_at: new Date().toISOString() }).eq("recipient_id", user.id).is("read_at", null);
    if (error) return NextResponse.json({ success: false, data: null, error: { code: "INTERNAL_ERROR", message: error.message } }, { status: 500 });
    return NextResponse.json({ success: true, data: {}, error: null });
  }
  return NextResponse.json({ success: false, data: null, error: { code: "VALIDATION_ERROR", message: "action required: mark-read|mark-all-read" } }, { status: 400 });
}

export async function PATCH(req: NextRequest) {
  return POST(req);
}
