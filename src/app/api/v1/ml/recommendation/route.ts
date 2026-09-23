import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ success: false, data: null, error: { code: "UNAUTHENTICATED", message: "Login required" } }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const { getMLRecommendation } = await import("@/lib/ml/client");
  const input = {
    user_id: user.id,
    learning_progress: Number(body.learning_progress || 0),
    quiz_scores: body.quiz_scores || [],
    assignment_scores: body.assignment_scores || [],
    attendance_rate: Number(body.attendance_rate || 0),
    completed_materials: body.completed_materials || [],
    division: body.division,
    course: body.course,
  };
  try {
    const result = await getMLRecommendation(input);
    return NextResponse.json({ success: true, data: result, error: null });
  } catch (e) {
    const message = e instanceof Error ? e.message : "ML service error";
    if (message.includes("FASTAPI")) {
      return NextResponse.json({ success: true, data: { recommended_materials: ["html", "css"], recommended_courses: ["frontend-development"], recommended_next_step: "Lanjutkan ke JavaScript", risk_level: "medium", explanation: "Mock — FastAPI not configured", confidence: 0.6 }, error: null });
    }
    return NextResponse.json({ success: false, data: null, error: { code: "INTERNAL_ERROR", message } }, { status: 500 });
  }
}
