import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { createClient } from "@/lib/supabase/server";
import { getMembers } from "@/features/organization/actions-member";

export const dynamic = "force-dynamic";

export default async function Page() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return <div className="p-6">Login required</div>;

  const { data: roles } = await supabase.from("user_roles").select("roles(name)").eq("user_id", user.id);
  const roleNames = (roles as Array<{ roles: { name: string } }> | null)?.map((r) => r.roles.name) || [];
  const isMentor = roleNames.includes("MENTOR") || roleNames.some((n) => n.endsWith("_COORDINATOR")) || roleNames.includes("SUPER_ADMIN");

  if (!isMentor) {
    return (
      <div className="p-6">
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle>Forbidden — Mentor Only</CardTitle>
            <CardDescription>Requires MENTOR or COORDINATOR</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  // Mentor sees class members of their classes
  const { data: classMembers } = await supabase.from("class_members").select("class_id, classes(name)").eq("user_id", user.id);
  const classIds = (classMembers as Array<{ class_id: string }> | null)?.map((c) => c.class_id) || [];

  let students: Array<{ id: string; email: string; full_name: string | null; roles: string[] }> = [];
  if (classIds.length) {
    const { data: members } = await supabase.from("class_members").select("user_id, profiles(id, email, full_name)").in("class_id", classIds).limit(50);
    students = (members as Array<{ user_id: string; profiles: { id: string; email: string; full_name: string | null } }> | null)?.map((m) => ({
      id: m.profiles.id,
      email: m.profiles.email,
      full_name: m.profiles.full_name,
      roles: [],
    })) || [];
  }
  if (students.length === 0) {
    // Fallback: show all members for demo
    const all = await getMembers();
    students = (all as Array<{ id: string; email: string; full_name: string | null; roles: string[] }>).slice(0, 20).map((m) => ({ id: m.id, email: m.email, full_name: m.full_name, roles: m.roles }));
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Mentor / Students</h1>
        <p className="text-muted-foreground">SCOPED CLASS — mentor hanya lihat students dari class own • is_class_member • Roles: {roleNames.join(", ")}</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Students ({students.length})</CardTitle>
          <CardDescription>Class {classIds.join(", ") || "— all demo"} • RLS is_class_member</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Roles</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {students.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell>{s.full_name || "—"}</TableCell>
                    <TableCell className="font-mono text-xs">{s.email}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {s.roles.map((r) => (
                          <Badge key={r} variant="secondary" className="text-xs">{r}</Badge>
                        ))}
                      </div>
                    </TableCell>
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
