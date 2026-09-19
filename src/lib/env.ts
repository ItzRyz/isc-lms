import { z } from "zod";

// Validasi env server-side only. Jangan import file ini di Client Component.
const serverSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).optional(),
  SENDER_API_KEY: z.string().optional(),
  SENDER_FROM_EMAIL: z.string().email().optional(),
  FASTAPI_BASE_URL: z.string().url().optional(),
  FASTAPI_INTERNAL_SECRET: z.string().optional(),
  SENTRY_DSN: z.string().optional(),
  UPSTASH_REDIS_REST_URL: z.string().url().optional(),
  UPSTASH_REDIS_REST_TOKEN: z.string().optional(),
});

const clientSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  NEXT_PUBLIC_APP_URL: z.string().url().optional(),
});

export function validateEnv() {
  const isServer = typeof window === "undefined";
  if (isServer) {
    const parsed = serverSchema.safeParse(process.env);
    if (!parsed.success) {
      console.error("❌ Invalid server env:", parsed.error.flatten());
      throw new Error("Invalid server env");
    }
  } else {
    const parsed = clientSchema.safeParse({
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    });
    if (!parsed.success) {
      console.error("❌ Invalid client env:", parsed.error.flatten());
      throw new Error("Invalid client env");
    }
  }
}

export type ServerEnv = z.infer<typeof serverSchema>;
export type ClientEnv = z.infer<typeof clientSchema>;
