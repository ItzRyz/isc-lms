import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getPermissions } from "@/features/admin/actions";

export const dynamic = "force-dynamic";

export default async function Page() {
  const permissions = await getPermissions();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Admin / Permissions</h1>
        <p className="text-muted-foreground">Naming `resource.action` §7 • Stable API identifiers • role_permissions join</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Permissions</CardTitle>
          <CardDescription>Seed ~30 perms §7 (user.view, assignment.grade, attendance.correct, etc.) • Auth via has_permission() + RLS</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border max-h-[60vh] overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Description</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(permissions as Array<{ id: string; name: string; description: string | null }>).map((p) => (
                  <TableRow key={p.id}>
                    <TableCell><code className="text-xs bg-muted px-1 py-0.5 rounded">{p.name}</code></TableCell>
                    <TableCell className="text-sm text-muted-foreground">{p.description || "—"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <p className="text-xs text-muted-foreground mt-2">Use can(user, &quot;assignment.grade&quot;, {`{scope:CLASS}`}) not `if (role===MENTOR)` (§61)</p>
        </CardContent>
      </Card>
    </div>
  );
}
