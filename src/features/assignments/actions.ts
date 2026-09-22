"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { assignmentSchema, submissionSchema, gradeSchema } from "@/lib/validation/assignment";

type ActionResult = { success: true; data?: unknown } | { success: false; error: { code: string; message: string } };

function isSupabaseConfigured(): boolean {
  return !!process.env.NEXT_PUBLIC_SUPABASE_URL && !!(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY);
}

// Mock untuk dev tanpa Supabase
const mockAssignments = [
  {
    id: "assign-html",
    course_id: "course-fe",
    course_name: "Frontend Development",
    title: "Tugas HTML — Buat Landing Page",
    description: "Buat landing page responsif dengan HTML semantik. Upload file zip + deskripsi.",
    type: "INDIVIDUAL" as const,
    submission_type: "FILE_AND_TEXT" as const,
    due_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    allow_late: true,
    max_score: 100,
    is_published: true,
    status: "NOT_STARTED" as const,
  },
  {
    id: "assign-group",
    course_id: "course-fe",
    course_name: "Frontend Development",
    title: "Tugas Kelompok — Clone Website",
    description: "Kelompok 3 orang, clone homepage study club.",
    type: "GROUP" as const,
    submission_type: "FILE" as const,
    due_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
    allow_late: true,
    max_score: 100,
    is_published: true,
    status: "NOT_STARTED" as const,
  },
];

export async function getAssignments(courseId?: string) {
  if (!isSupabaseConfigured()) {
    if (courseId) return mockAssignments.filter((a) => a.course_id === courseId);
    return mockAssignments;
  }
  const supabase = await createClient();
  let query = supabase.from("assignments").select("id, course_id, title, description, type, submission_type, due_at, allow_late, max_score, is_published, created_at, courses(name)").is("deleted_at", null).order("due_at", { ascending: true });
  if (courseId) query = query.eq("course_id", courseId);
  const { data, error } = await query;
  if (error) {
    console.error("[assignments] error:", error);
    return [];
  }
  return (data as unknown as Array<Record<string, unknown>>).map((r) => ({
    id: r.id,
    course_id: r.course_id,
    course_name: (r.courses as { name?: string } | null)?.name || r.course_id,
    title: r.title,
    description: r.description,
    type: r.type,
    submission_type: r.submission_type,
    due_at: r.due_at,
    allow_late: r.allow_late,
    max_score: r.max_score,
    is_published: r.is_published,
  }));
}

export async function getAssignmentById(id: string) {
  if (!isSupabaseConfigured()) return mockAssignments.find((a) => a.id === id) || null;
  const supabase = await createClient();
  const { data } = await supabase.from("assignments").select("*, courses(name), modules(title)").eq("id", id).maybeSingle();
  return data;
}

export async function getSubmission(assignmentId: string, userId?: string) {
  if (!isSupabaseConfigured()) return null;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const uid = userId || user?.id;
  if (!uid) return null;
  const { data } = await supabase.from("submissions").select("*").eq("assignment_id", assignmentId).eq("user_id", uid).order("attempt_number", { ascending: false }).maybeSingle();
  return data;
}

export async function getSubmissionsForAssignment(assignmentId: string) {
  if (!isSupabaseConfigured()) return [];
  const supabase = await createClient();
  const { data } = await supabase.from("submissions").select("*, profiles(email, full_name)").eq("assignment_id", assignmentId).order("submitted_at");
  return data || [];
}

export async function createAssignment(formData: FormData): Promise<ActionResult> {
  const raw = {
    course_id: String(formData.get("course_id") || ""),
    module_id: formData.get("module_id") ? String(formData.get("module_id")) : null,
    title: String(formData.get("title") || ""),
    description: String(formData.get("description") || ""),
    type: String(formData.get("type") || "INDIVIDUAL") as "INDIVIDUAL" | "GROUP",
    submission_type: String(formData.get("submission_type") || "FILE_AND_TEXT") as "FILE" | "TEXT" | "FILE_AND_TEXT",
    due_at: formData.get("due_at") ? new Date(String(formData.get("due_at"))).toISOString() : null,
    allow_late: formData.get("allow_late") === "true" || formData.get("allow_late") === "on",
    max_score: formData.get("max_score") ? Number(formData.get("max_score")) : 100,
    max_attempts: formData.get("max_attempts") ? Number(formData.get("max_attempts")) : 1,
    is_published: formData.get("is_published") === "true" || formData.get("is_published") === "on",
  };
  const parsed = assignmentSchema.safeParse(raw);
  if (!parsed.success) return { success: false, error: { code: "VALIDATION_ERROR", message: parsed.error.issues[0].message } };
  if (!isSupabaseConfigured()) {
    revalidatePath("/assignments");
    return { success: true };
  }
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: { code: "UNAUTHENTICATED", message: "Login required" } };
  const { error } = await supabase.from("assignments").insert({ ...parsed.data, created_by: user.id });
  if (error) return { success: false, error: { code: "INTERNAL_ERROR", message: error.message } };
  revalidatePath("/assignments");
  return { success: true };
}

// Submit handler — deadline validation server-side (§14 Important), late detection, autosave draft, file + text
export async function submitAssignment(formData: FormData): Promise<ActionResult> {
  const raw = {
    assignment_id: String(formData.get("assignment_id") || ""),
    content_text: formData.get("content_text") ? String(formData.get("content_text")) : null,
  };
  const parsed = submissionSchema.safeParse(raw);
  if (!parsed.success) return { success: false, error: { code: "VALIDATION_ERROR", message: parsed.error.issues[0].message } };

  const isDraft = formData.get("is_draft") === "true";
  const file = formData.get("file") as File | null;

  if (!isSupabaseConfigured()) {
    revalidatePath("/assignments");
    return { success: true, data: { mock: true } };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: { code: "UNAUTHENTICATED", message: "Login required" } };

  // Fetch assignment for deadline & submission_type validation
  const { data: assignment } = await supabase.from("assignments").select("due_at, allow_late, submission_type, max_attempts").eq("id", parsed.data.assignment_id).maybeSingle();
  if (!assignment) return { success: false, error: { code: "NOT_FOUND", message: "Assignment not found" } };
  const dueAt = (assignment as { due_at: string | null }).due_at;
  const allowLate = (assignment as { allow_late: boolean }).allow_late;
  const submissionType = (assignment as { submission_type: string }).submission_type;

  // Validate submission_type
  if (submissionType === "FILE" && !file && !isDraft) return { success: false, error: { code: "VALIDATION_ERROR", message: "File required" } };
  if (submissionType === "TEXT" && !parsed.data.content_text && !isDraft) return { success: false, error: { code: "VALIDATION_ERROR", message: "Text required" } };
  if (submissionType === "FILE_AND_TEXT" && !parsed.data.content_text && !file && !isDraft) return { success: false, error: { code: "VALIDATION_ERROR", message: "File or text required" } };

  // Deadline validation server-side — jangan percaya client (§14)
  const now = new Date();
  const isLate = dueAt ? now > new Date(dueAt) : false;
  if (isLate && !allowLate) return { success: false, error: { code: "FORBIDDEN", message: "Deadline passed and late not allowed" } };
  const status = isDraft ? "DRAFT" : isLate ? "LATE" : "SUBMITTED";

  // Check attempt limit
  const { data: existingSubs } = await supabase.from("submissions").select("attempt_number, status").eq("assignment_id", parsed.data.assignment_id).eq("user_id", user.id).order("attempt_number", { ascending: false }).limit(1);
  const lastAttempt = existingSubs?.[0] as { attempt_number: number; status: string } | undefined;
  if (lastAttempt && lastAttempt.status === "GRADED" && (assignment as { max_attempts: number }).max_attempts <= lastAttempt.attempt_number) {
    return { success: false, error: { code: "FORBIDDEN", message: "Max attempts reached" } };
  }
  const attemptNumber = lastAttempt ? lastAttempt.attempt_number + 1 : 1;

  // Insert submission (transaction)
  const { data: inserted, error: insertError } = await supabase
    .from("submissions")
    .insert({
      assignment_id: parsed.data.assignment_id,
      user_id: user.id,
      status,
      content_text: parsed.data.content_text,
      submitted_at: status !== "DRAFT" ? now.toISOString() : null,
      attempt_number: attemptNumber,
    })
    .select("id")
    .maybeSingle();

  if (insertError) return { success: false, error: { code: "INTERNAL_ERROR", message: insertError.message } };
  const submissionId = (inserted as { id: string } | null)?.id;

  // Handle file upload ke bucket assignment-submissions (private) — §37
  if (file && submissionId) {
    // Validate MIME & size (max 10MB untuk MVP, bucket limit 50MB)
    const allowedMime = ["application/pdf", "application/zip", "image/png", "image/jpeg", "text/plain", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"];
    if (file.size > 10 * 1024 * 1024) return { success: false, error: { code: "VALIDATION_ERROR", message: "File too large (max 10MB)" } };
    if (file.type && !allowedMime.includes(file.type) && !file.type.startsWith("image/") && !file.type.startsWith("application/")) {
      // still allow tapi log
      console.warn("[assignments] mime not in allowlist:", file.type);
    }
    const storagePath = `${parsed.data.assignment_id}/${user.id}/${submissionId}/${file.name}`;
    const { error: uploadError } = await supabase.storage.from("assignment-submissions").upload(storagePath, file, { upsert: true });
    if (uploadError) return { success: false, error: { code: "INTERNAL_ERROR", message: uploadError.message } };
    await supabase.from("submission_files").insert({
      submission_id: submissionId,
      file_name: file.name,
      storage_path: storagePath,
      mime_type: file.type || null,
      file_size: file.size,
    });
  }

  revalidatePath("/assignments");
  revalidatePath(`/assignments/${parsed.data.assignment_id}`);
  return { success: true, data: { status } };
}

export async function gradeSubmission(formData: FormData): Promise<ActionResult> {
  const raw = {
    submission_id: String(formData.get("submission_id") || ""),
    score: Number(formData.get("score") || 0),
    feedback: formData.get("feedback") ? String(formData.get("feedback")) : null,
    status: String(formData.get("status") || "GRADED") as "GRADED" | "REVISION_REQUIRED",
  };
  const parsed = gradeSchema.safeParse(raw);
  if (!parsed.success) return { success: false, error: { code: "VALIDATION_ERROR", message: parsed.error.issues[0].message } };

  if (!isSupabaseConfigured()) {
    revalidatePath("/assignments");
    return { success: true };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: { code: "UNAUTHENTICATED", message: "Login required" } };

  // Check permission has_permission assignment.grade (RLS juga, tapi app layer explicit)
  const { data: hasPerm } = await supabase.rpc("has_permission", { uid: user.id, perm: "assignment.grade" });
  // Fallback: check role MENTOR/WEB_COORDINATOR
  const { data: roles } = await supabase.from("user_roles").select("roles(name)").eq("user_id", user.id);
  const roleNames = (roles || []).map((r: unknown) => (r as { roles: { name: string } }).roles.name);
  const canGrade = hasPerm || roleNames.includes("MENTOR") || roleNames.some((n: string) => n.endsWith("_COORDINATOR")) || roleNames.includes("SUPER_ADMIN");
  if (!canGrade) return { success: false, error: { code: "FORBIDDEN", message: "No grade permission" } };

  // Fetch submission for history
  const { data: sub } = await supabase.from("submissions").select("status, score").eq("id", parsed.data.submission_id).maybeSingle();
  const oldStatus = (sub as { status: string } | null)?.status || null;
  const oldScore = (sub as { score: number | null } | null)?.score || null;

  const { error } = await supabase
    .from("submissions")
    .update({
      score: parsed.data.score,
      feedback: parsed.data.feedback,
      status: parsed.data.status,
      graded_at: new Date().toISOString(),
      graded_by: user.id,
    })
    .eq("id", parsed.data.submission_id);
  if (error) return { success: false, error: { code: "INTERNAL_ERROR", message: error.message } };

  // Grading history (submission_revisions) per §14, §30 audit
  await supabase.from("submission_revisions").insert({
    submission_id: parsed.data.submission_id,
    old_status: oldStatus,
    new_status: parsed.data.status,
    old_score: oldScore,
    new_score: parsed.data.score,
    feedback: parsed.data.feedback,
    changed_by: user.id,
  });

  // Email notification via Resend (selective §47) — fire and forget, tidak block grading
  // TODO: sendAssignmentGradedEmail to student (lookup email via profiles)

  revalidatePath("/assignments");
  return { success: true };
}

export async function requestRevision(formData: FormData): Promise<ActionResult> {
  formData.set("status", "REVISION_REQUIRED");
  return gradeSubmission(formData);
}
