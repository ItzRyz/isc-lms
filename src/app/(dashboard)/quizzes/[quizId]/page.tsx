import Link from "next/link";
import { notFound } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getQuizById, getQuizAttempts, startQuizAttempt } from "@/features/quizzes/actions";
import { ArrowLeft, Clock, Trophy, Shuffle } from "lucide-react";

export const dynamic = "force-dynamic";

function isSupabaseConfigured(): boolean {
  return !!process.env.NEXT_PUBLIC_SUPABASE_URL && !!(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY);
}

export default async function Page({ params }: { params: Promise<{ quizId: string }> }) {
  const { quizId } = await params;
  const quiz = (await getQuizById(quizId)) as {
    id: string;
    title: string;
    description: string | null;
    type: string;
    duration_minutes: number;
    max_attempts: number;
    is_published: boolean;
    available_from: string | null;
    available_until: string | null;
    pass_score: number;
    shuffle_questions: boolean;
    shuffle_choices: boolean;
  } | null;
  if (!quiz) notFound();

  const attempts = (await getQuizAttempts(quizId)) as Array<{ id: string; attempt_number: number; status: string; score: number | null; max_score: number | null; started_at: string; submitted_at: string | null }>;
  const canStart = attempts.length < quiz.max_attempts || quiz.max_attempts === 0;
  const lastScore = attempts.length ? attempts[attempts.length - 1].score : null;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" render={<Link href="/quizzes" />}>
          <ArrowLeft className="mr-1 h-4 w-4" /> Back
        </Button>
        <Badge variant={quiz.is_published ? "default" : "outline"}>{quiz.is_published ? "Published" : "Draft"}</Badge>
        <Badge variant="outline">{quiz.type}</Badge>
      </div>

      <div>
        <h1 className="text-2xl font-semibold">{quiz.title}</h1>
        <p className="text-muted-foreground">{quiz.description || "—"}</p>
        <div className="mt-2 flex flex-wrap gap-2 text-xs text-muted-foreground">
          <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {quiz.duration_minutes}m</span>
          <span className="flex items-center gap-1"><Trophy className="h-3 w-3" /> Pass {quiz.pass_score}%</span>
          <span className="flex items-center gap-1"><Shuffle className="h-3 w-3" /> Qs {quiz.shuffle_questions ? "shuffle" : "ordered"} • Choices {quiz.shuffle_choices ? "shuffle" : "ordered"}</span>
          <span>Max {quiz.max_attempts}x</span>
          <span>Available: {quiz.available_from ? new Date(quiz.available_from).toLocaleDateString() : "always"} → {quiz.available_until ? new Date(quiz.available_until).toLocaleDateString() : "no end"}</span>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Start Attempt</CardTitle>
          <CardDescription>Server validates: availability window, attempt limit, ownership. Timer starts on start, expires_at = started_at + duration.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm">Attempts: {attempts.length} / {quiz.max_attempts} {lastScore !== null && `• Last score: ${lastScore}%`}</p>
          {canStart ? (
            <form
              action={async () => {
                "use server";
                const res = await startQuizAttempt(quizId);
                if (res.success && res.data) {
                  const { redirect } = await import("next/navigation");
                  redirect(`/quizzes/${quizId}/attempt/${(res.data as { attemptId: string }).attemptId}`);
                }
              }}
            >
              <Button type="submit">Start Quiz</Button>
            </form>
          ) : (
            <p className="text-sm text-destructive">Max attempts reached ({quiz.max_attempts}).</p>
          )}
          <p className="text-xs text-muted-foreground">Random questions/choices shuffled server-side in getQuestionsForAttempt — client never sees is_correct.</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Attempt History</CardTitle>
          <CardDescription>Score history • Auto-grade • Feedback via explanation</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>#</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Score</TableHead>
                  <TableHead>Started</TableHead>
                  <TableHead>Submitted</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {attempts.length ? (
                  attempts.map((a) => (
                    <TableRow key={a.id}>
                      <TableCell>{a.attempt_number}</TableCell>
                      <TableCell><Badge variant={a.status === "GRADED" ? "default" : a.status === "IN_PROGRESS" ? "secondary" : "outline"}>{a.status}</Badge></TableCell>
                      <TableCell>{a.score !== null ? `${a.score}%` : "—"}</TableCell>
                      <TableCell className="text-xs">{new Date(a.started_at).toLocaleString()}</TableCell>
                      <TableCell className="text-xs">{a.submitted_at ? new Date(a.submitted_at).toLocaleString() : "—"}</TableCell>
                      <TableCell>
                        {a.status === "IN_PROGRESS" ? (
                          <Button variant="outline" size="sm" render={<Link href={`/quizzes/${quizId}/attempt/${a.id}`} />}>Continue</Button>
                        ) : (
                          <Button variant="outline" size="sm" render={<Link href={`/quizzes/${quizId}/attempt/${a.id}`} />}>View</Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">No attempts yet. Click Start.</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
