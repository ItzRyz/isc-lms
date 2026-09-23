import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function Page() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return <div className="p-6">Login required — /login</div>;

  const { data: roles } = await supabase.from("user_roles").select("roles(name)").eq("user_id", user.id);
  const roleNames = (roles as Array<{ roles: { name: string } }> | null)?.map((r) => r.roles.name) || [];
  const isCoordinator = roleNames.some((n) => n.endsWith("_COORDINATOR")) || roleNames.includes("SUPER_ADMIN") || roleNames.includes("LEADER");
  if (!isCoordinator) {
    return (
      <div className="p-6">
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle>Forbidden — Coordinator Only</CardTitle>
            <CardDescription>Requires WEB/ML/UIUX_COORDINATOR or SUPER_ADMIN/LEADER</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  // Own divisions
  const { data: ud } = await supabase.from("user_divisions").select("division_id, divisions(id, name, slug, description)").eq("user_id", user.id);
  const divisions = (ud as Array<{ division_id: string; divisions: { id: string; name: string; slug: string; description: string | null } }> | null)?.map((r) => r.divisions) || [];

  // If SUPER_ADMIN/LEADER, show all divisions fallback
  let displayDivisions = divisions;
  if (displayDivisions.length === 0 && (roleNames.includes("SUPER_ADMIN") || roleNames.includes("LEADER"))) {
    const { data: all } = await supabase.from("divisions").select("id, name, slug, description").is("deleted_at", null).limit(10);
    displayDivisions = (all as never) || [];
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Coordinator / Division</h1>
        <p className="text-muted-foreground">CRUD own DIVISION • RLS is_division_member • Roles: {roleNames.join(", ") || "—"}</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>My Divisions</CardTitle>
          <CardDescription>Scoped DIVISION — coordinator hanya bisa manage division own (can() + is_division_member)</CardDescription>
        </CardHeader>
        <CardContent>
          {displayDivisions.length ? (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Slug</TableHead>
                    <TableHead>Description</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {displayDivisions.map((d) => (
                    <TableRow key={d.id}>
                      <TableCell className="font-medium">{d.name}</TableCell>
                      <TableCell><code className="text-xs bg-muted px-1 py-0.5 rounded">{d.slug}</code></TableCell>
                      <TableCell className="text-sm text-muted-foreground">{d.description || "—"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No division assigned. Contact SUPER_ADMIN to assign via user_divisions.</p>
          )}
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Next</CardTitle>
        </CardHeader>
        <CardContent className="text-xs text-muted-foreground">
          <p>Coordinator courses/materials/reports filter by own division_id via is_division_member. See /coordinator/courses (filtered).</p>
        </CardContent>
      </Card>
    </div>
  );
}
