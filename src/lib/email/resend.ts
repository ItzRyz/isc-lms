import "server-only";

import { Resend } from "resend";

// Server-only — jangan import di Client Component (AGENTS.md §36)
// Env: RESEND_API_KEY (re_xxx), RESEND_FROM_EMAIL
export function getResendClient() {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error("Missing RESEND_API_KEY — set di .env.local / Vercel dashboard");
  }
  return new Resend(apiKey);
}

export function getFromEmail(): string {
  return process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev";
}
