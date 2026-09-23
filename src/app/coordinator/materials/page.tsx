import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

function isSupabaseConfigured(): boolean {
  return !!process.env.NEXT_PUBLIC_SUPABASE_URL && !!(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY);
}

export default async function Page() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return <div className="p-6">Login required</div>;

  const { data: ud } = await supabase.from("user_divisions").select("division_id").eq("user_id", user.id);
  const ownDivs = (ud as Array<{ division_id: string }> | null)?.map((r) => r.division_id) || [];
  const { data: roles } = await supabase.from("user_roles").select("roles(name)").eq("user_id", user.id);
  const isSuper = (roles as Array<{ roles: { name: string } }> | null)?.some((r) => r.roles.name === "SUPER_ADMIN");

  let materials: Array<{ id: string; title: string; type: string; is_published: boolean; course_id: string }> = [];
  if (isSupabaseConfigured()) {
    const { data } = await supabase.from("materials").select("id, title, type, is_published, course_id").is("deleted_at", null).limit(20);
    const filtered = ownDivs.length && !isSuper ? [] : data;
    materials = (filtered as never) || [];
  } else {
    materials = [
      { id: "mat-html", title: "HTML Dasar — Dokumentasi", type: "DOCUMENT", is_published: true, course_id: "course-fe" },
      { id: "mat-css", title: "CSS Fundamentals — Video", type: "VIDEO", is_published: true, course_id: "course-fe" },
    ];
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Coordinator / Materials</h1>
        <p className="text-muted-foreground">CRUD scoped DIVISION • is_division_member • Division {ownDivs.join(", ") || "— all if SUPER"}</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Materials (scoped)</CardTitle>
          <CardDescription>Coordinator hanya bisa CRUD material di division own. Mentor juga CRUD S.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Published</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {materials.map((m) => (
                  <TableRow key={m.id}>
                    <TableCell className="font-medium">{m.title}</TableCell>
                    <TableCell><Badge variant="outline">{m.type}</Badge></TableCell>
                    <TableCell>{m.is_published ? <Badge>Published</Badge> : <Badge variant="outline">Draft</Badge>}</TableCell>
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
