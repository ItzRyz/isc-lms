import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ success: false, data: null, error: { code: "UNAUTHENTICATED", message: "Login required" } }, { status: 401 });

  // Check permission: only allow if user has at least MEMBER (any authenticated) — ML is advisory
  const body = await req.json().catch(() => ({}));
  const { getMLRecommendation } = await import("@/lib/ml/client");

  // Validate input per AGENTS.md §45 (advisory only, not mutate grades)
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
    // If FastAPI not configured, return mock advisory
    if (message.includes("FASTAPI") || message.includes("not set")) {
      return NextResponse.json({
        success: true,
        data: {
          recommended_materials: ["material_html", "material_css"],
          recommended_next_step: "Lanjutkan ke JavaScript",
          risk_level: input.learning_progress > 70 ? "low" : "medium",
          explanation: `Progress ${input.learning_progress}% — mock advisory (FastAPI not configured)`,
          confidence: 0.6,
        },
        error: null,
      });
    }
    return NextResponse.json({ success: false, data: null, error: { code: "INTERNAL_ERROR", message } }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ success: true, data: { message: "ML proxy — POST to /api/v1/ml with learning_progress, quiz_scores etc. Advisory only, server-only FastAPI call." }, error: null });
}
