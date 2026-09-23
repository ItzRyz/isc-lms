import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { createClient } from "@/lib/supabase/server";
import { getCourses } from "@/features/learning/actions";

export const dynamic = "force-dynamic";

export default async function Page() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return <div className="p-6">Login required</div>;

  const { data: ud } = await supabase.from("user_divisions").select("division_id").eq("user_id", user.id);
  const ownDivIds = (ud as Array<{ division_id: string }> | null)?.map((r) => r.division_id) || [];

  const allCourses = await getCourses();
  const filtered = ownDivIds.length ? (allCourses as Array<{ division_id: string }>).filter((c) => ownDivIds.includes(c.division_id)) : allCourses;

  // If SUPER_ADMIN/LEADER, show all
  const { data: roles } = await supabase.from("user_roles").select("roles(name)").eq("user_id", user.id);
  const isSuper = (roles as Array<{ roles: { name: string } }> | null)?.some((r) => r.roles.name === "SUPER_ADMIN" || r.roles.name === "LEADER");

  const display = isSuper ? allCourses : filtered;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Coordinator / Courses</h1>
        <p className="text-muted-foreground">CRUD own DIVISION courses • is_division_member • Own division only unless SUPER_ADMIN</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Courses (scoped)</CardTitle>
          <CardDescription>{display.length} courses • Division {ownDivIds.join(", ") || "— all if SUPER"}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Slug</TableHead>
                  <TableHead>Division</TableHead>
                  <TableHead>Published</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(display as Array<{ id: string; name: string; slug: string; division_id: string; division_name?: string; is_published: boolean }>).map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium">{c.name}</TableCell>
                    <TableCell><code className="text-xs bg-muted px-1 py-0.5 rounded">{c.slug}</code></TableCell>
                    <TableCell>{c.division_name || c.division_id.slice(0, 8)}</TableCell>
                    <TableCell>{c.is_published ? <Badge>Published</Badge> : <Badge variant="outline">Draft</Badge>}</TableCell>
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
