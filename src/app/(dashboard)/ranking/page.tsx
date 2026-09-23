import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { getRankingPeriods, getRankingEntries, generateRanking } from "@/features/assessment/actions";
import { Trophy, Medal, Crown } from "lucide-react";

export const dynamic = "force-dynamic";

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) return <Badge className="bg-amber-500"><Crown className="mr-1 h-3 w-3" />1</Badge>;
  if (rank === 2) return <Badge variant="secondary"><Medal className="mr-1 h-3 w-3" />2</Badge>;
  if (rank === 3) return <Badge variant="outline"><Medal className="mr-1 h-3 w-3" />3</Badge>;
  return <Badge variant="outline">{rank}</Badge>;
}

export default async function Page() {
  const periods = await getRankingPeriods();
  const monthly = periods.find((p) => (p as { type: string }).type === "MONTHLY") as { id: string; name: string; start_date: string; end_date: string } | undefined;
  const semester = periods.find((p) => (p as { type: string }).type === "SEMESTER") as { id: string; name: string; start_date: string; end_date: string } | undefined;

  const monthlyEntries = monthly ? await getRankingEntries(monthly.id) : [];
  const semesterEntries = semester ? await getRankingEntries(semester.id) : [];

  const isMock = monthlyEntries.length === 3;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Ranking</h1>
          <p className="text-muted-foreground">MONTHLY (points SUM) • SEMESTER (final academic score) • Reproducible dari stored source • Do not mix metrics</p>
        </div>
        <Badge variant="outline">P7 Ranking</Badge>
      </div>

      {isMock && (
        <Card className="border-amber-200 bg-amber-50 dark:bg-amber-950/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-amber-900 dark:text-amber-200">Dev fallback — Supabase belum configured</CardTitle>
            <CardDescription className="text-amber-700 dark:text-amber-300">Set Supabase env & `npx supabase db push` migration 008 untuk ranking real.</CardDescription>
          </CardHeader>
        </Card>
      )}

      <Tabs defaultValue="monthly">
        <TabsList>
          <TabsTrigger value="monthly">Monthly (Points)</TabsTrigger>
          <TabsTrigger value="semester">Semester (Score)</TabsTrigger>
        </TabsList>

        <TabsContent value="monthly" className="pt-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-amber-500" /> Monthly Ranking
                </CardTitle>
                <CardDescription>{monthly ? `${monthly.name} • ${monthly.start_date} → ${monthly.end_date}` : "No period"} • SUM(point_transactions.amount)</CardDescription>
              </div>
              {monthly && (
                <form
                  action={async () => {
                    "use server";
                    await generateRanking(monthly.id);
                  }}
                >
                  <Button variant="outline" size="sm" type="submit">
                    Generate (Admin)
                  </Button>
                </form>
              )}
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Rank</TableHead>
                      <TableHead>Student</TableHead>
                      <TableHead>Division</TableHead>
                      <TableHead>Points</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {monthlyEntries.length ? (
                      (monthlyEntries as Array<{ rank: number; full_name: string; email: string; division: string; score: number }>).map((e) => (
                        <TableRow key={e.rank}>
                          <TableCell>
                            <RankBadge rank={e.rank} />
                          </TableCell>
                          <TableCell>
                            <div className="font-medium">{e.full_name}</div>
                            <div className="text-xs text-muted-foreground">{e.email}</div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{e.division || "—"}</Badge>
                          </TableCell>
                          <TableCell className="font-semibold">{e.score}</TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                          No entries. Click Generate.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
              <p className="text-xs text-muted-foreground mt-2">Reproducible: SUM(point_transactions) per period • Immutable ledger • Compensating transactions for corrections.</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="semester" className="pt-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-blue-500" /> Semester Ranking
                </CardTitle>
                <CardDescription>{semester ? `${semester.name} • ${semester.start_date} → ${semester.end_date}` : "No period"} • Final academic score (weighted grades)</CardDescription>
              </div>
              {semester && (
                <form
                  action={async () => {
                    "use server";
                    await generateRanking(semester.id);
                  }}
                >
                  <Button variant="outline" size="sm" type="submit">
                    Generate (Admin)
                  </Button>
                </form>
              )}
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Rank</TableHead>
                      <TableHead>Student</TableHead>
                      <TableHead>Division</TableHead>
                      <TableHead>Score</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {semesterEntries.length ? (
                      (semesterEntries as Array<{ rank: number; full_name: string; email: string; division: string; score: number }>).map((e) => (
                        <TableRow key={e.rank}>
                          <TableCell>
                            <RankBadge rank={e.rank} />
                          </TableCell>
                          <TableCell>
                            <div className="font-medium">{e.full_name}</div>
                            <div className="text-xs text-muted-foreground">{e.email}</div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{e.division || "—"}</Badge>
                          </TableCell>
                          <TableCell className="font-semibold">{e.score}</TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                          No entries.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
              <p className="text-xs text-muted-foreground mt-2">Reproducible: weighted grades total per AGENTS.md §21 • Do not mix points vs score.</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Report Card</CardTitle>
        </CardHeader>
        <CardContent className="text-xs text-muted-foreground">
          <p>Report: student info + division + period + attendance + material progress + quiz/assignment/competition + final score + grade + remarks + mentor/coordinator • Exports PDF/CSV/XLSX (§22).</p>
          <p className="mt-1">Ranking period fields: id, name, type, start_date, end_date, division_id nullable, academic_period_id, status — per §21.</p>
        </CardContent>
      </Card>
    </div>
  );
}
