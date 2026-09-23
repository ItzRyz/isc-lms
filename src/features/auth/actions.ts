"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { loginSchema, registerSchema, forgotPasswordSchema, resetPasswordSchema } from "@/lib/validation/auth";

type ActionResult = { success: true } | { success: false; error: { code: string; message: string } };

function isSupabaseConfigured(): boolean {
  return !!process.env.NEXT_PUBLIC_SUPABASE_URL && !!(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY);
}

export async function login(formData: FormData): Promise<ActionResult> {
  const raw = { email: String(formData.get("email") || ""), password: String(formData.get("password") || "") };
  const parsed = loginSchema.safeParse(raw);
  if (!parsed.success) return { success: false, error: { code: "VALIDATION_ERROR", message: parsed.error.issues[0].message } };
  if (!isSupabaseConfigured()) {
    // Dev fallback: mock success, redirect to dashboard
    return { success: true };
  }
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email: parsed.data.email, password: parsed.data.password });
  if (error) return { success: false, error: { code: "UNAUTHENTICATED", message: error.message } };
  return { success: true };
}

export async function register(formData: FormData): Promise<ActionResult> {
  const raw = {
    fullName: String(formData.get("fullName") || ""),
    email: String(formData.get("email") || ""),
    password: String(formData.get("password") || ""),
    confirmPassword: String(formData.get("confirmPassword") || ""),
  };
  const parsed = registerSchema.safeParse(raw);
  if (!parsed.success) return { success: false, error: { code: "VALIDATION_ERROR", message: parsed.error.issues[0].message } };
  if (!isSupabaseConfigured()) {
    return { success: true };
  }
  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: { data: { full_name: parsed.data.fullName } },
  });
  if (error) return { success: false, error: { code: "VALIDATION_ERROR", message: error.message } };
  return { success: true };
}

export async function forgotPassword(formData: FormData): Promise<ActionResult> {
  const raw = { email: String(formData.get("email") || "") };
  const parsed = forgotPasswordSchema.safeParse(raw);
  if (!parsed.success) return { success: false, error: { code: "VALIDATION_ERROR", message: parsed.error.issues[0].message } };
  if (!isSupabaseConfigured()) return { success: true };
  const supabase = await createClient();
  const origin = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, { redirectTo: `${origin}/reset-password` });
  if (error) return { success: false, error: { code: "INTERNAL_ERROR", message: error.message } };
  return { success: true };
}

export async function resetPassword(formData: FormData): Promise<ActionResult> {
  const raw = { password: String(formData.get("password") || ""), confirmPassword: String(formData.get("confirmPassword") || "") };
  const parsed = resetPasswordSchema.safeParse(raw);
  if (!parsed.success) return { success: false, error: { code: "VALIDATION_ERROR", message: parsed.error.issues[0].message } };
  if (!isSupabaseConfigured()) return { success: true };
  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (error) return { success: false, error: { code: "INTERNAL_ERROR", message: error.message } };
  return { success: true };
}

export async function logout() {
  if (!isSupabaseConfigured()) redirect("/login");
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
