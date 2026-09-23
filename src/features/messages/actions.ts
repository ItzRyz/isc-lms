"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { messageSchema } from "@/lib/validation/communication";

type ActionResult = { success: true; data?: unknown } | { success: false; error: { code: string; message: string } };

function isSupabaseConfigured(): boolean {
  return !!process.env.NEXT_PUBLIC_SUPABASE_URL && !!(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY);
}

const mockConversations = [
  { id: "conv1", title: "Mentor Web — Member ML", is_group: false, participants: ["Mentor Web", "Member ML"], last_message: "Halo, ada pertanyaan?", unread: 2 },
];

const mockMessages = [
  { id: "msg1", conversation_id: "conv1", sender_id: "m2", content: "Halo, ada pertanyaan tentang HTML?", created_at: new Date(Date.now() - 60000 * 10).toISOString(), profiles: { full_name: "Mentor Web" } },
  { id: "msg2", conversation_id: "conv1", sender_id: "m3", content: "Ya, bingung prerequisites DAG.", created_at: new Date(Date.now() - 60000 * 5).toISOString(), profiles: { full_name: "Member ML" } },
];

export async function getConversations() {
  if (!isSupabaseConfigured()) return mockConversations;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];
  const { data: members } = await supabase.from("conversation_members").select("conversation_id, conversations(id, title, is_group)").eq("user_id", user.id);
  if (!members) return [];
  return (
    members as Array<{
      conversation_id: string;
      conversations: { id: string; title: string | null; is_group: boolean } | Array<{ id: string; title: string | null; is_group: boolean }>;
    }>
  ).map((m) => {
    const conv = Array.isArray(m.conversations) ? m.conversations[0] : m.conversations;
    if (!conv) return null;
    return {
      id: conv.id,
      title: conv.title || "Direct",
      is_group: conv.is_group,
      participants: [],
      last_message: "",
      unread: 0,
    };
  }).filter(Boolean) as Array<{ id: string; title: string; is_group: boolean; participants: string[]; last_message: string; unread: number }>;

}

export async function getMessages(conversationId: string) {
  if (!isSupabaseConfigured()) return mockMessages.filter((m) => m.conversation_id === conversationId);
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];
  // Check membership
  const { data: member } = await supabase.from("conversation_members").select("conversation_id").eq("conversation_id", conversationId).eq("user_id", user.id).maybeSingle();
  if (!member) return [];
  const { data } = await supabase.from("messages").select("*, profiles(full_name)").eq("conversation_id", conversationId).is("deleted_at", null).order("created_at");
  return data || [];
}

export async function sendMessage(formData: FormData): Promise<ActionResult> {
  const raw = {
    conversation_id: String(formData.get("conversation_id") || ""),
    content: String(formData.get("content") || ""),
  };
  const parsed = messageSchema.safeParse(raw);
  if (!parsed.success) return { success: false, error: { code: "VALIDATION_ERROR", message: parsed.error.issues[0].message } };
  if (!isSupabaseConfigured()) {
    revalidatePath("/messages");
    return { success: true };
  }
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: { code: "UNAUTHENTICATED", message: "Login required" } };
  const { error } = await supabase.from("messages").insert({ conversation_id: parsed.data.conversation_id, sender_id: user.id, content: parsed.data.content });
  if (error) return { success: false, error: { code: "INTERNAL_ERROR", message: error.message } };

  // Create realtime notification for other participants (IN_APP + REALTIME, not EMAIL)
  const { data: members } = await supabase.from("conversation_members").select("user_id").eq("conversation_id", parsed.data.conversation_id).neq("user_id", user.id);
  if (members) {
    const notifs = (members as Array<{ user_id: string }>).map((m) => ({
      recipient_id: m.user_id,
      type: "ANNOUNCEMENT_CREATED" as const, // reuse, or custom MESSAGE
      title: "New message",
      body: parsed.data.content.slice(0, 100),
      entity_type: "message",
      channel: "REALTIME" as const,
    }));
    await supabase.from("notifications").insert(notifs);
  }

  revalidatePath("/messages");
  return { success: true };
}

export async function createConversation(formData: FormData): Promise<ActionResult & { data?: { id: string } }> {
  const userIds = String(formData.get("user_ids") || "").split(",").filter(Boolean);
  const title = String(formData.get("title") || "");
  if (userIds.length === 0) return { success: false, error: { code: "VALIDATION_ERROR", message: "user_ids required" } };
  if (!isSupabaseConfigured()) return { success: true, data: { id: `mock-${Date.now()}` } };
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: { code: "UNAUTHENTICATED", message: "Login required" } };
  const { data: conv, error } = await supabase.from("conversations").insert({ is_group: userIds.length > 1, title: title || null, created_by: user.id }).select("id").maybeSingle();
  if (error || !conv) return { success: false, error: { code: "INTERNAL_ERROR", message: error?.message || "Failed" } };
  const cid = (conv as { id: string }).id;
  const allUserIds = [...new Set([...userIds, user.id])];
  await supabase.from("conversation_members").insert(allUserIds.map((uid) => ({ conversation_id: cid, user_id: uid })));
  revalidatePath("/messages");
  return { success: true, data: { id: cid } };
}
