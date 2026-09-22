import Link from "next/link";
import { notFound } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getAssignmentById, getSubmission, getSubmissionsForAssignment } from "@/features/assignments/actions";
import { SubmissionForm } from "@/features/assignments/components/submission-form";
import { GradingPanel } from "@/features/assignments/components/grading-panel";
import { createClient } from "@/lib/supabase/server";
import { ArrowLeft, Calendar, Clock, FileText, Users, Award } from "lucide-react";

export const dynamic = "force-dynamic";

function isSupabaseConfigured(): boolean {
  return !!process.env.NEXT_PUBLIC_SUPABASE_URL && !!(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY);
}

export default async function Page({ params }: { params: Promise<{ assignmentId: string }> }) {
  const { assignmentId } = await params;
  const assignment = await getAssignmentById(assignmentId);
  if (!assignment) notFound();

  const a = assignment as {
    id: string;
    title: string;
    description: string | null;
    type: string;
    submission_type: string;
    due_at: string | null;
    allow_late: boolean;
    max_score: number;
    is_published: boolean;
    course_id: string;
  };

  // Current user submission (student view)
  const submission = (await getSubmission(assignmentId)) as {
    id: string;
    status: string;
    content_text: string | null;
    score: number | null;
    feedback: string | null;
  } | null;

  // Mentor view: all submissions + rubric
  let submissionsForMentor: Array<{
    id: string;
    user_id: string;
    status: string;
    score: number | null;
    feedback: string | null;
    content_text: string | null;
    profiles?: { email: string; full_name: string | null };
  }> = [];
  let rubric: { id: string; title: string; items: { id: string; criterion: string; max_points: number }[] } | null = null;
  let isMentor = false;

  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: roles } = await supabase.from("user_roles").select("roles(name)").eq("user_id", user.id);
      const roleNames = (roles || []).map((r: unknown) => (r as { roles: { name: string } }).roles.name);
      isMentor = roleNames.includes("MENTOR") || roleNames.some((n: string) => n.endsWith("_COORDINATOR")) || roleNames.includes("SUPER_ADMIN") || roleNames.includes("LEADER");
      if (isMentor) {
        submissionsForMentor = (await getSubmissionsForAssignment(assignmentId)) as never;
        // Fetch rubric
        const { data: rub } = await supabase.from("rubrics").select("id, title").eq("assignment_id", assignmentId).maybeSingle();
        if (rub) {
          const { data: items } = await supabase.from("rubric_items").select("id, criterion, max_points").eq("rubric_id", (rub as { id: string }).id).order("order_index");
          rubric = { id: (rub as { id: string }).id, title: (rub as { title: string }).title, items: (items as never) || [] };
        }
      }
    }
  } else {
    // Dev fallback: simulate mentor view with mock submissions
    isMentor = true;
    submissionsForMentor = [
      { id: "sub1", user_id: "m3", status: "SUBMITTED", score: null, feedback: null, content_text: "Landing page sudah jadi...", profiles: { email: "member@example.com", full_name: "Member ML" } },
      { id: "sub2", user_id: "m2", status: "LATE", score: null, feedback: null, content_text: "Maaf terlambat...", profiles: { email: "mentor@example.com", full_name: "Mentor Web" } },
    ];
    rubric = {
      id: "rub1",
      title: "Rubrik HTML",
      items: [
        { id: "ri1", criterion: "Struktur Semantik", max_points: 30 },
        { id: "ri2", criterion: "Responsif", max_points: 30 },
        { id: "ri3", criterion: "Validasi HTML", max_points: 20 },
        { id: "ri4", criterion: "Kreativitas", max_points: 20 },
      ],
    };
  }

  const dueAt = a.due_at ? new Date(a.due_at) : null;
  const isOverdue = dueAt ? new Date() > dueAt : false;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" render={<Link href="/assignments" />}>
          <ArrowLeft className="mr-1 h-4 w-4" /> Back
        </Button>
        <Badge variant={a.is_published ? "default" : "outline"}>{a.is_published ? "Published" : "Draft"}</Badge>
        <Badge variant="outline">{a.type}</Badge>
        <Badge variant="outline">{a.submission_type}</Badge>
      </div>

      <div>
        <h1 className="text-2xl font-semibold">{a.title}</h1>
        <p className="text-muted-foreground whitespace-pre-wrap">{a.description || "—"}</p>
        <div className="mt-2 flex flex-wrap gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Calendar className="h-3 w-3" /> Due: {a.due_at ? new Date(a.due_at).toLocaleString() : "No deadline"}
          </span>
          {isOverdue && <Badge variant={a.allow_late ? "secondary" : "destructive"}>{a.allow_late ? "Late allowed" : "Closed"}</Badge>}
          <span className="flex items-center gap-1">
            <Award className="h-3 w-3" /> Max {a.max_score}
          </span>
          <span className="flex items-center gap-1">
            <Users className="h-3 w-3" /> {a.type}
          </span>
          <span className="flex items-center gap-1">
            <FileText className="h-3 w-3" /> {a.submission_type}
          </span>
        </div>
      </div>

      {/* Student view: submission form */}
      <Card>
        <CardHeader>
          <CardTitle>Your Submission</CardTitle>
          <CardDescription>
            Autosave draft 2s (text) • Deadline server-side → LATE • File private bucket • {submission ? `Current: ${submission.status}` : "NOT_STARTED"}
            {submission?.status === "GRADED" && ` • Score ${submission.score}`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SubmissionForm assignment={a as never} existingSubmission={submission as never} />
        </CardContent>
      </Card>

      {/* Rubric display for student (read-only) */}
      {rubric && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Rubric: {rubric.title}</CardTitle>
            <CardDescription>4 criteria • total {rubric.items.reduce((sum, it) => sum + it.max_points, 0)} points</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Criterion</TableHead>
                    <TableHead>Max</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rubric.items.map((it) => (
                    <TableRow key={it.id}>
                      <TableCell>{it.criterion}</TableCell>
                      <TableCell>{it.max_points}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Mentor view: all submissions + grading */}
      {isMentor && (
        <Card>
          <CardHeader>
            <CardTitle>Mentor — Submissions & Grading</CardTitle>
            <CardDescription>Role MENTOR/WEB_COORDINATOR can grade (assignment.grade scoped CLASS) • History in submission_revisions</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {submissionsForMentor.length ? (
              submissionsForMentor.map((sub) => (
                <GradingPanel key={sub.id} submission={sub as never} rubric={rubric} />
              ))
            ) : (
              <p className="text-sm text-muted-foreground">No submissions yet. Students will appear here after SUBMITTED/LATE.</p>
            )}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">P4 Details</CardTitle>
        </CardHeader>
        <CardContent className="text-xs text-muted-foreground space-y-1">
          <p>Statuses: NOT_STARTED→DRAFT→SUBMITTED/LATE→GRADED/REVISION_REQUIRED→RESUBMITTED • Resubmit creates new attempt (max_attempts)</p>
          <p>GROUP: assignment_groups + group_members • File private `assignment-submissions` signed URL • Grading history submission_revisions preserved</p>
        </CardContent>
      </Card>
    </div>
  );
}
