import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getAssignments } from "@/features/assignments/actions";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

function isSupabaseConfigured(): boolean {
  return !!process.env.NEXT_PUBLIC_SUPABASE_URL && !!(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY);
}

export default async function Page() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return <div className="p-6">Login required</div>;

  const { data: roles } = await supabase.from("user_roles").select("roles(name)").eq("user_id", user.id);
  const isMentor = (roles as Array<{ roles: { name: string } }> | null)?.some((r) => r.roles.name === "MENTOR" || r.roles.name.endsWith("_COORDINATOR") || r.roles.name === "SUPER_ADMIN");
  if (!isMentor) return <div className="p-6"><Card className="border-destructive"><CardHeader><CardTitle>Forbidden — Mentor Only</CardTitle></CardHeader></Card></div>;

  const assignments = await getAssignments();
  // Filter to mentor's class: fetch class_members where user is mentor's class
  const { data: cms } = await supabase.from("class_members").select("class_id").eq("user_id", user.id);
  const classIds = (cms as Array<{ class_id: string }> | null)?.map((c) => c.class_id) || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Mentor / Assignments</h1>
        <p className="text-muted-foreground">SCOPED CLASS — mentor grade assignment.view/grade • Class {classIds.join(", ") || "—"}</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Assignments to Grade</CardTitle>
          <CardDescription>Server validates assignment.grade scoped CLASS • RLS has_permission</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Course</TableHead>
                  <TableHead>Due</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(assignments as Array<{ id: string; title: string; course_name?: string; due_at: string | null }>).map((a) => (
                  <TableRow key={a.id}>
                    <TableCell className="font-medium">{a.title}</TableCell>
                    <TableCell>{a.course_name || a.id.slice(0, 8)}</TableCell>
                    <TableCell className="text-xs">{a.due_at ? new Date(a.due_at).toLocaleDateString() : "—"}</TableCell>
                    <TableCell><Badge variant="outline">Grade</Badge></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
