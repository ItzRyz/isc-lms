import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ success: false, data: null, error: { code: "UNAUTHENTICATED", message: "Login required" } }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const { getContentRecommendation } = await import("@/lib/ml/client");
  const input = {
    user_id: user.id,
    division: body.division,
    completed_courses: body.completed_courses || [],
    interests: body.interests || [],
    level: body.level,
  };
  try {
    const result = await getContentRecommendation(input);
    return NextResponse.json({ success: true, data: result, error: null });
  } catch (e) {
    const message = e instanceof Error ? e.message : "ML service error";
    return NextResponse.json({ success: false, data: null, error: { code: "INTERNAL_ERROR", message } }, { status: 500 });
  }
}
