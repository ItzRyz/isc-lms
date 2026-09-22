import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getQuizzes } from "@/features/quizzes/actions";
import { getCourses } from "@/features/learning/actions";
import { QuizCard } from "@/features/quizzes/components/quiz-card";
import { QuizFormDialog } from "@/features/quizzes/components/quiz-form";

export const dynamic = "force-dynamic";

export default async function Page({ searchParams }: { searchParams: Promise<{ course_id?: string }> }) {
  const { course_id } = await searchParams;
  const [quizzes, courses] = await Promise.all([getQuizzes(course_id), getCourses()]);
  const isMock = quizzes.length === 2 && quizzes[0]?.id === "quiz-html";

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Quizzes</h1>
          <p className="text-muted-foreground">ICE_BREAKING/WEEKLY/ASSESSMENT • MULTIPLE_CHOICE/TRUE_FALSE/MULTIPLE_ANSWER • Random • Timer • Auto-grade</p>
        </div>
        <Badge variant="outline">P5 Quiz</Badge>
      </div>

      {isMock && (
        <Card className="border-amber-200 bg-amber-50 dark:bg-amber-950/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-amber-900 dark:text-amber-200">Dev fallback — Supabase belum configured</CardTitle>
            <CardDescription className="text-amber-700 dark:text-amber-300">Set Supabase env & `npx supabase db push` migration 006 untuk quizzes real.</CardDescription>
          </CardHeader>
        </Card>
      )}

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-2">
          <div>
            <CardTitle>Quizzes</CardTitle>
            <CardDescription>Random questions/choices server-side • Timer server-validated • Attempt limit • Score server-calculated</CardDescription>
          </div>
          <QuizFormDialog courses={courses as never} triggerLabel="Create Quiz" />
        </CardHeader>
        <CardContent>
          {quizzes.length ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {quizzes.map((q) => (
                <QuizCard key={(q as { id: string }).id} quiz={q as never} />
              ))}
            </div>
          ) : (
            <div className="rounded-md border border-dashed p-8 text-center text-muted-foreground">
              <p>No quizzes.</p>
              <p className="text-sm">Mentor create — bank, random, timer, auto-grade.</p>
            </div>
          )}
          <p className="text-xs text-muted-foreground mt-4">Total: {quizzes.length} • Types: ICE_BREAKING/WEEKLY/ASSESSMENT • Question types 3 • Shuffle server-side • Do not trust client score</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">P5 Spec</CardTitle>
        </CardHeader>
        <CardContent className="text-xs text-muted-foreground space-y-1">
          <p>✓ Question bank (questions + quiz_questions) • Random questions/choices via shuffle() server • Timer expires_at = started_at + duration</p>
          <p>✓ Attempt history (quiz_attempts) + score history • Max attempts • Server validates availability/start/end, ownership • Feedback via explanation</p>
          <p>✓ Auto-grade TRUE_FALSE/MULTIPLE_CHOICE/MULTIPLE_ANSWER (exact match correctIds)</p>
        </CardContent>
      </Card>
    </div>
  );
}
