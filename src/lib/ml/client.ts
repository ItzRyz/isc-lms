import "server-only";

type RecommendationInput = {
  user_id: string;
  learning_progress: number;
  quiz_scores?: number[];
  assignment_scores?: number[];
  attendance_rate?: number;
  completed_materials?: string[];
  division?: string;
  course?: string;
};

export async function getMLRecommendation(input: RecommendationInput) {
  const baseUrl = process.env.FASTAPI_BASE_URL;
  const secret = process.env.FASTAPI_INTERNAL_SECRET;

  if (!baseUrl || !secret) {
    throw new Error("FASTAPI_BASE_URL or FASTAPI_INTERNAL_SECRET not set");
  }

  // Server-only call — jangan expose secret ke client (AGENTS.md §44)
  const res = await fetch(`${baseUrl}/api/v1/ml/recommendation`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Internal-Secret": secret,
    },
    body: JSON.stringify(input),
    cache: "no-store",
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`ML service error ${res.status}: ${text}`);
  }

  return res.json();
}
