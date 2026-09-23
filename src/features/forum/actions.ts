"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { threadSchema, postSchema } from "@/lib/validation/communication";

type ActionResult = { success: true; data?: unknown } | { success: false; error: { code: string; message: string } };

function isSupabaseConfigured(): boolean {
  return !!process.env.NEXT_PUBLIC_SUPABASE_URL && !!(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY);
}

const mockCategories = [
  { id: "cat1", name: "General", slug: "general", description: "General discussion" },
  { id: "cat2", name: "Q&A", slug: "qa", description: "Mentor/Member Q&A" },
  { id: "cat3", name: "Web Development", slug: "web-dev", description: "Web division forum" },
];

const mockThreads = [
  { id: "t1", category_id: "cat2", title: "Bagaimana handle prerequisites DAG?", content: "Mohon penjelasan multi-parent...", created_by: "m1", is_pinned: true, view_count: 42, created_at: new Date().toISOString(), profiles: { full_name: "Mentor Web" }, reply_count: 3 },
  { id: "t2", category_id: "cat1", title: "Welcome", content: "Halo semua!", created_by: "m2", is_pinned: false, view_count: 10, created_at: new Date().toISOString(), profiles: { full_name: "Member ML" }, reply_count: 0 },
];

export async function getForumCategories() {
  if (!isSupabaseConfigured()) return mockCategories;
  const supabase = await createClient();
  const { data } = await supabase.from("forum_categories").select("*").order("name");
  return data || mockCategories;
}

export async function getForumThreads(categoryId?: string) {
  if (!isSupabaseConfigured()) {
    if (categoryId) return mockThreads.filter((t) => t.category_id === categoryId);
    return mockThreads;
  }
  const supabase = await createClient();
  let query = supabase.from("forum_threads").select("*, profiles(full_name), forum_posts(count)").is("deleted_at", null).order("is_pinned", { ascending: false }).order("created_at", { ascending: false });
  if (categoryId) query = query.eq("category_id", categoryId);
  const { data } = await query;
  return data || [];
}

export async function getThreadById(threadId: string) {
  if (!isSupabaseConfigured()) return mockThreads.find((t) => t.id === threadId) || null;
  const supabase = await createClient();
  const { data } = await supabase.from("forum_threads").select("*, profiles(full_name)").eq("id", threadId).maybeSingle();
  if (data) {
    await supabase.from("forum_threads").update({ view_count: (data as { view_count: number }).view_count + 1 }).eq("id", threadId);
  }
  return data;
}

export async function getPostsByThread(threadId: string) {
  if (!isSupabaseConfigured()) {
    return [
      { id: "p1", thread_id: threadId, content: "Jawaban: DAG cek via material_prerequisites semua completed.", created_by: "m1", created_at: new Date().toISOString(), profiles: { full_name: "Mentor Web" } },
      { id: "p2", thread_id: threadId, content: "Terima kasih!", created_by: "m3", created_at: new Date().toISOString(), profiles: { full_name: "Member ML" } },
    ];
  }
  const supabase = await createClient();
  const { data } = await supabase.from("forum_posts").select("*, profiles(full_name)").eq("thread_id", threadId).is("deleted_at", null).order("created_at");
  return data || [];
}

export async function createThread(formData: FormData): Promise<ActionResult> {
  const raw = {
    category_id: String(formData.get("category_id") || ""),
    title: String(formData.get("title") || ""),
    content: String(formData.get("content") || ""),
    is_pinned: formData.get("is_pinned") === "true" || formData.get("is_pinned") === "on",
    is_locked: false,
  };
  const parsed = threadSchema.safeParse(raw);
  if (!parsed.success) return { success: false, error: { code: "VALIDATION_ERROR", message: parsed.error.issues[0].message } };
  if (!isSupabaseConfigured()) {
    revalidatePath("/discussions");
    return { success: true, data: { id: `mock-${Date.now()}` } };
  }
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: { code: "UNAUTHENTICATED", message: "Login required" } };
  const { data, error } = await supabase.from("forum_threads").insert({ ...parsed.data, created_by: user.id }).select("id").maybeSingle();
  if (error) return { success: false, error: { code: "INTERNAL_ERROR", message: error.message } };
  revalidatePath("/discussions");
  return { success: true, data: { id: (data as { id: string }).id } };
}

export async function createPost(formData: FormData): Promise<ActionResult> {
  const raw = {
    thread_id: String(formData.get("thread_id") || ""),
    content: String(formData.get("content") || ""),
  };
  const parsed = postSchema.safeParse(raw);
  if (!parsed.success) return { success: false, error: { code: "VALIDATION_ERROR", message: parsed.error.issues[0].message } };
  if (!isSupabaseConfigured()) {
    revalidatePath("/discussions");
    return { success: true };
  }
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: { code: "UNAUTHENTICATED", message: "Login required" } };
  // Check thread not locked
  const { data: thread } = await supabase.from("forum_threads").select("is_locked").eq("id", parsed.data.thread_id).maybeSingle();
  if ((thread as { is_locked?: boolean } | null)?.is_locked) return { success: false, error: { code: "FORBIDDEN", message: "Thread locked" } };
  const { error } = await supabase.from("forum_posts").insert({ ...parsed.data, created_by: user.id });
  if (error) return { success: false, error: { code: "INTERNAL_ERROR", message: error.message } };
  revalidatePath("/discussions");
  return { success: true };
}
