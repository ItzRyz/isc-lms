import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { getCourses, getDivisionsForLearning } from "@/features/learning/actions";
import { CourseCard } from "@/features/learning/components/course-card";
import { CourseFormDialog } from "@/features/learning/components/course-form";
import { Search } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; division?: string }>;
}) {
  const { q, division } = await searchParams;
  const divisions = await getDivisionsForLearning();
  const courses = (await getCourses(division)) as Array<{ id: string; name: string; slug: string; description: string | null; is_published: boolean; scheduled_at: string | null; estimated_duration: number | null; division_name?: string }>;
  const filtered = q
    ? courses.filter((c) => c.name.toLowerCase().includes(q.toLowerCase()) || c.slug.includes(q.toLowerCase()))
    : courses;
  const isMock = courses.length === 1 && courses[0]?.id === "course-fe";

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Learning</h1>
          <p className="text-muted-foreground">Division → Course → Module → Material • DAG prerequisites • Progress 40/30/30 • Draft/Publish • Bookmark</p>
        </div>
        <Badge variant="outline">P3 LMS Core</Badge>
      </div>

      {isMock && (
        <Card className="border-amber-200 bg-amber-50 dark:bg-amber-950/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-amber-900 dark:text-amber-200">Dev fallback — Supabase belum configured</CardTitle>
            <CardDescription className="text-amber-700 dark:text-amber-300">Set Supabase env & `npx supabase db push` migration 003/004 untuk courses real.</CardDescription>
          </CardHeader>
        </Card>
      )}

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-2">
          <div>
            <CardTitle>Courses</CardTitle>
            <CardDescription>Filter by division • Search • is_published & scheduled_at gate • Coordinator scoped DIVISION</CardDescription>
          </div>
          <CourseFormDialog divisions={divisions as never} triggerLabel="Create Course" />
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Button variant={!division ? "default" : "outline"} render={<Link href="/learning" />}>
              All
            </Button>
            {divisions.map((d) => (
              <Button key={d.id} variant={division === d.slug ? "default" : "outline"} render={<Link href={`/learning?division=${d.slug}`} />}>
                {d.name}
              </Button>
            ))}
          </div>

          <div className="relative max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <form>
              <Input name="q" placeholder="Search course..." defaultValue={q || ""} className="pl-8" />
              {division && <input type="hidden" name="division" value={division} />}
            </form>
          </div>

          {filtered.length ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filtered.map((c) => (
                <CourseCard key={c.id} course={c as never} />
              ))}
            </div>
          ) : (
            <div className="rounded-md border border-dashed p-8 text-center text-muted-foreground">
              <p>No courses found.</p>
              <p className="text-sm">Create one — coordinator hanya bisa di division own.</p>
            </div>
          )}
          <p className="text-xs text-muted-foreground">Total: {filtered.length} courses • Unique(division_id, slug) • RLS published gate • Progress via material_progress snapshots</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">P3 Full Spec (jawaban user)</CardTitle>
        </CardHeader>
        <CardContent className="text-xs text-muted-foreground space-y-1">
          <p>✓ Material types: DOCUMENT/LINK/VIDEO/ASSIGNMENT_REF/QUIZ_REF • Storage `materials` bucket (private signed URL)</p>
          <p>✓ DAG prerequisites multi-parent (material_prerequisites) — Next needs React+HTML, blocked jika prereq belum completed</p>
          <p>✓ Progress full `material*0.4+assignment*0.3+quiz*0.3` snapshots • Bookmark • Versioning • scheduled_at • visibility</p>
          <p>✓ Draft/Publish, Tags, Search (ILIKE + tsvector), Calendar (ACADEMIC_EVENT)</p>
        </CardContent>
      </Card>
    </div>
  );
}
