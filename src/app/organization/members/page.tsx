import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getMembers } from "@/features/organization/actions-member";
import { MembersTable } from "@/features/organization/components/members-table";

export const dynamic = "force-dynamic";

export default async function Page() {
  const members = await getMembers();
  const isMock = members.length === 3 && members[0]?.id === "m1";

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Organization / Members</h1>
          <p className="text-muted-foreground">Multi-role + scoped • user_roles (GLOBAL/DIVISION/CLASS) + user_divisions + class_members. Coordinator view own division only.</p>
        </div>
        <Badge variant="outline">P2 Organization</Badge>
      </div>

      {isMock && (
        <Card className="border-amber-200 bg-amber-50 dark:bg-amber-950/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-amber-900 dark:text-amber-200">Dev fallback — Supabase belum configured</CardTitle>
            <CardDescription className="text-amber-700 dark:text-amber-300">Set Supabase env & `npx supabase db push` migration 001+002 untuk members real (profiles+roles+divisions).</CardDescription>
          </CardHeader>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Members</CardTitle>
          <CardDescription>
            profiles • roles (SUPER_ADMIN..MEMBER) • divisions • classes — RLS: user can view own, admin can view all, coordinator scoped DIVISION via is_division_member
          </CardDescription>
        </CardHeader>
        <CardContent>
          <MembersTable members={members} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Next P2</CardTitle>
        </CardHeader>
        <CardContent className="text-xs text-muted-foreground">
          <p>Batches, Positions, invite member → assign division/class via `user_divisions` / `class_members` (UNIQUE). Coordinator scope enforced di Server Actions via has_role + is_division_member.</p>
        </CardContent>
      </Card>
    </div>
  );
}
