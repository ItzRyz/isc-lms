import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getUsers, getRoles, assignRole } from "@/features/admin/actions";

export const dynamic = "force-dynamic";

export default async function Page() {
  const [users, roles] = await Promise.all([getUsers(), getRoles()]);
  const roleOptions = (roles as Array<{ name: string }>).map((r) => r.name);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Admin / Users</h1>
        <p className="text-muted-foreground">Manage users • Assign multi-role (SUPER_ADMIN only) • Audit USER_ROLE_CHANGED • Soft delete preserved</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Users</CardTitle>
          <CardDescription>Authenticated can view • SUPER_ADMIN can update roles • RLS via has_role</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Roles</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(users as Array<{ id: string; email: string; full_name: string | null; roles: string[]; is_active: boolean }>).map((u) => (
                  <TableRow key={u.id}>
                    <TableCell className="font-mono text-xs">{u.email}</TableCell>
                    <TableCell>{u.full_name || "—"}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {u.roles.map((r) => (
                          <Badge key={r} variant={r === "SUPER_ADMIN" ? "default" : "secondary"} className="text-xs">{r}</Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>{u.is_active ? <Badge>Active</Badge> : <Badge variant="destructive">Inactive</Badge>}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Assign Role (SUPER_ADMIN only)</CardTitle>
          <CardDescription>Creates user_roles (UNIQUE user_id,role_id) + audit_logs USER_ROLE_CHANGED (server-authoritative)</CardDescription>
        </CardHeader>
        <CardContent>
          <form
            action={async (formData: FormData) => {
              "use server";
              await assignRole(formData);
            }}
            className="flex flex-col gap-3 md:flex-row md:items-end"
          >
            <div className="space-y-1 flex-1">
              <Label>User ID (uuid)</Label>
              <Input name="user_id" placeholder="Paste user id" required />
            </div>
            <div className="space-y-1">
              <Label>Role</Label>
              <select name="role" className="flex h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm" defaultValue={roleOptions[1] || "MEMBER"}>
                {roleOptions.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>
            <Button type="submit">Assign</Button>
          </form>
          <p className="text-xs text-muted-foreground mt-2">Do not create composite roles (MENTOR_WEB_COORDINATOR). Use multi-role instead (§5).</p>
        </CardContent>
      </Card>
    </div>
  );
}
