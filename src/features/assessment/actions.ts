"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getGrade } from "@/lib/utils/grade";

type ActionResult = { success: true; data?: unknown } | { success: false; error: { code: string; message: string } };

function isSupabaseConfigured(): boolean {
  return !!process.env.NEXT_PUBLIC_SUPABASE_URL && !!(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY);
}

// Points ledger — SUM(point_transactions.amount) (§19)
export async function getPointsTotal(userId?: string) {
  if (!isSupabaseConfigured()) return 350; // mock 100+200+50
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const uid = userId || user?.id;
  if (!uid) return 0;
  const { data, error } = await supabase.from("point_transactions").select("amount").eq("user_id", uid);
  if (error) return 0;
  return (data as Array<{ amount: number }>).reduce((sum, r) => sum + r.amount, 0);
}

export async function getPointTransactions(userId?: string) {
  if (!isSupabaseConfigured()) {
    return [
      { id: "pt1", amount: 100, type: "EARN", source_type: "QUIZ", description: "Quiz HTML Weekly", created_at: new Date().toISOString() },
      { id: "pt2", amount: 200, type: "EARN", source_type: "ASSIGNMENT", description: "Tugas HTML", created_at: new Date().toISOString() },
      { id: "pt3", amount: 50, type: "EARN", source_type: "ATTENDANCE", description: "Present", created_at: new Date().toISOString() },
    ];
  }
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const uid = userId || user?.id;
  if (!uid) return [];
  const { data } = await supabase.from("point_transactions").select("*").eq("user_id", uid).order("created_at", { ascending: false }).limit(50);
  return data || [];
}

export async function addPointTransaction(formData: FormData): Promise<ActionResult> {
  const amount = Number(formData.get("amount"));
  const user_id = String(formData.get("user_id") || "");
  const source_type = String(formData.get("source_type") || "MANUAL") as "QUIZ" | "ASSIGNMENT" | "ATTENDANCE" | "COMPETITION" | "PRACTICE" | "MANUAL";
  const description = String(formData.get("description") || "");
  if (!amount || !user_id) return { success: false, error: { code: "VALIDATION_ERROR", message: "amount & user_id required" } };
  if (!isSupabaseConfigured()) {
    revalidatePath("/ranking");
    return { success: true };
  }
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { error } = await supabase.from("point_transactions").insert({
    user_id,
    amount,
    type: amount > 0 ? "EARN" : "PENALTY",
    source_type,
    description,
    created_by: user?.id || null,
  });
  if (error) return { success: false, error: { code: "INTERNAL_ERROR", message: error.message } };
  revalidatePath("/ranking");
  return { success: true };
}

// Grades — weighted (§18, §20)
export async function getGradesForUser(userId?: string) {
  if (!isSupabaseConfigured()) {
    return [
      { component: "QUIZ", score: 85, max_score: 100, weight: 20, final_score: 17, grade: "B" },
      { component: "ASSIGNMENT", score: 90, max_score: 100, weight: 30, final_score: 27, grade: "A" },
      { component: "PRACTICE", score: 80, max_score: 100, weight: 25, final_score: 20, grade: "B" },
      { component: "ATTENDANCE", score: 100, max_score: 100, weight: 15, final_score: 15, grade: "A" },
      { component: "COMPETITION", score: 70, max_score: 100, weight: 10, final_score: 7, grade: "C" },
    ];
  }
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const uid = userId || user?.id;
  if (!uid) return [];
  const { data: grades } = await supabase.from("grades").select("*, grade_components(name)").eq("user_id", uid).order("created_at");
  const { data: weights } = await supabase.from("grade_weights").select("*, grade_components(name)");
  const weightMap = new Map<string, number>();
  for (const w of (weights as Array<{ grade_components: { name: string }; weight: number }> | null) || []) {
    weightMap.set(w.grade_components.name, w.weight);
  }
  // If no weights, use default §18: 20/30/25/15/10
  const defaultWeights: Record<string, number> = { QUIZ: 20, ASSIGNMENT: 30, PRACTICE: 25, ATTENDANCE: 15, COMPETITION: 10 };
  const result = [];
  for (const g of (grades as Array<{ grade_components: { name: string }; score: number; max_score: number }> | null) || []) {
    const comp = g.grade_components.name;
    const w = weightMap.get(comp) ?? defaultWeights[comp] ?? 0;
    const final = Math.round((g.score / g.max_score) * w * 100) / 100;
    result.push({ component: comp, score: g.score, max_score: g.max_score, weight: w, final_score: final, grade: getGrade(g.score) });
  }
  return result;
}

export async function getFinalScore(userId?: string): Promise<{ total: number; grade: string; passed: boolean }> {
  const grades = await getGradesForUser(userId) as Array<{ final_score: number }>;
  const total = Math.round(grades.reduce((sum, g) => sum + g.final_score, 0) * 100) / 100;
  const grade = getGrade(total);
  // KKM 70 (§20)
  const passed = total >= 70;
  return { total, grade, passed };
}

// Ranking — reproducible from stored source (§55)
export async function getRankingPeriods() {
  if (!isSupabaseConfigured()) {
    return [
      { id: "rp-monthly", name: "Monthly — " + new Date().toISOString().slice(0, 7), type: "MONTHLY" as const, start_date: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10), end_date: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString().slice(0, 10), status: "ACTIVE" as const },
      { id: "rp-semester", name: "Semester Ganjil 2025/2026", type: "SEMESTER" as const, start_date: "2025-08-01", end_date: "2026-01-31", status: "ACTIVE" as const },
    ];
  }
  const supabase = await createClient();
  const { data } = await supabase.from("ranking_periods").select("*").eq("status", "ACTIVE").order("start_date");
  return data || [];
}

export async function getRankingEntries(periodId: string) {
  if (!isSupabaseConfigured()) {
    // Mock reproducible ranking: points for MONTHLY, final score for SEMESTER
    const isMonthly = periodId.includes("monthly") || periodId === "rp-monthly";
    return [
      { rank: 1, user_id: "u1", full_name: "Web Coordinator", email: "web.cord@example.com", score: isMonthly ? 350 : 86, division: "web" },
      { rank: 2, user_id: "u2", full_name: "Mentor Web", email: "mentor@example.com", score: isMonthly ? 280 : 78, division: "web" },
      { rank: 3, user_id: "u3", full_name: "Member ML", email: "member@example.com", score: isMonthly ? 150 : 65, division: "ml" },
    ];
  }
  const supabase = await createClient();
  const { data: entries } = await supabase.from("ranking_entries").select("rank, score, user_id, profiles(email, full_name), divisions(name)").eq("ranking_period_id", periodId).order("rank");
  if (entries && entries.length > 0) {
    return (entries as Array<Record<string, unknown>>).map((e) => ({
      rank: e.rank,
      user_id: e.user_id,
      full_name: (e.profiles as { full_name?: string } | null)?.full_name || "",
      email: (e.profiles as { email?: string } | null)?.email || "",
      score: e.score,
      division: (e.divisions as { name?: string } | null)?.name || "",
    }));
  }
  // If no entries yet, compute on-fly reproducibly for display (not persisted) — SUM points or SUM grades
  // For MVP, return empty and let generateRanking persist
  return [];
}

export async function generateRanking(periodId: string): Promise<ActionResult> {
  if (!isSupabaseConfigured()) {
    revalidatePath("/ranking");
    return { success: true };
  }
  const supabase = await createClient();
  const { data: period } = await supabase.from("ranking_periods").select("*").eq("id", periodId).maybeSingle();
  if (!period) return { success: false, error: { code: "NOT_FOUND", message: "Period not found" } };
  const p = period as { type: string; start_date: string; end_date: string; division_id: string | null };
  // Fetch all users active
  const { data: profiles } = await supabase.from("profiles").select("id, full_name, email").is("deleted_at", null).limit(100);
  const scores: Array<{ user_id: string; score: number }> = [];
  for (const u of (profiles as Array<{ id: string }> | null) || []) {
    let score = 0;
    if (p.type === "MONTHLY") {
      const { data: pts } = await supabase.from("point_transactions").select("amount").eq("user_id", u.id).gte("created_at", p.start_date).lte("created_at", p.end_date);
      score = (pts as Array<{ amount: number }> | null)?.reduce((s, r) => s + r.amount, 0) || 0;
    } else {
      // SEMESTER: sum grades final_score
      const { data: grades } = await supabase.from("grades").select("score, max_score, weight").eq("user_id", u.id);
      // Simplified: average score
      const total = (grades as Array<{ score: number; max_score: number; weight: number }> | null)?.reduce((s, g) => s + (g.score / g.max_score) * (g.weight || 0), 0) || 0;
      score = Math.round(total * 100) / 100;
    }
    scores.push({ user_id: u.id, score });
  }
  scores.sort((a, b) => b.score - a.score);
  // Upsert ranking_entries
  for (let i = 0; i < scores.length; i++) {
    await supabase.from("ranking_entries").upsert(
      { ranking_period_id: periodId, user_id: scores[i].user_id, rank: i + 1, score: scores[i].score },
      { onConflict: "ranking_period_id,user_id" }
    );
  }
  revalidatePath("/ranking");
  return { success: true };
}

// Report Card — generate + export data
export async function getReportCard(userId?: string, academicPeriodId?: string) {
  const grades = await getGradesForUser(userId);
  const { total, grade, passed } = await getFinalScore(userId);
  const points = await getPointsTotal(userId);
  const isMock = !isSupabaseConfigured();
  return {
    student: isMock ? { full_name: "Demo Student", email: "demo@example.com", division: "Web Development", period: "2025/2026 Ganjil" } : { full_name: "Student", email: "student@example.com", division: "Web", period: academicPeriodId || "2025/2026 Ganjil" },
    grades,
    total,
    grade,
    passed,
    points,
    kkm: 70,
    remarks: passed ? "Lulus — KKM tercapai" : "Perlu perbaikan",
    generated_at: new Date().toISOString(),
  };
}
