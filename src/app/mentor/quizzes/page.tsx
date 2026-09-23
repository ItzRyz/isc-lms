import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getQuizzes } from "@/features/quizzes/actions";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function Page() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return <div className="p-6">Login required</div>;

  const quizzes = await getQuizzes();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Mentor / Quizzes</h1>
        <p className="text-muted-foreground">SCOPED CLASS — quiz grade • Auto-grade server, feedback, attempt history</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Quizzes to Grade</CardTitle>
          <CardDescription>quiz.grade scoped CLASS • Timer & randomization server</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Duration</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(quizzes as Array<{ id: string; title: string; type: string; duration_minutes: number }>).map((q) => (
                  <TableRow key={q.id}>
                    <TableCell className="font-medium">{q.title}</TableCell>
                    <TableCell><Badge variant="outline">{q.type}</Badge></TableCell>
                    <TableCell>{q.duration_minutes}m</TableCell>
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
