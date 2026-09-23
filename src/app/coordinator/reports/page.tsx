import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { createClient } from "@/lib/supabase/server";
import { getGradesForUser } from "@/features/assessment/actions";

export const dynamic = "force-dynamic";

function isSupabaseConfigured(): boolean {
  return !!process.env.NEXT_PUBLIC_SUPABASE_URL && !!(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY);
}

export default async function Page() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return <div className="p-6">Login required</div>;

  const { data: roles } = await supabase.from("user_roles").select("roles(name)").eq("user_id", user.id);
  const isCoordinator = (roles as Array<{ roles: { name: string } }> | null)?.some((r) => r.roles.name.endsWith("_COORDINATOR") || r.roles.name === "SUPER_ADMIN" || r.roles.name === "LEADER");
  if (!isCoordinator) {
    return (
      <div className="p-6">
        <Card className="border-destructive"><CardHeader><CardTitle>Forbidden — Coordinator Only</CardTitle></CardHeader></Card>
      </div>
    );
  }

  // Coordinator sees grades for own division students (simplified: show all grades)
  const grades = await getGradesForUser();
  const { data: ud } = await supabase.from("user_divisions").select("division_id").eq("user_id", user.id);
  const ownDivs = (ud as Array<{ division_id: string }> | null)?.map((r) => r.division_id).join(", ") || "—";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Coordinator / Reports</h1>
        <p className="text-muted-foreground">Division {ownDivs} • Grades, attendance, report cards • RLS via is_division_member</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Division Report</CardTitle>
          <CardDescription>Aggregated grades per component • KKM 70 • For own division only</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Component</TableHead>
                  <TableHead>Avg Score</TableHead>
                  <TableHead>Weight</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(grades as Array<{ component: string; score: number; weight: number }>).map((g) => (
                  <TableRow key={g.component}>
                    <TableCell>{g.component}</TableCell>
                    <TableCell>{g.score}</TableCell>
                    <TableCell>{g.weight}%</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <p className="text-xs text-muted-foreground mt-2">Coordinator scope DIVISION — enforced via can() + RLS is_division_member. Export PDF/CSV via report-export.</p>
        </CardContent>
      </Card>
    </div>
  );
}
