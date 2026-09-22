import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getDivisions } from "@/features/organization/actions";
import { getAcademicPeriods, deleteAcademicPeriod } from "@/features/organization/actions-academic";
import { getClasses, deleteClass } from "@/features/organization/actions-class";
import { DivisionTable } from "@/features/organization/components/division-table";
import { AcademicPeriodFormDialog } from "@/features/organization/components/academic-period-form";
import { ClassFormDialog } from "@/features/organization/components/class-form";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function Page() {
  const [divisions, periods, classes] = await Promise.all([getDivisions(), getAcademicPeriods(), getClasses()]);
  const isMock = divisions.length === 3 && divisions[0]?.id === "1";

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Organization</h1>
          <p className="text-muted-foreground">P2 Organization — divisions, academic periods, classes. Scope DIVISION enforced RLS + can() + is_division_member.</p>
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

      <Tabs defaultValue="divisions">
        <TabsList>
          <TabsTrigger value="divisions">Divisions</TabsTrigger>
          <TabsTrigger value="periods">Academic Periods</TabsTrigger>
          <TabsTrigger value="classes">Classes</TabsTrigger>
        </TabsList>

        <TabsContent value="divisions" className="space-y-4 pt-4">
          <Card>
            <CardHeader>
              <CardTitle>Divisions</CardTitle>
              <CardDescription>CRUD scoped DIVISION • RLS `is_division_member` • soft delete `deleted_at` • UNIQUE(slug)</CardDescription>
            </CardHeader>
            <CardContent>
              <DivisionTable divisions={divisions} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="periods" className="space-y-4 pt-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Academic Periods</CardTitle>
                <CardDescription>Semester/tahun ajaran — FK untuk classes & grades. Check end_date &gt; start_date.</CardDescription>
              </div>
              <AcademicPeriodFormDialog triggerLabel="Create Period" />
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Start</TableHead>
                      <TableHead>End</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {periods.length ? (
                      // eslint-disable-next-line @typescript-eslint/no-explicit-any
                      (periods as any[]).map((p: { id: string; name: string; start_date: string; end_date: string; is_active: boolean }) => (
                        <TableRow key={p.id}>
                          <TableCell className="font-medium">{p.name}</TableCell>
                          <TableCell>{p.start_date}</TableCell>
                          <TableCell>{p.end_date}</TableCell>
                          <TableCell>{p.is_active ? <Badge>Active</Badge> : <Badge variant="outline">Inactive</Badge>}</TableCell>
                          <TableCell>
                            <form
                              action={async () => {
                                "use server";
                                await deleteAcademicPeriod(p.id);
                              }}
                            >
                              <Button variant="outline" size="sm" type="submit">
                                Delete
                              </Button>
                            </form>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                          No periods.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="classes" className="space-y-4 pt-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Classes</CardTitle>
                <CardDescription>
                  Kelas per division + academic period. UNIQUE(division_id, slug) • coordinator scope DIVISION via is_division_member.
                </CardDescription>
              </div>
              <ClassFormDialog divisions={divisions as never} periods={periods as never} triggerLabel="Create Class" />
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Slug</TableHead>
                      <TableHead>Division</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {classes.length ? (
                      // eslint-disable-next-line @typescript-eslint/no-explicit-any
                      (classes as any[]).map((c: { id: string; name: string; slug: string; division_name: string; is_active: boolean }) => (
                        <TableRow key={c.id}>
                          <TableCell className="font-medium">{c.name}</TableCell>
                          <TableCell>
                            <code className="text-xs bg-muted px-1 py-0.5 rounded">{c.slug}</code>
                          </TableCell>
                          <TableCell>{c.division_name}</TableCell>
                          <TableCell>{c.is_active ? <Badge>Active</Badge> : <Badge variant="outline">Inactive</Badge>}</TableCell>
                          <TableCell>
                            <form
                              action={async () => {
                                "use server";
                                await deleteClass(c.id);
                              }}
                            >
                              <Button variant="outline" size="sm" type="submit">
                                Delete
                              </Button>
                            </form>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                          No classes. Create one — coordinator hanya bisa di division own.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">RBAC Matrix (AGENTS.md §9) — P2</CardTitle>
        </CardHeader>
        <CardContent className="text-xs text-muted-foreground space-y-1">
          <p>
            <strong>SUPER_ADMIN:</strong> CRUD GLOBAL • <strong>LEADER/CO_LEADER:</strong> RW divisions/classes
          </p>
          <p>
            <strong>WEB/ML/UIUX_COORDINATOR:</strong> CRUD own DIVISION (scope DIVISION + is_division_member) — enforced di Server Actions can() + RLS
          </p>
          <p>
            <strong>MENTOR/MEMBER:</strong> R view active divisions/classes
          </p>
          <p className="pt-2">
            Unique: `divisions.slug`, `(classes.division_id, slug)` • Soft delete `deleted_at` • Indexes per §51
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
