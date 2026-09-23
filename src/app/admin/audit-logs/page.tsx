import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getAuditLogs } from "@/features/admin/actions";

export const dynamic = "force-dynamic";

export default async function Page() {
  const logs = await getAuditLogs();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Admin / Audit Logs</h1>
        <p className="text-muted-foreground">USER_ROLE_CHANGED, ATTENDANCE_CORRECTED, GRADE_UPDATED, etc. • Never log secrets §62</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Audit Logs</CardTitle>
          <CardDescription>actor_id, action, entity_type, entity_id, old/new, ip, ua, created_at • RLS via has_role SUPER_ADMIN</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Action</TableHead>
                  <TableHead>Entity</TableHead>
                  <TableHead>Actor</TableHead>
                  <TableHead>Time</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(logs as Array<{ id: string; action: string; entity_type: string; entity_id: string; actor_id: string | null; old_value: unknown; new_value: unknown; created_at: string }>).map((l) => (
                  <TableRow key={l.id}>
                    <TableCell><Badge variant="outline">{l.action}</Badge></TableCell>
                    <TableCell className="text-xs">{l.entity_type} <span className="font-mono">{l.entity_id.slice(0, 8)}</span></TableCell>
                    <TableCell className="font-mono text-xs">{l.actor_id?.slice(0, 8) || "—"}</TableCell>
                    <TableCell className="text-xs">{new Date(l.created_at).toLocaleString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <p className="text-xs text-muted-foreground mt-2">Sensitive actions must create audit_logs (§30) • e.g., assignRole → USER_ROLE_CHANGED</p>
        </CardContent>
      </Card>
    </div>
  );
}
