import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getRoles } from "@/features/admin/actions";

export const dynamic = "force-dynamic";

export default async function Page() {
  const roles = await getRoles();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Admin / Roles</h1>
        <p className="text-muted-foreground">10 system roles • MEMBER default • Multi-role, not composite (§5) • Stable identifiers</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Roles</CardTitle>
          <CardDescription>Seed 10 roles via 001_identity_rbac.sql • RLS authenticated view</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Description</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(roles as Array<{ id: string; name: string; description: string | null }>).map((r) => (
                  <TableRow key={r.id}>
                    <TableCell><Badge variant="outline">{r.name}</Badge></TableCell>
                    <TableCell className="text-sm text-muted-foreground">{r.description || "—"}</TableCell>
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
