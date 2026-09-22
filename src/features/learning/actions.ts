"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { courseSchema } from "@/lib/validation/course";
import { moduleSchema } from "@/lib/validation/module";
import { materialSchema } from "@/lib/validation/material";

type ActionResult = { success: true } | { success: false; error: { code: string; message: string } };

function isSupabaseConfigured(): boolean {
  return !!process.env.NEXT_PUBLIC_SUPABASE_URL && !!(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY);
}

// Mock seed untuk dev tanpa Supabase
const mockDivisions = [
  { id: "web-id", slug: "web", name: "Web Development" },
  { id: "uiux-id", slug: "uiux", name: "UI/UX Design" },
  { id: "ml-id", slug: "ml", name: "Machine Learning" },
];

const mockCourses = [
  {
    id: "course-fe",
    division_id: "web-id",
    slug: "frontend-development",
    name: "Frontend Development",
    description: "HTML, CSS, JS, React, Next.js",
    is_published: true,
    scheduled_at: null as string | null,
    estimated_duration: 600,
    created_at: new Date().toISOString(),
    division_name: "Web Development",
  },
];

const mockModules = [
  { id: "mod-html", course_id: "course-fe", title: "HTML", order_index: 1, is_published: true },
  { id: "mod-css", course_id: "course-fe", title: "CSS", order_index: 2, is_published: true },
  { id: "mod-js", course_id: "course-fe", title: "JavaScript", order_index: 3, is_published: true },
  { id: "mod-react", course_id: "course-fe", title: "React", order_index: 4, is_published: true },
  { id: "mod-next", course_id: "course-fe", title: "Next.js", order_index: 5, is_published: true },
];

const mockMaterials = [
  { id: "mat-html", module_id: "mod-html", course_id: "course-fe", title: "HTML Dasar — Dokumentasi", type: "DOCUMENT" as const, content_url: null, is_published: true, scheduled_at: null, estimated_duration: 60, visibility: "ENROLLED" as const, prerequisite_ids: [] as string[], tags: ["html", "frontend"] },
  { id: "mat-css", module_id: "mod-css", course_id: "course-fe", title: "CSS Fundamentals — Video", type: "VIDEO" as const, content_url: "https://youtube.com/watch?v=css101", is_published: true, scheduled_at: null, estimated_duration: 45, visibility: "ENROLLED" as const, prerequisite_ids: ["mat-html"], tags: ["css"] },
  { id: "mat-js", module_id: "mod-js", course_id: "course-fe", title: "JavaScript ES6 — External Link", type: "EXTERNAL_LINK" as const, content_url: "https://javascript.info", is_published: true, scheduled_at: null, estimated_duration: 90, visibility: "ENROLLED" as const, prerequisite_ids: ["mat-css"], tags: ["javascript"] },
  { id: "mat-react", module_id: "mod-react", course_id: "course-fe", title: "React Intro — Dokumentasi", type: "DOCUMENT" as const, content_url: null, is_published: true, scheduled_at: null, estimated_duration: 90, visibility: "ENROLLED" as const, prerequisite_ids: ["mat-js"], tags: ["react"] },
  { id: "mat-next", module_id: "mod-next", course_id: "course-fe", title: "Next.js App Router — Video + Assignment Ref", type: "VIDEO" as const, content_url: "https://nextjs.org/docs", is_published: true, scheduled_at: null, estimated_duration: 120, visibility: "ENROLLED" as const, prerequisite_ids: ["mat-react", "mat-html"], tags: ["nextjs"] },
];

export async function getDivisionsForLearning() {
  if (!isSupabaseConfigured()) return mockDivisions;
  const supabase = await createClient();
  const { data } = await supabase.from("divisions").select("id, slug, name").eq("is_active", true).is("deleted_at", null).order("name");
  return data || mockDivisions;
}

export async function getCourses(divisionSlug?: string) {
  if (!isSupabaseConfigured()) {
    if (divisionSlug) return mockCourses.filter((c) => mockDivisions.find((d) => d.slug === divisionSlug)?.id === c.division_id);
    return mockCourses;
  }
  const supabase = await createClient();
  let query = supabase.from("courses").select("id, division_id, slug, name, description, is_published, scheduled_at, estimated_duration, created_at, divisions(name)").is("deleted_at", null).order("created_at");
  if (divisionSlug) {
    const { data: div } = await supabase.from("divisions").select("id").eq("slug", divisionSlug).maybeSingle();
    if (div) query = query.eq("division_id", (div as { id: string }).id);
  }
  const { data, error } = await query;
  if (error) {
    console.error("[courses] error:", error);
    return [];
  }
  return (data as unknown as Array<Record<string, unknown>>).map((r) => ({
    id: r.id,
    division_id: r.division_id,
    slug: r.slug,
    name: r.name,
    description: r.description,
    is_published: r.is_published,
    scheduled_at: r.scheduled_at,
    estimated_duration: r.estimated_duration,
    created_at: r.created_at,
    division_name: (r.divisions as { name?: string } | null)?.name || "",
  }));
}

export async function getCourseById(courseId: string) {
  if (!isSupabaseConfigured()) return mockCourses.find((c) => c.id === courseId) || null;
  const supabase = await createClient();
  const { data } = await supabase.from("courses").select("*, divisions(name)").eq("id", courseId).maybeSingle();
  return data;
}

export async function getModulesByCourse(courseId: string) {
  if (!isSupabaseConfigured()) return mockModules.filter((m) => m.course_id === courseId);
  const supabase = await createClient();
  const { data } = await supabase.from("modules").select("*").eq("course_id", courseId).is("deleted_at", null).order("order_index");
  return data || [];
}

export async function getMaterialsByCourse(courseId: string) {
  if (!isSupabaseConfigured()) return mockMaterials.filter((m) => m.course_id === courseId);
  const supabase = await createClient();
  const { data } = await supabase.from("materials").select("*").eq("course_id", courseId).is("deleted_at", null).order("created_at");
  return data || [];
}

export async function getMaterialById(materialId: string) {
  if (!isSupabaseConfigured()) return mockMaterials.find((m) => m.id === materialId) || null;
  const supabase = await createClient();
  const { data } = await supabase.from("materials").select("*").eq("id", materialId).maybeSingle();
  return data;
}

export async function createCourse(formData: FormData): Promise<ActionResult> {
  const raw = {
    division_id: String(formData.get("division_id") || ""),
    name: String(formData.get("name") || ""),
    slug: String(formData.get("slug") || ""),
    description: String(formData.get("description") || ""),
    is_published: formData.get("is_published") === "true" || formData.get("is_published") === "on",
    scheduled_at: formData.get("scheduled_at") ? new Date(String(formData.get("scheduled_at"))).toISOString() : null,
    estimated_duration: formData.get("estimated_duration") ? Number(formData.get("estimated_duration")) : null,
  };
  const parsed = courseSchema.safeParse(raw);
  if (!parsed.success) return { success: false, error: { code: "VALIDATION_ERROR", message: parsed.error.issues[0].message } };
  if (!isSupabaseConfigured()) {
    revalidatePath("/learning");
    return { success: true };
  }
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: { code: "UNAUTHENTICATED", message: "Login required" } };
  const { error } = await supabase.from("courses").insert(parsed.data);
  if (error) {
    if (error.code === "23505") return { success: false, error: { code: "CONFLICT", message: "Slug already exists in division" } };
    return { success: false, error: { code: "INTERNAL_ERROR", message: error.message } };
  }
  revalidatePath("/learning");
  return { success: true };
}

export async function createModule(formData: FormData): Promise<ActionResult> {
  const raw = {
    course_id: String(formData.get("course_id") || ""),
    title: String(formData.get("title") || ""),
    order_index: Number(formData.get("order_index") || "1"),
    is_published: formData.get("is_published") === "true" || formData.get("is_published") === "on",
  };
  const parsed = moduleSchema.safeParse(raw);
  if (!parsed.success) return { success: false, error: { code: "VALIDATION_ERROR", message: parsed.error.issues[0].message } };
  if (!isSupabaseConfigured()) {
    revalidatePath("/learning");
    return { success: true };
  }
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: { code: "UNAUTHENTICATED", message: "Login required" } };
  const { error } = await supabase.from("modules").insert(parsed.data);
  if (error) return { success: false, error: { code: "INTERNAL_ERROR", message: error.message } };
  revalidatePath("/learning");
  return { success: true };
}

export async function createMaterial(formData: FormData): Promise<ActionResult> {
  const raw = {
    module_id: String(formData.get("module_id") || ""),
    course_id: String(formData.get("course_id") || ""),
    title: String(formData.get("title") || ""),
    type: String(formData.get("type") || "DOCUMENT") as "DOCUMENT" | "EXTERNAL_LINK" | "VIDEO" | "ASSIGNMENT_REF" | "QUIZ_REF",
    content_url: formData.get("content_url") ? String(formData.get("content_url")) : null,
    assignment_id: formData.get("assignment_id") ? String(formData.get("assignment_id")) : null,
    quiz_id: formData.get("quiz_id") ? String(formData.get("quiz_id")) : null,
    is_published: formData.get("is_published") === "true" || formData.get("is_published") === "on",
    scheduled_at: formData.get("scheduled_at") ? new Date(String(formData.get("scheduled_at"))).toISOString() : null,
    estimated_duration: formData.get("estimated_duration") ? Number(formData.get("estimated_duration")) : null,
    visibility: String(formData.get("visibility") || "ENROLLED") as "PUBLIC" | "ENROLLED",
    prerequisite_ids: formData.get("prerequisite_ids") ? String(formData.get("prerequisite_ids")).split(",").filter(Boolean) : [],
    tags: formData.get("tags") ? String(formData.get("tags")).split(",").filter(Boolean) : [],
  };
  const parsed = materialSchema.safeParse(raw);
  if (!parsed.success) return { success: false, error: { code: "VALIDATION_ERROR", message: parsed.error.issues[0].message } };
  if (!isSupabaseConfigured()) {
    revalidatePath("/learning");
    return { success: true };
  }
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: { code: "UNAUTHENTICATED", message: "Login required" } };

  const { prerequisite_ids, tags, ...materialData } = parsed.data;
  const { data: inserted, error } = await supabase.from("materials").insert(materialData).select("id").maybeSingle();
  if (error) return { success: false, error: { code: "INTERNAL_ERROR", message: error.message } };
  const materialId = (inserted as { id: string } | null)?.id;
  if (materialId && prerequisite_ids?.length) {
    const rows = prerequisite_ids.map((pid) => ({ material_id: materialId, prerequisite_id: pid }));
    await supabase.from("material_prerequisites").insert(rows);
  }
  if (materialId && tags?.length) {
    await supabase.from("material_tags").insert(tags.map((tag) => ({ material_id: materialId, tag })));
  }
  revalidatePath("/learning");
  return { success: true };
}

// Progress helpers
export async function completeMaterial(materialId: string): Promise<ActionResult> {
  if (!isSupabaseConfigured()) return { success: true };
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: { code: "UNAUTHENTICATED", message: "Login required" } };

  // Check prerequisites DAG: all prereq must be completed
  const { data: prereqs } = await supabase.from("material_prerequisites").select("prerequisite_id").eq("material_id", materialId);
  if (prereqs && prereqs.length > 0) {
    const prereqIds = prereqs.map((p: { prerequisite_id: string }) => p.prerequisite_id);
    const { data: completed } = await supabase
      .from("material_progress")
      .select("material_id")
      .eq("user_id", user.id)
      .eq("is_completed", true)
      .in("material_id", prereqIds);
    const completedIds = new Set((completed || []).map((c: { material_id: string }) => c.material_id));
    const missing = prereqIds.filter((id: string) => !completedIds.has(id));
    if (missing.length > 0) {
      return { success: false, error: { code: "PRECONDITION_FAILED", message: `Complete prerequisites first: ${missing.length} remaining` } };
    }
  }

  const { error } = await supabase.from("material_progress").upsert(
    { user_id: user.id, material_id: materialId, is_completed: true, completed_at: new Date().toISOString() },
    { onConflict: "user_id,material_id" }
  );
  if (error) return { success: false, error: { code: "INTERNAL_ERROR", message: error.message } };

  await supabase.from("learning_activities").insert({ user_id: user.id, material_id: materialId, action: "COMPLETE" });

  // Recalculate course progress snapshot (material only untuk P3; assignment/quiz nanti P4/P5)
  const { data: mat } = await supabase.from("materials").select("course_id").eq("id", materialId).maybeSingle();
  if (mat) {
    const courseId = (mat as { course_id: string }).course_id;
    const { data: allMats } = await supabase.from("materials").select("id").eq("course_id", courseId).is("deleted_at", null).eq("is_published", true);
    const total = allMats?.length || 1;
    const { data: done } = await supabase.from("material_progress").select("material_id").eq("user_id", user.id).eq("is_completed", true);
    const doneInCourse = (done || []).filter((d: { material_id: string }) => allMats?.some((m: { id: string }) => m.id === d.material_id)).length;
    const materialCompletion = Math.round((doneInCourse / total) * 100);
    const totalProgress = Math.round(materialCompletion * 0.4); // P3 hanya material 40%, assignment/quiz 0 sementara
    await supabase.from("course_progress_snapshots").insert({
      user_id: user.id,
      course_id: courseId,
      material_completion: materialCompletion,
      assignment_completion: 0,
      quiz_completion: 0,
      total: totalProgress,
      weights: { material: 40, assignment: 30, quiz: 30 },
    });
  }

  revalidatePath("/learning");
  return { success: true };
}

export async function toggleBookmark(materialId: string, isBookmarked: boolean): Promise<ActionResult> {
  if (!isSupabaseConfigured()) return { success: true };
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: { code: "UNAUTHENTICATED", message: "Login required" } };
  if (isBookmarked) {
    const { error } = await supabase.from("material_bookmarks").delete().eq("user_id", user.id).eq("material_id", materialId);
    if (error) return { success: false, error: { code: "INTERNAL_ERROR", message: error.message } };
  } else {
    const { error } = await supabase.from("material_bookmarks").insert({ user_id: user.id, material_id: materialId });
    if (error && error.code !== "23505") return { success: false, error: { code: "INTERNAL_ERROR", message: error.message } };
  }
  revalidatePath("/learning");
  return { success: true };
}
