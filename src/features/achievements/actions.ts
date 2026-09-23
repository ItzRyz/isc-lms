"use server";

import { createClient } from "@/lib/supabase/server";

function isSupabaseConfigured(): boolean {
  return !!process.env.NEXT_PUBLIC_SUPABASE_URL && !!(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY);
}

const mockAchievements = [
  { slug: "FIRST_ASSIGNMENT", name: "First Assignment", description: "Complete first assignment", icon: "📝", points_reward: 10, earned: true, earned_at: new Date().toISOString() },
  { slug: "TEN_ASSIGNMENTS", name: "Ten Assignments", description: "Complete 10 assignments", icon: "📚", points_reward: 50, earned: false, earned_at: null },
  { slug: "PERFECT_ATTENDANCE", name: "Perfect Attendance", description: "100% attendance in period", icon: "✅", points_reward: 30, earned: false, earned_at: null },
  { slug: "QUIZ_MASTER", name: "Quiz Master", description: "Score 90+ on 5 quizzes", icon: "🧠", points_reward: 50, earned: false, earned_at: null },
  { slug: "ROADMAP_COMPLETED", name: "Roadmap Completed", description: "Complete all roadmap nodes", icon: "🗺️", points_reward: 100, earned: false, earned_at: null },
  { slug: "COMPETITION_PARTICIPANT", name: "Competition Participant", description: "Join a competition", icon: "🏁", points_reward: 20, earned: true, earned_at: new Date().toISOString() },
  { slug: "COMPETITION_WINNER", name: "Competition Winner", description: "Win a competition", icon: "🏆", points_reward: 100, earned: false, earned_at: null },
];

export async function getAchievements(userId?: string) {
  if (!isSupabaseConfigured()) return mockAchievements;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const uid = userId || user?.id;
  if (!uid) return [];
  const { data: achievements } = await supabase.from("achievements").select("*").order("name");
  const { data: userAch } = await supabase.from("user_achievements").select("achievement_id, earned_at").eq("user_id", uid);
  const earnedMap = new Map((userAch as Array<{ achievement_id: string; earned_at: string }> | null)?.map((ua) => [ua.achievement_id, ua.earned_at]) || []);
  return (achievements as Array<{ id: string; slug: string; name: string; description: string | null; icon: string | null; points_reward: number }> | null)?.map((a) => ({
    slug: a.slug,
    name: a.name,
    description: a.description,
    icon: a.icon,
    points_reward: a.points_reward,
    earned: earnedMap.has(a.id),
    earned_at: earnedMap.get(a.id) || null,
  })) || [];
}

// Event-driven awarding (§27 diagram: AssignmentSubmitted → Rule → Award)
export async function checkAndAwardAchievements(userId: string, eventType: string, context?: Record<string, unknown>) {
  if (!isSupabaseConfigured()) return;
  const supabase = await createClient();
  // Example: FIRST_ASSIGNMENT on AssignmentSubmitted count >=1
  if (eventType === "AssignmentSubmitted") {
    const { count } = await supabase.from("submissions").select("*", { count: "exact", head: true }).eq("user_id", userId).eq("status", "SUBMITTED");
    if ((count || 0) >= 1) {
      const { data: ach } = await supabase.from("achievements").select("id").eq("slug", "FIRST_ASSIGNMENT").maybeSingle();
      if (ach) await supabase.from("user_achievements").upsert({ user_id: userId, achievement_id: (ach as { id: string }).id, source_type: eventType }, { onConflict: "user_id,achievement_id" });
    }
    if ((count || 0) >= 10) {
      const { data: ach } = await supabase.from("achievements").select("id").eq("slug", "TEN_ASSIGNMENTS").maybeSingle();
      if (ach) await supabase.from("user_achievements").upsert({ user_id: userId, achievement_id: (ach as { id: string }).id }, { onConflict: "user_id,achievement_id" });
    }
  }
  // Additional rules can be added: QUIZ_MASTER, etc.
  // After award, optionally create point transaction
}
