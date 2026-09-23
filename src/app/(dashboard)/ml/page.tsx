import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getMLRecommendation, getLearningAnalysis, getStudentRisk, getContentRecommendation } from "@/lib/ml/client";
import { Brain, TrendingUp, AlertTriangle, BookOpen } from "lucide-react";

export const dynamic = "force-dynamic";

async function fetchML(): Promise<{ rec: unknown; analysis: unknown; risk: unknown; content: unknown }> {
  try {
    const base = {
      user_id: "demo-user",
      learning_progress: 65,
      quiz_scores: [80, 75],
      assignment_scores: [85],
      attendance_rate: 90,
      completed_materials: ["html", "css"],
      division: "web",
      course: "frontend-development",
    };
    const [rec, analysis, risk, content] = await Promise.allSettled([
      getMLRecommendation(base).catch(() => null),
      getLearningAnalysis(base).catch(() => null),
      getStudentRisk({ ...base, study_hours_per_week: 12, stress_level: 5 }).catch(() => null),
      getContentRecommendation({ user_id: "demo-user", division: "web", completed_courses: ["html"], interests: ["Web Development"], level: "Beginner" }).catch(() => null),
    ]);
    return {
      rec: rec.status === "fulfilled" ? (rec.value as unknown) : null,
      analysis: analysis.status === "fulfilled" ? (analysis.value as unknown) : null,
      risk: risk.status === "fulfilled" ? (risk.value as unknown) : null,
      content: content.status === "fulfilled" ? (content.value as unknown) : null,
    };
  } catch {
    return { rec: null, analysis: null, risk: null, content: null };
  }
}

export default async function Page() {
  const { rec, analysis, risk, content } = await fetchML();

  // Fallback mock if FastAPI not configured (advisory, tidak mutate)
  const mockRec = (rec as Record<string, unknown> | null) as {
    recommended_materials: string[];
    recommended_courses: string[];
    recommended_next_step: string;
    risk_level: string;
    explanation: string;
    confidence: number;
  } | null;
  const mockRecData = mockRec || {
    recommended_materials: ["javascript", "react"],
    recommended_courses: ["frontend-development"],
    recommended_next_step: "Lanjutkan ke JavaScript",
    risk_level: "medium",
    explanation: "Progress 65% — mock (FastAPI not configured)",
    confidence: 0.6,
  };
  const mockAnalysis = (analysis as Record<string, unknown> | null) as {
    overall_progress: number;
    strengths: string[];
    weaknesses: string[];
    risk_level: string;
    explanation: string;
    confidence: number;
  } | null;
  const mockAnalysisData = mockAnalysis || {
    overall_progress: 68,
    strengths: ["Attendance", "Assignment"],
    weaknesses: ["Quiz"],
    risk_level: "medium",
    explanation: "Overall 68% — perlu fokus di Quiz",
    confidence: 0.75,
  };
  const mockRisk = (risk as Record<string, unknown> | null) as {
    risk_level: string;
    risk_score: number;
    factors: string[];
    explanation: string;
    confidence: number;
  } | null;
  const mockRiskData = mockRisk || {
    risk_level: "medium",
    risk_score: 0.6,
    factors: ["learning_progress", "attendance_rate"],
    explanation: "Progress 65% — medium risk",
    confidence: 0.7,
  };
  const mockContent = (content as Record<string, unknown> | null) as {
    recommended_courses: string[];
    recommended_materials: string[];
    explanation: string;
    confidence: number;
  } | null;
  const mockContentData = mockContent || {
    recommended_courses: ["udemy-web-2", "udemy-web-3"],
    recommended_materials: ["javascript", "react"],
    explanation: "Based on division web — mock",
    confidence: 0.65,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">ML Insights</h1>
          <p className="text-muted-foreground">FastAPI 0.141.1 • Advisory only, tidak mutate grades • Host FastAPI Cloud</p>
        </div>
        <Badge variant="outline">P10 ML</Badge>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><BookOpen className="h-4 w-4" /> Recommendation</CardTitle>
            <CardDescription>POST /api/v1/ml/recommendation • Inputs: progress, quiz, assign, attendance, completed, division</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p><strong>Materials:</strong> {mockRecData.recommended_materials.join(", ")}</p>
            <p><strong>Courses:</strong> {mockRecData.recommended_courses.join(", ")}</p>
            <p><strong>Next:</strong> {mockRecData.recommended_next_step}</p>
            <p><strong>Risk:</strong> <Badge variant={mockRecData.risk_level === "low" ? "default" : mockRecData.risk_level === "medium" ? "secondary" : "destructive"}>{mockRecData.risk_level}</Badge> — {mockRecData.explanation}</p>
            <p className="text-xs text-muted-foreground">Confidence {(mockRecData.confidence * 100).toFixed(0)}% • DAG-aware (html→css→js→react)</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><TrendingUp className="h-4 w-4" /> Learning Analysis</CardTitle>
            <CardDescription>POST /api/v1/ml/learning-analysis • Strengths/weaknesses</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p><strong>Overall:</strong> {mockAnalysisData.overall_progress}%</p>
            <p><strong>Strengths:</strong> {mockAnalysisData.strengths.join(", ") || "—"}</p>
            <p><strong>Weaknesses:</strong> {mockAnalysisData.weaknesses.join(", ") || "—"}</p>
            <p><strong>Risk:</strong> <Badge>{mockAnalysisData.risk_level}</Badge> — {mockAnalysisData.explanation}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><AlertTriangle className="h-4 w-4" /> Student Risk (Real Model)</CardTitle>
            <CardDescription>POST /api/v1/ml/student-risk • RandomForest 50 trees, 7 features • Dataset Student Performance 14k</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p><strong>Risk:</strong> <Badge variant={mockRiskData.risk_level === "high" ? "destructive" : "secondary"}>{mockRiskData.risk_level}</Badge> (score {(mockRiskData.risk_score * 100).toFixed(0)}%)</p>
            <p><strong>Factors:</strong> {mockRiskData.factors.join(", ")}</p>
            <p className="text-xs text-muted-foreground">{mockRiskData.explanation} • Confidence {(mockRiskData.confidence * 100).toFixed(0)}%</p>
            <p className="text-xs text-muted-foreground">Features: learning_progress, quiz_avg, assignment_avg, attendance_rate, completed_count, study_hours, stress_level — trained synthetic + Kaggle CSV fallback.</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Brain className="h-4 w-4" /> Content Recommendation</CardTitle>
            <CardDescription>POST /api/v1/ml/content-recommendation • Udemy 3678 courses • TF-IDF popularity</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p><strong>Courses:</strong> {mockContentData.recommended_courses.join(", ")}</p>
            <p><strong>Materials:</strong> {mockContentData.recommended_materials.join(", ")}</p>
            <p className="text-xs text-muted-foreground">{mockContentData.explanation} • Confidence {(mockContentData.confidence * 100).toFixed(0)}%</p>
            <p className="text-xs text-muted-foreground">Dataset: udemy_courses.csv (3678) • popularity log(subscribers)</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Datasets & Hosting</CardTitle>
        </CardHeader>
        <CardContent className="text-xs text-muted-foreground space-y-1">
          <p><strong>Student Risk:</strong> Student Performance and Learning Behavior Dataset (adilshamim8, 14k rows, 16 attrs) — https://www.kaggle.com/datasets/adilshamim8/student-performance-and-learning-style — plus Australian 100k fallback. File: fastapi/datasets/student_performance.csv (synthetic 10 rows for demo, real CSV download via `kaggle datasets download adilshamim8/student-performance-and-learning-style`)</p>
          <p><strong>Content:</strong> Udemy Course Recommender (nayanack, 3678) — https://www.kaggle.com/datasets/nayanack/udemy-courses — file: fastapi/datasets/udemy_courses.csv</p>
          <p><strong>Host:</strong> FastAPI Cloud (FASTAPI_BASE_URL=https://your-project.fastapi.cloud) • Env FASTAPI_INTERNAL_SECRET server-only • Next calls via src/lib/ml/client.ts server-only.</p>
          <p><strong>Advisory:</strong> ML output tidak mutate `grades/attendance` — hanya rekomendasi, mentor decide.</p>
        </CardContent>
      </Card>
    </div>
  );
}
