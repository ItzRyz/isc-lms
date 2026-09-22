import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getAssignments } from "@/features/assignments/actions";
import { getCourses } from "@/features/learning/actions";
import { AssignmentCard } from "@/features/assignments/components/assignment-card";
import { AssignmentFormDialog } from "@/features/assignments/components/assignment-form";

export const dynamic = "force-dynamic";

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ course_id?: string }>;
}) {
  const { course_id } = await searchParams;
  const [assignmentsRaw, courses] = await Promise.all([getAssignments(course_id), getCourses()]);
  const assignments = assignmentsRaw as Array<{ id: string; title: string; description: string | null; type: "INDIVIDUAL" | "GROUP"; submission_type: "FILE" | "TEXT" | "FILE_AND_TEXT"; due_at: string | null; allow_late: boolean; max_score: number; is_published: boolean }>;
  const isMock = assignments.length === 2 && assignments[0]?.id === "assign-html";

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Assignments</h1>
          <p className="text-muted-foreground">INDIVIDUAL/GROUP • FILE/TEXT/FILE_AND_TEXT • 8 status • deadline server-side • autosave draft • rubric</p>
        </div>
        <Badge variant="outline">P4 Assignments</Badge>
      </div>

      {isMock && (
        <Card className="border-amber-200 bg-amber-50 dark:bg-amber-950/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-amber-900 dark:text-amber-200">Dev fallback — Supabase belum configured</CardTitle>
            <CardDescription className="text-amber-700 dark:text-amber-300">Set Supabase env & `npx supabase db push` migration 005 untuk assignments real.</CardDescription>
          </CardHeader>
        </Card>
      )}

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-2">
          <div>
            <CardTitle>Assignments</CardTitle>
            <CardDescription>Filter by course • Mentor dapat create (assignment.create) • Student O/R • Late server-authoritative</CardDescription>
          </div>
          <AssignmentFormDialog courses={courses as never} triggerLabel="Create Assignment" />
        </CardHeader>
        <CardContent>
          {assignments.length ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {assignments.map((a) => (
                <AssignmentCard key={a.id} assignment={a as never} />
              ))}
            </div>
          ) : (
            <div className="rounded-md border border-dashed p-8 text-center text-muted-foreground">
              <p>No assignments.</p>
              <p className="text-sm">Mentor/coordinator create — deadline validation server-side.</p>
            </div>
          )}
          <p className="text-xs text-muted-foreground mt-4">Total: {assignments.length} • Statuses: NOT_STARTED/DRAFT/SUBMITTED/LATE/GRADED/REVISION_REQUIRED/RESUBMITTED • File private bucket assignment-submissions</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">P4 Full Spec</CardTitle>
        </CardHeader>
        <CardContent className="text-xs text-muted-foreground space-y-1">
          <p>✓ INDIVIDUAL/GROUP (assignment_groups) • FILE/TEXT/FILE_AND_TEXT • autosave draft 2s • file 10MB • MIME validated</p>
          <p>✓ Deadline server-side — LATE vs SUBMITTED, allow_late gate • max_attempts • rubric 4 criteria • grading history submission_revisions</p>
          <p>✓ Mentor feedback & revision (REVISION_REQUIRED → RESUBMITTED) • Storage private signed URL • audit preserved</p>
        </CardContent>
      </Card>
    </div>
  );
}
