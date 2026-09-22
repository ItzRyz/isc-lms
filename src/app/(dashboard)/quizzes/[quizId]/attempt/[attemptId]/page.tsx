import Link from "next/link";
import { notFound } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getQuizById, getAttemptById, getQuestionsForAttempt, getQuizAttempts } from "@/features/quizzes/actions";
import { AttemptForm } from "@/features/quizzes/components/attempt-form";
import { ArrowLeft, Trophy } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function Page({ params }: { params: Promise<{ quizId: string; attemptId: string }> }) {
  const { quizId, attemptId } = await params;
  const quiz = (await getQuizById(quizId)) as { id: string; title: string; duration_minutes: number; pass_score: number } | null;
  if (!quiz) notFound();

  const attempt = (await getAttemptById(attemptId)) as { id: string; status: string; score: number | null; max_score: number | null; started_at: string; expires_at: string | null; submitted_at: string | null } | null;
  if (!attempt) notFound();

  const isGraded = attempt.status === "GRADED" || attempt.status === "EXPIRED";
  const questions = isGraded ? [] : await getQuestionsForAttempt(attemptId);

  // For graded, fetch answers + correct for feedback (mock: show questions with explanation)
  // In dev mock, questions already stripped is_correct, but for graded we need to fetch full for explanation
  // Simplify: if graded, show score + history link

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" render={<Link href={`/quizzes/${quizId}`} />}>
          <ArrowLeft className="mr-1 h-4 w-4" /> Back to Quiz
        </Button>
        <Badge variant={isGraded ? "default" : "secondary"}>{attempt.status}</Badge>
        {attempt.score !== null && <Badge variant="outline">Score {attempt.score}%</Badge>}
      </div>

      <div>
        <h1 className="text-2xl font-semibold">{quiz.title} — Attempt {attemptId.slice(0, 8)}</h1>
        <p className="text-muted-foreground">Duration {quiz.duration_minutes}m • Pass {quiz.pass_score}% • Questions {questions.length || "—"} • Started {new Date(attempt.started_at).toLocaleString()}</p>
      </div>

      {isGraded ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5" /> Result
            </CardTitle>
            <CardDescription>Auto-graded server-side • Feedback via explanation • Score history preserved</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-2xl font-bold">{attempt.score ?? "—"}% {attempt.score !== null && attempt.score >= quiz.pass_score ? "— Pass" : attempt.score !== null ? "— Fail" : ""}</p>
            <p className="text-sm text-muted-foreground">Submitted: {attempt.submitted_at ? new Date(attempt.submitted_at).toLocaleString() : "—"} • Expires: {attempt.expires_at ? new Date(attempt.expires_at).toLocaleString() : "—"}</p>
            <p className="text-xs text-muted-foreground">Do not trust client score — server via correct choices JSONB is_correct. For detail per-question feedback, see quiz_answers + questions.explanation (P5 full).</p>
            <Button variant="outline" render={<Link href={`/quizzes/${quizId}`} />}>Back to attempts</Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Questions — Randomized (server)</CardTitle>
            <CardDescription>Timer server-validated: expires_at = started_at + duration. Auto-submit when 0. Shuffle Qs & choices if quiz flags set.</CardDescription>
          </CardHeader>
          <CardContent>
            <AttemptForm attemptId={attemptId} questions={questions as never} expiresAt={attempt.expires_at} durationMinutes={quiz.duration_minutes} />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
