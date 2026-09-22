"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { quizSchema, questionSchema, submitQuizSchema } from "@/lib/validation/quiz";

type ActionResult = { success: true; data?: unknown } | { success: false; error: { code: string; message: string } };

function isSupabaseConfigured(): boolean {
  return !!process.env.NEXT_PUBLIC_SUPABASE_URL && !!(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY);
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Mock untuk dev tanpa Supabase
const mockQuizzes = [
  {
    id: "quiz-html",
    course_id: "course-fe",
    course_name: "Frontend Development",
    title: "Quiz HTML — Weekly",
    description: "Uji HTML semantik",
    type: "WEEKLY" as const,
    duration_minutes: 15,
    max_attempts: 3,
    shuffle_questions: true,
    shuffle_choices: true,
    is_published: true,
    available_from: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    available_until: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    pass_score: 60,
    question_count: 3,
  },
  {
    id: "quiz-ice",
    course_id: "course-fe",
    course_name: "Frontend Development",
    title: "Ice Breaking — Kenalan",
    description: "WEEKLY ice breaking",
    type: "ICE_BREAKING" as const,
    duration_minutes: 10,
    max_attempts: 1,
    shuffle_questions: false,
    shuffle_choices: false,
    is_published: true,
    available_from: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    available_until: null,
    pass_score: 0,
    question_count: 2,
  },
];

const mockQuestions = [
  {
    id: "q1",
    course_id: "course-fe",
    type: "MULTIPLE_CHOICE" as const,
    content: "Tag HTML untuk heading terbesar adalah?",
    choices: [
      { id: "a", text: "<h1>", is_correct: true },
      { id: "b", text: "<h6>", is_correct: false },
      { id: "c", text: "<header>", is_correct: false },
      { id: "d", text: "<title>", is_correct: false },
    ],
    explanation: "h1 adalah heading level 1 terbesar.",
    points: 10,
  },
  {
    id: "q2",
    course_id: "course-fe",
    type: "TRUE_FALSE" as const,
    content: "Atribut alt pada <img> wajib untuk aksesibilitas.",
    choices: [
      { id: "true", text: "True", is_correct: true },
      { id: "false", text: "False", is_correct: false },
    ],
    explanation: "alt membantu screen reader.",
    points: 10,
  },
  {
    id: "q3",
    course_id: "course-fe",
    type: "MULTIPLE_ANSWER" as const,
    content: "Pilih yang termasuk tag semantik HTML5 (multiple):",
    choices: [
      { id: "a", text: "<article>", is_correct: true },
      { id: "b", text: "<section>", is_correct: true },
      { id: "c", text: "<div>", is_correct: false },
      { id: "d", text: "<nav>", is_correct: true },
    ],
    explanation: "article, section, nav semantik; div tidak.",
    points: 10,
  },
];

export async function getQuizzes(courseId?: string) {
  if (!isSupabaseConfigured()) {
    if (courseId) return mockQuizzes.filter((q) => q.course_id === courseId);
    return mockQuizzes;
  }
  const supabase = await createClient();
  let query = supabase.from("quizzes").select("id, course_id, title, description, type, duration_minutes, max_attempts, shuffle_questions, shuffle_choices, is_published, available_from, available_until, pass_score, courses(name)").is("deleted_at", null).order("created_at");
  if (courseId) query = query.eq("course_id", courseId);
  const { data, error } = await query;
  if (error) {
    console.error("[quizzes] error:", error);
    return [];
  }
  return (data as unknown as Array<Record<string, unknown>>).map((r) => ({
    id: r.id,
    course_id: r.course_id,
    course_name: (r.courses as { name?: string } | null)?.name || "",
    title: r.title,
    description: r.description,
    type: r.type,
    duration_minutes: r.duration_minutes,
    max_attempts: r.max_attempts,
    shuffle_questions: r.shuffle_questions,
    shuffle_choices: r.shuffle_choices,
    is_published: r.is_published,
    available_from: r.available_from,
    available_until: r.available_until,
    pass_score: r.pass_score,
  }));
}

export async function getQuizById(id: string) {
  if (!isSupabaseConfigured()) return mockQuizzes.find((q) => q.id === id) || null;
  const supabase = await createClient();
  const { data } = await supabase.from("quizzes").select("*, courses(name)").eq("id", id).maybeSingle();
  return data;
}

export async function getQuizAttempts(quizId: string) {
  if (!isSupabaseConfigured()) {
    return [
      { id: "att1", quiz_id: quizId, attempt_number: 1, status: "GRADED" as const, score: 80, max_score: 100, started_at: new Date(Date.now() - 3600 * 1000).toISOString(), submitted_at: new Date().toISOString() },
      { id: "att2", quiz_id: quizId, attempt_number: 2, status: "GRADED" as const, score: 90, max_score: 100, started_at: new Date(Date.now() - 1800 * 1000).toISOString(), submitted_at: new Date().toISOString() },
    ];
  }
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];
  const { data } = await supabase.from("quiz_attempts").select("*").eq("quiz_id", quizId).eq("user_id", user.id).order("attempt_number");
  return data || [];
}

export async function getAttemptById(attemptId: string) {
  if (!isSupabaseConfigured()) {
    return {
      id: attemptId,
      quiz_id: "quiz-html",
      status: "IN_PROGRESS" as const,
      score: null,
      started_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
    };
  }
  const supabase = await createClient();
  const { data } = await supabase.from("quiz_attempts").select("*").eq("id", attemptId).maybeSingle();
  return data;
}

// Start attempt — server validates availability, attempt limit, shuffle server-side (AGENTS.md §15)
export async function startQuizAttempt(quizId: string): Promise<ActionResult & { data?: { attemptId: string } }> {
  if (!isSupabaseConfigured()) {
    return { success: true, data: { attemptId: `mock-${Date.now()}` } };
  }
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: { code: "UNAUTHENTICATED", message: "Login required" } };

  const { data: quiz } = await supabase.from("quizzes").select("*").eq("id", quizId).maybeSingle();
  if (!quiz) return { success: false, error: { code: "NOT_FOUND", message: "Quiz not found" } };
  const q = quiz as { is_published: boolean; available_from: string | null; available_until: string | null; max_attempts: number; duration_minutes: number };

  if (!q.is_published) return { success: false, error: { code: "FORBIDDEN", message: "Quiz not published" } };
  const now = new Date();
  if (q.available_from && now < new Date(q.available_from)) return { success: false, error: { code: "FORBIDDEN", message: "Quiz not yet available" } };
  if (q.available_until && now > new Date(q.available_until)) return { success: false, error: { code: "FORBIDDEN", message: "Quiz expired" } };

  const { data: existingAttempts } = await supabase.from("quiz_attempts").select("attempt_number, status").eq("quiz_id", quizId).eq("user_id", user.id).order("attempt_number", { ascending: false }).limit(1);
  const last = existingAttempts?.[0] as { attempt_number: number; status: string } | undefined;
  const attemptNumber = last ? last.attempt_number + 1 : 1;
  if (last && attemptNumber > q.max_attempts) return { success: false, error: { code: "FORBIDDEN", message: "Max attempts reached" } };
  // Also block if there's an ongoing IN_PROGRESS attempt not yet expired
  const { data: ongoing } = await supabase.from("quiz_attempts").select("id, expires_at").eq("quiz_id", quizId).eq("user_id", user.id).eq("status", "IN_PROGRESS").maybeSingle();
  if (ongoing && (ongoing as { expires_at: string | null }).expires_at && new Date((ongoing as { expires_at: string }).expires_at) > now) {
    return { success: true, data: { attemptId: (ongoing as { id: string }).id } };
  }

  const expiresAt = new Date(now.getTime() + q.duration_minutes * 60 * 1000).toISOString();
  const { data: inserted, error } = await supabase
    .from("quiz_attempts")
    .insert({
      quiz_id: quizId,
      user_id: user.id,
      attempt_number: attemptNumber,
      status: "IN_PROGRESS",
      started_at: now.toISOString(),
      expires_at: expiresAt,
    })
    .select("id")
    .maybeSingle();
  if (error) return { success: false, error: { code: "INTERNAL_ERROR", message: error.message } };
  revalidatePath("/quizzes");
  return { success: true, data: { attemptId: (inserted as { id: string }).id } };
}

// Submit — server validates timing, ownership, calculates score (do not trust client)
export async function submitQuizAttempt(formData: FormData): Promise<ActionResult & { data?: { score: number; maxScore: number } }> {
  const raw = {
    attempt_id: String(formData.get("attempt_id") || ""),
    answers: (() => {
      try {
        return JSON.parse(String(formData.get("answers") || "[]"));
      } catch {
        return [];
      }
    })(),
  };
  const parsed = submitQuizSchema.safeParse(raw);
  if (!parsed.success) return { success: false, error: { code: "VALIDATION_ERROR", message: parsed.error.issues[0].message } };

  if (!isSupabaseConfigured()) {
    // Mock grading
    const score = Math.floor(Math.random() * 40) + 60; // 60-100
    return { success: true, data: { score, maxScore: 100 } };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: { code: "UNAUTHENTICATED", message: "Login required" } };

  const { data: attempt } = await supabase.from("quiz_attempts").select("*, quizzes(duration_minutes, available_until)").eq("id", parsed.data.attempt_id).maybeSingle();
  if (!attempt) return { success: false, error: { code: "NOT_FOUND", message: "Attempt not found" } };
  const att = attempt as { user_id: string; status: string; expires_at: string | null; quiz_id: string; started_at: string };
  if (att.user_id !== user.id) return { success: false, error: { code: "FORBIDDEN", message: "Not your attempt" } };
  if (att.status !== "IN_PROGRESS") return { success: false, error: { code: "CONFLICT", message: "Attempt already submitted" } };

  // Timer validation server-side
  const now = new Date();
  if (att.expires_at && now > new Date(att.expires_at)) {
    await supabase.from("quiz_attempts").update({ status: "EXPIRED", submitted_at: now.toISOString() }).eq("id", parsed.data.attempt_id);
    return { success: false, error: { code: "FORBIDDEN", message: "Time expired" } };
  }

  // Fetch questions + correct answers server-side (never trust client score)
  const { data: quizQs } = await supabase.from("quiz_questions").select("question_id, questions(id, choices, points)").eq("quiz_id", att.quiz_id);
  const questionMap = new Map<string, { choices: { id: string; is_correct: boolean }[]; points: number }>();
  for (const row of (quizQs as unknown as Array<{ question_id: string; questions: { choices: { id: string; is_correct: boolean }[]; points: number } }> ) || []) {
    questionMap.set(row.question_id, { choices: row.questions.choices, points: row.questions.points });
  }

  let totalScore = 0;
  let maxScore = 0;
  for (const q of questionMap.values()) maxScore += q.points;

  for (const ans of parsed.data.answers) {
    const q = questionMap.get(ans.question_id);
    if (!q) continue;
    const correctIds = q.choices.filter((c) => c.is_correct).map((c) => c.id).sort();
    const selected = [...ans.selected_choice_ids].sort();
    const isCorrect = JSON.stringify(correctIds) === JSON.stringify(selected);
    const points = isCorrect ? q.points : 0;
    totalScore += points;

    await supabase.from("quiz_answers").upsert(
      {
        attempt_id: parsed.data.attempt_id,
        question_id: ans.question_id,
        selected_choice_ids: ans.selected_choice_ids,
        is_correct: isCorrect,
        points_earned: points,
      },
      { onConflict: "attempt_id,question_id" }
    );
  }

  const scorePercent = maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0;
  const timeSpent = Math.floor((now.getTime() - new Date(att.started_at).getTime()) / 1000);

  await supabase
    .from("quiz_attempts")
    .update({
      status: "GRADED",
      score: scorePercent,
      max_score: maxScore,
      submitted_at: now.toISOString(),
      time_spent_seconds: timeSpent,
    })
    .eq("id", parsed.data.attempt_id);

  revalidatePath("/quizzes");
  return { success: true, data: { score: scorePercent, maxScore } };
}

export async function createQuiz(formData: FormData): Promise<ActionResult> {
  const raw = {
    course_id: String(formData.get("course_id") || ""),
    title: String(formData.get("title") || ""),
    description: String(formData.get("description") || ""),
    type: String(formData.get("type") || "WEEKLY") as "ICE_BREAKING" | "WEEKLY" | "ASSESSMENT",
    duration_minutes: Number(formData.get("duration_minutes") || 30),
    max_attempts: Number(formData.get("max_attempts") || 1),
    shuffle_questions: formData.get("shuffle_questions") === "true" || formData.get("shuffle_questions") === "on",
    shuffle_choices: formData.get("shuffle_choices") === "true" || formData.get("shuffle_choices") === "on",
    available_from: formData.get("available_from") ? new Date(String(formData.get("available_from"))).toISOString() : null,
    available_until: formData.get("available_until") ? new Date(String(formData.get("available_until"))).toISOString() : null,
    is_published: formData.get("is_published") === "true" || formData.get("is_published") === "on",
    pass_score: Number(formData.get("pass_score") || 60),
  };
  const parsed = quizSchema.safeParse(raw);
  if (!parsed.success) return { success: false, error: { code: "VALIDATION_ERROR", message: parsed.error.issues[0].message } };
  if (!isSupabaseConfigured()) {
    revalidatePath("/quizzes");
    return { success: true };
  }
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: { code: "UNAUTHENTICATED", message: "Login required" } };
  const { error } = await supabase.from("quizzes").insert({ ...parsed.data, created_by: user.id });
  if (error) return { success: false, error: { code: "INTERNAL_ERROR", message: error.message } };
  revalidatePath("/quizzes");
  return { success: true };
}

export async function createQuestion(formData: FormData): Promise<ActionResult> {
  const raw = {
    course_id: formData.get("course_id") ? String(formData.get("course_id")) : null,
    type: String(formData.get("type") || "MULTIPLE_CHOICE") as "MULTIPLE_CHOICE" | "TRUE_FALSE" | "MULTIPLE_ANSWER",
    content: String(formData.get("content") || ""),
    choices: (() => {
      try {
        return JSON.parse(String(formData.get("choices") || "[]"));
      } catch {
        return [];
      }
    })(),
    explanation: formData.get("explanation") ? String(formData.get("explanation")) : null,
    points: Number(formData.get("points") || 10),
  };
  const parsed = questionSchema.safeParse(raw);
  if (!parsed.success) return { success: false, error: { code: "VALIDATION_ERROR", message: parsed.error.issues[0].message } };
  if (!isSupabaseConfigured()) {
    revalidatePath("/quizzes");
    return { success: true };
  }
  const supabase = await createClient();
  const { error } = await supabase.from("questions").insert(parsed.data);
  if (error) return { success: false, error: { code: "INTERNAL_ERROR", message: error.message } };
  revalidatePath("/quizzes");
  return { success: true };
}

// Helper for attempt page: fetch questions randomized server-side, strip is_correct for client
export async function getQuestionsForAttempt(attemptId: string) {
  if (!isSupabaseConfigured()) {
    const shuffled = shuffle(mockQuestions);
    return shuffled.map((q) => ({
      ...q,
      choices: shuffle(q.choices).map((c) => ({ id: c.id, text: c.text })),
    }));
  }
  const supabase = await createClient();
  const { data: attempt } = await supabase.from("quiz_attempts").select("quiz_id, quizzes(shuffle_questions, shuffle_choices)").eq("id", attemptId).maybeSingle();
  if (!attempt) return [];
  const attRaw = attempt as { quiz_id: string; quizzes: { shuffle_questions: boolean; shuffle_choices: boolean } | Array<{ shuffle_questions: boolean; shuffle_choices: boolean }> };
  const attQuizzes = Array.isArray(attRaw.quizzes) ? attRaw.quizzes[0] : attRaw.quizzes;
  const shuffleQs = attQuizzes?.shuffle_questions ?? false;
  const shuffleChoices = attQuizzes?.shuffle_choices ?? false;
  const { data: qqs } = await supabase.from("quiz_questions").select("question_id, questions(id, content, type, choices, points, explanation)").eq("quiz_id", attRaw.quiz_id);
  let questions = (qqs as unknown as Array<{ questions: { id: string; content: string; type: string; choices: { id: string; text: string; is_correct: boolean }[]; points: number; explanation: string | null } }>)?.map((r) => r.questions) || [];
  if (shuffleQs) questions = shuffle(questions);
  return questions.map((q) => ({
    id: q.id,
    content: q.content,
    type: q.type,
    points: q.points,
    explanation: q.explanation,
    choices: (shuffleChoices ? shuffle(q.choices) : q.choices).map((c) => ({ id: c.id, text: c.text })),
  }));
}
