import "server-only";

type BaseInput = {
  user_id: string;
  learning_progress: number;
  quiz_scores?: number[];
  assignment_scores?: number[];
  attendance_rate?: number;
  completed_materials?: string[];
  prerequisites?: string[];
  learning_history?: string[];
  division?: string;
  course?: string;
};

type RecommendationInput = BaseInput;

type LearningAnalysisInput = BaseInput;

type StudentRiskInput = BaseInput & {
  study_hours_per_week?: number;
  stress_level?: number;
};

type ContentRecommendationInput = {
  user_id: string;
  division?: string;
  completed_courses?: string[];
  interests?: string[];
  level?: "Beginner" | "Intermediate" | "Advanced";
};

async function callML<T>(path: string, body: unknown): Promise<T> {
  const baseUrl = process.env.FASTAPI_BASE_URL;
  const secret = process.env.FASTAPI_INTERNAL_SECRET;
  if (!baseUrl || !secret) throw new Error("FASTAPI_BASE_URL or FASTAPI_INTERNAL_SECRET not set");
  const res = await fetch(`${baseUrl}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Internal-Secret": secret },
    body: JSON.stringify(body),
    cache: "no-store",
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`ML service error ${res.status}: ${text}`);
  }
  return res.json();
}

export async function getMLRecommendation(input: RecommendationInput) {
  return callML("/api/v1/ml/recommendation", input);
}

export async function getLearningAnalysis(input: LearningAnalysisInput) {
  return callML("/api/v1/ml/learning-analysis", input);
}

export async function getStudentRisk(input: StudentRiskInput) {
  return callML("/api/v1/ml/student-risk", input);
}

export async function getContentRecommendation(input: ContentRecommendationInput) {
  return callML("/api/v1/ml/content-recommendation", input);
}
