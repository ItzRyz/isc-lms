import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
export default function Page() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Coordinator / Courses</h1>
        <p className="text-muted-foreground">Placeholder — akan diimplementasi di phase terkait. Lihat BUILD_PLAN.md</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Empty State</CardTitle>
          <CardDescription>Belum ada data — setup P1 done, next phase akan isi fitur ini.</CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          <p>Scope: multi-role + RLS. Pastikan authorization server-side sebelum tampilkan data.</p>
        </CardContent>
      </Card>
    </div>
  );
}
