import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getAchievements } from "@/features/achievements/actions";
import { Trophy, Award, Star } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function Page() {
  const achievements = await getAchievements();
  const earnedCount = achievements.filter((a) => (a as { earned: boolean }).earned).length;
  const isMock = achievements.length === 7;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Achievements</h1>
          <p className="text-muted-foreground">Gamification — event-driven awarding • FIRST_ASSIGNMENT, QUIZ_MASTER, ROADMAP_COMPLETED • Points reward</p>
        </div>
        <Badge variant="outline">P9 Gamification</Badge>
      </div>

      {isMock && (
        <Card className="border-amber-200 bg-amber-50 dark:bg-amber-950/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-amber-900 dark:text-amber-200">Dev fallback — Supabase belum configured</CardTitle>
            <CardDescription className="text-amber-700 dark:text-amber-300">Supabase `npx supabase db push` migration 010 untuk achievements real.</CardDescription>
          </CardHeader>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 border-amber-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2"><Trophy className="h-4 w-4 text-amber-600" /> Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{earnedCount} / {achievements.length}</div>
            <p className="text-xs text-muted-foreground">Earned • Event-driven: AssignmentSubmitted → Rule → Award</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Points from Achievements</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{achievements.filter((a) => (a as { earned: boolean }).earned).reduce((sum, a) => sum + (a as { points_reward: number }).points_reward, 0)}</div>
            <p className="text-xs text-muted-foreground">Via point_transactions on award</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {(achievements as Array<{ slug: string; name: string; description: string | null; icon: string | null; points_reward: number; earned: boolean; earned_at: string | null }>).map((a) => (
          <Card key={a.slug} className={a.earned ? "border-green-200 bg-green-50 dark:bg-green-950/20" : "opacity-70"}>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <span className="text-lg">{a.icon || "🏆"}</span> {a.name}
                {a.earned ? <Badge className="bg-green-600">Earned</Badge> : <Badge variant="outline">Locked</Badge>}
              </CardTitle>
              <CardDescription>{a.description || "—"}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <span className="text-xs flex items-center gap-1"><Star className="h-3 w-3" /> +{a.points_reward} pts</span>
                {a.earned_at && <span className="text-xs text-muted-foreground">{new Date(a.earned_at).toLocaleDateString()}</span>}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Slug: {a.slug} • Rule event_type in achievement_rules</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
