"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { certificateSchema } from "@/lib/validation/event";

type ActionResult = { success: true; data?: unknown } | { success: false; error: { code: string; message: string } };

function isSupabaseConfigured(): boolean {
  return !!process.env.NEXT_PUBLIC_SUPABASE_URL && !!(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY);
}

const mockCertificates = [
  { id: "cert1", certificate_number: "ISC-000001-2025", user_id: "u1", verification_token: "mock-token-abc123", issued_at: new Date().toISOString(), issuer: "Study Club", course_name: "Frontend Development", recipient: "Demo Student" },
];

export async function getCertificates(userId?: string) {
  if (!isSupabaseConfigured()) return mockCertificates;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const uid = userId || user?.id;
  if (!uid) return [];
  const { data } = await supabase.from("certificates").select("*, divisions(name)").eq("user_id", uid).order("issued_at", { ascending: false });
  return data || [];
}

export async function getCertificateByToken(token: string) {
  if (!isSupabaseConfigured()) {
    if (token === "mock-token-abc123" || token === "demo") return mockCertificates[0];
    return null;
  }
  const supabase = await createClient();
  const { data } = await supabase.from("certificates").select("*, profiles(email, full_name), divisions(name)").eq("verification_token", token).maybeSingle();
  return data;
}

export async function issueCertificate(formData: FormData): Promise<ActionResult & { data?: { verification_token: string } }> {
  const raw = {
    user_id: String(formData.get("user_id") || ""),
    division_id: formData.get("division_id") ? String(formData.get("division_id")) : null,
    program_id: formData.get("program_id") ? String(formData.get("program_id")) : null,
    event_id: formData.get("event_id") ? String(formData.get("event_id")) : null,
    competition_id: formData.get("competition_id") ? String(formData.get("competition_id")) : null,
    issuer: String(formData.get("issuer") || "Study Club"),
  };
  const parsed = certificateSchema.safeParse(raw);
  if (!parsed.success) return { success: false, error: { code: "VALIDATION_ERROR", message: parsed.error.issues[0].message } };
  if (!isSupabaseConfigured()) {
    revalidatePath("/certificates");
    return { success: true, data: { verification_token: `mock-${Date.now()}` } };
  }
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: { code: "UNAUTHENTICATED", message: "Login required" } };

  // Generate via trigger, but we can pre-generate token for response
  const verification_token = Math.random().toString(36).slice(2, 10) + Math.random().toString(36).slice(2, 10);
  const certificate_number = `ISC-${Date.now().toString().slice(-6)}-${new Date().getFullYear()}`;

  const { data, error } = await supabase
    .from("certificates")
    .insert({
      certificate_number,
      user_id: parsed.data.user_id,
      division_id: parsed.data.division_id,
      program_id: parsed.data.program_id,
      event_id: parsed.data.event_id,
      competition_id: parsed.data.competition_id,
      issuer: parsed.data.issuer,
      verification_token,
    })
    .select("verification_token")
    .maybeSingle();

  if (error) {
    if (error.code === "23505") return { success: false, error: { code: "CONFLICT", message: "Certificate number/token already exists" } };
    return { success: false, error: { code: "INTERNAL_ERROR", message: error.message } };
  }

  // Optionally generate PDF path via storage certificates bucket (private) — P9 expansion

  revalidatePath("/certificates");
  return { success: true, data: { verification_token: (data as { verification_token: string } | null)?.verification_token || verification_token } };
}

export async function verifyCertificate(token: string) {
  return getCertificateByToken(token);
}
