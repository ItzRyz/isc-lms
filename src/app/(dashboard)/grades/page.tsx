import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getGradesForUser, getFinalScore, getPointsTotal, getReportCard } from "@/features/assessment/actions";
import { Award, Star, FileText } from "lucide-react";
import { ReportExport } from "@/features/assessment/components/report-export";

export const dynamic = "force-dynamic";

function GradeBadge({ grade }: { grade: string }) {
  const color = grade === "A" ? "default" : grade === "B" ? "secondary" : grade === "C" ? "outline" : grade === "D" ? "outline" : "destructive";
  return <Badge variant={color as never}>{grade}</Badge>;
}

export default async function Page() {
  const [grades, finalScore, points, report] = await Promise.all([getGradesForUser(), getFinalScore(), getPointsTotal(), getReportCard()]);
  const isMock = grades.length === 5;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Grades</h1>
          <p className="text-muted-foreground">Nilai • Weights QUIZ 20/ASSIGNMENT 30/PRACTICE 25/ATTENDANCE 15/COMPETITION 10 • KKM 70 • Final + Grade + Ranking</p>
        </div>
        <Badge variant="outline">P7 Assessment</Badge>
      </div>

      {isMock && (
        <Card className="border-amber-200 bg-amber-50 dark:bg-amber-950/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-amber-900 dark:text-amber-200">Dev fallback — Supabase belum configured</CardTitle>
            <CardDescription className="text-amber-700 dark:text-amber-300">Set Supabase env & `npx supabase db push` migration 008 untuk grades real.</CardDescription>
          </CardHeader>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-1">
              <Award className="h-4 w-4" /> Final Score
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{finalScore.total}</div>
            <div className="flex items-center gap-2 mt-1">
              <GradeBadge grade={finalScore.grade} />
              <Badge variant={finalScore.passed ? "default" : "destructive"}>{finalScore.passed ? "Pass" : "Fail"} (KKM 70)</Badge>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-1">
              <Star className="h-4 w-4" /> Points
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{points}</div>
            <p className="text-xs text-muted-foreground">SUM(point_transactions.amount) • Ledger immutable §19</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-1">
              <FileText className="h-4 w-4" /> Report
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm">{report.student.full_name} — {report.student.division}</div>
            <div className="text-xs text-muted-foreground">{report.student.period} • {report.remarks}</div>
            <div className="flex gap-2 mt-2">
              <ReportExport report={report as never} />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Grade Components</CardTitle>
          <CardDescription>Configurable weights per academic_period/course/division • Grade scales A-E (90/80/70/60) §20</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Component</TableHead>
                  <TableHead>Score</TableHead>
                  <TableHead>Max</TableHead>
                  <TableHead>Weight</TableHead>
                  <TableHead>Weighted</TableHead>
                  <TableHead>Grade</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(grades as Array<{ component: string; score: number; max_score: number; weight: number; final_score: number; grade: string }>).map((g) => (
                  <TableRow key={g.component}>
                    <TableCell className="font-medium">{g.component}</TableCell>
                    <TableCell>{g.score}</TableCell>
                    <TableCell>{g.max_score}</TableCell>
                    <TableCell>{g.weight}%</TableCell>
                    <TableCell>{g.final_score}</TableCell>
                    <TableCell>
                      <GradeBadge grade={g.grade} />
                    </TableCell>
                  </TableRow>
                ))}
                <TableRow className="font-semibold bg-muted/50">
                  <TableCell colSpan={4}>Final</TableCell>
                  <TableCell>{finalScore.total}</TableCell>
                  <TableCell>
                    <GradeBadge grade={finalScore.grade} />
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
          <p className="text-xs text-muted-foreground mt-2">Formula: QUIZ*0.2 + ASSIGNMENT*0.3 + PRACTICE*0.25 + ATTENDANCE*0.15 + COMPETITION*0.1 • Reproducible dari grades + weights (jangan hardcode).</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Report Card Preview (§22)</CardTitle>
        </CardHeader>
        <CardContent className="text-xs text-muted-foreground space-y-1">
          <p>Student: {report.student.full_name} ({report.student.email}) • Division: {report.student.division} • Period: {report.student.period}</p>
          <p>Final: {report.total} ({report.grade}) • KKM 70 • {report.remarks} • Points: {report.points}</p>
          <p>Exports: PDF (jsPDF), CSV, XLSX — di P7 Hardening akan tambah pdf-lib signed & QR verify.</p>
        </CardContent>
      </Card>
    </div>
  );
}
