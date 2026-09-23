import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { createClient } from "@/lib/supabase/server";
import { getAttendanceRecords } from "@/features/attendance/actions";

export const dynamic = "force-dynamic";

export default async function Page() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return <div className="p-6">Login required</div>;

  const records = await getAttendanceRecords();
  // Filter to mentor's class: fetch class_members for mentor
  const { data: cm } = await supabase.from("class_members").select("class_id").eq("user_id", user.id);
  const classIds = (cm as Array<{ class_id: string }> | null)?.map((c) => c.class_id) || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Mentor / Attendance</h1>
        <p className="text-muted-foreground">RW S scoped CLASS • Records PRESENT/LATE etc • is_class_member • Correction audited</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Attendance Records (scoped)</CardTitle>
          <CardDescription>Class {classIds.join(", ") || "—"} • RLS attendance.view • Server Haversine</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Time</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(records as Array<{ id: string; status: string; checked_in_at: string | null; profiles?: { email: string; full_name: string | null } }>).slice(0, 20).map((r) => (
                  <TableRow key={r.id}>
                    <TableCell>{r.profiles?.full_name || r.profiles?.email || r.id.slice(0, 8)}</TableCell>
                    <TableCell><Badge variant={r.status === "PRESENT" ? "default" : "secondary"}>{r.status}</Badge></TableCell>
                    <TableCell className="text-xs">{r.checked_in_at ? new Date(r.checked_in_at).toLocaleString() : "—"}</TableCell>
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
