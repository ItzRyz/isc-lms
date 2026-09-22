import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getDivisions } from "@/features/organization/actions";
import { DivisionTable } from "@/features/organization/components/division-table";

export const dynamic = "force-dynamic";

export default async function Page() {
  const divisions = await getDivisions();
  const isMock = divisions.length === 3 && divisions[0]?.id === "1";

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Organization / Divisions</h1>
          <p className="text-muted-foreground">Kelola 3 divisi Study Club — UI/UX, Web, ML. Scope DIVISION enforced RLS + can().</p>
        </div>
        <Badge variant="outline">P2 Organization</Badge>
      </div>

      {isMock && (
        <Card className="border-amber-200 bg-amber-50 dark:bg-amber-950/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-amber-900 dark:text-amber-200">Dev fallback — Supabase belum configured</CardTitle>
            <CardDescription className="text-amber-700 dark:text-amber-300">Set NEXT_PUBLIC_SUPABASE_URL/ANON_KEY di .env.local lalu `npx supabase db push` migration 002 untuk data real.</CardDescription>
          </CardHeader>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Divisions</CardTitle>
          <CardDescription>CRUD scoped DIVISION • RLS `is_division_member` • soft delete `deleted_at` • UNIQUE(slug)</CardDescription>
        </CardHeader>
        <CardContent>
          <DivisionTable divisions={divisions} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">RBAC Matrix (AGENTS.md §9)</CardTitle>
        </CardHeader>
        <CardContent className="text-xs text-muted-foreground space-y-1">
          <p><strong>SUPER_ADMIN:</strong> CRUD GLOBAL</p>
          <p><strong>LEADER/CO_LEADER:</strong> RW / RW divisions</p>
          <p><strong>WEB/ML/UIUX_COORDINATOR:</strong> CRUD own DIVISION (scope DIVISION + is_division_member)</p>
          <p><strong>MENTOR/MEMBER:</strong> R (view active)</p>
          <p className="pt-2">Validation: `name 3-100`, `slug ^[a-z0-9-]+$` unique, `description 0-500` — server zod + DB unique + RLS.</p>
        </CardContent>
      </Card>
    </div>
  );
}
