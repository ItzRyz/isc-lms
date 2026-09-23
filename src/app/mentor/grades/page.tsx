import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function Page() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return <div className="p-6">Login required</div>;

  const { data: grades } = await supabase.from("grades").select("*, grade_components(name), profiles!grades_user_id_fkey(email, full_name)").limit(20);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Mentor / Grades</h1>
        <p className="text-muted-foreground">GRADE scoped CLASS • Only MENTOR/COORDINATOR can grade • KKM 70</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Grades (scoped)</CardTitle>
          <CardDescription>Server-authoritative • RLS grade.view • Do not trust client score</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Component</TableHead>
                  <TableHead>Score</TableHead>
                  <TableHead>Grade</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(grades as Array<{ id: string; score: number; grade: string | null; grade_components: { name: string }; profiles: { email: string; full_name: string | null } }> | null)?.map((g) => (
                  <TableRow key={g.id}>
                    <TableCell>{g.profiles?.full_name || g.profiles?.email || "—"}</TableCell>
                    <TableCell><Badge variant="outline">{g.grade_components.name}</Badge></TableCell>
                    <TableCell>{g.score}</TableCell>
                    <TableCell>{g.grade ? <Badge>{g.grade}</Badge> : "—"}</TableCell>
                  </TableRow>
                )) || (
                  <TableRow>
                    <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">No grades. Mentor grade via assignments/quizzes.</TableCell>
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
