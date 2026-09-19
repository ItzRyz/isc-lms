// Pure functions — mudah di-unit test (AGENTS.md §54)

export type GradeComponent = "QUIZ" | "ASSIGNMENT" | "PRACTICE" | "ATTENDANCE" | "COMPETITION";

export function calculateWeightedScore(
  scores: Partial<Record<GradeComponent, number>>,
  weights: Partial<Record<GradeComponent, number>>
): number {
  let totalScore = 0;
  let totalWeight = 0;

  for (const [component, score] of Object.entries(scores)) {
    const weight = weights[component as GradeComponent] ?? 0;
    if (score !== undefined && weight > 0) {
      totalScore += score * (weight / 100);
      totalWeight += weight;
    }
  }

  // Normalize if weights don't sum to 100
  if (totalWeight > 0 && totalWeight !== 100) {
    totalScore = (totalScore / totalWeight) * 100;
  }

  return Math.round(totalScore * 100) / 100;
}

export function calculateCourseProgress(params: {
  materialCompletion: number; // 0-100
  assignmentCompletion: number;
  quizCompletion: number;
  weights?: { material: number; assignment: number; quiz: number };
}): number {
  const w = params.weights ?? { material: 40, assignment: 30, quiz: 30 };
  return (
    params.materialCompletion * (w.material / 100) +
    params.assignmentCompletion * (w.assignment / 100) +
    params.quizCompletion * (w.quiz / 100)
  );
}

export type GradeScale = { grade: string; min: number; max: number };

export const DEFAULT_GRADE_SCALE: GradeScale[] = [
  { grade: "A", min: 90, max: 100 },
  { grade: "B", min: 80, max: 89.99 },
  { grade: "C", min: 70, max: 79.99 },
  { grade: "D", min: 60, max: 69.99 },
  { grade: "E", min: 0, max: 59.99 },
];

export function getGrade(score: number, scale: GradeScale[] = DEFAULT_GRADE_SCALE): string {
  const found = scale.find((s) => score >= s.min && score <= s.max);
  return found?.grade ?? "E";
}
