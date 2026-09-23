import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getSystemSettings } from "@/features/admin/actions";

export const dynamic = "force-dynamic";

export default async function Page() {
  const settings = await getSystemSettings();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Admin / Settings</h1>
        <p className="text-muted-foreground">System Settings — SUPER_ADMIN only • No secrets in client §69</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>System Settings</CardTitle>
          <CardDescription>system_settings table • RLS SUPER_ADMIN only (§9 System Settings CRUD)</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Key</TableHead>
                  <TableHead>Value</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(settings as Array<{ key: string; value: string } | { key?: string; name?: string; value: string }>).map((s: unknown, i: number) => {
                  const row = s as { key?: string; name?: string; key_name?: string; value: string };
                  return (
                    <TableRow key={i}>
                      <TableCell><code className="text-xs bg-muted px-1 py-0.5 rounded">{row.key || row.name || `setting_${i}`}</code></TableCell>
                      <TableCell className="font-mono text-xs">{row.value}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
          <p className="text-xs text-muted-foreground mt-2">Only NEXT_PUBLIC_* exposed to browser. Service-role, Resend, FastAPI secret server-only.</p>
        </CardContent>
      </Card>
    </div>
  );
}
