import "server-only";

// Per-event FROM map — jawaban user #1: "per event"
// Semua domain harus verified di Resend Dashboard → Domains.
// Fallback ke RESEND_FROM_EMAIL jika env per-event tidak diisi.
export const FROM_MAP = {
  // Auth via Supabase SMTP-Resend (jawaban #3): gunakan auth@ domain verified
  AUTH: process.env.RESEND_FROM_AUTH || process.env.RESEND_FROM_EMAIL || "auth@yourdomain.com",
  // Assignments (§46 ASSIGNMENT_GRADED, REVISION_REQUIRED, DEADLINE_SOON)
  ASSIGNMENT_GRADED: process.env.RESEND_FROM_ASSIGNMENTS || process.env.RESEND_FROM_EMAIL || "assignments@yourdomain.com",
  ASSIGNMENT_REVISION_REQUIRED: process.env.RESEND_FROM_ASSIGNMENTS || process.env.RESEND_FROM_EMAIL || "assignments@yourdomain.com",
  ASSIGNMENT_DEADLINE_SOON: process.env.RESEND_FROM_ASSIGNMENTS || process.env.RESEND_FROM_EMAIL || "assignments@yourdomain.com",
  // Quiz
  QUIZ_GRADED: process.env.RESEND_FROM_QUIZZES || process.env.RESEND_FROM_EMAIL || "quizzes@yourdomain.com",
  // Grades
  GRADE_PUBLISHED: process.env.RESEND_FROM_GRADES || process.env.RESEND_FROM_EMAIL || "grades@yourdomain.com",
  // Certificates (§28)
  CERTIFICATE_ISSUED: process.env.RESEND_FROM_CERTIFICATES || process.env.RESEND_FROM_EMAIL || "certificates@yourdomain.com",
  // Events (§26) + Announcements (§23) — P8 Communication
  EVENT_CREATED: process.env.RESEND_FROM_EVENTS || process.env.RESEND_FROM_EMAIL || "events@yourdomain.com",
  EVENT_REMINDER: process.env.RESEND_FROM_EVENTS || process.env.RESEND_FROM_EMAIL || "events@yourdomain.com",
  ANNOUNCEMENT_CREATED: process.env.RESEND_FROM_ANNOUNCEMENTS || process.env.RESEND_FROM_EMAIL || "announcements@yourdomain.com",
} as const;

export type EmailEventType = keyof typeof FROM_MAP;

export function getFromForEvent(eventType: EmailEventType): string {
  return FROM_MAP[eventType] || process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev";
}

// Events yang hanya in-app (jawaban #2: "cukup in app")
export const IN_APP_ONLY_EVENTS = [
  "ASSIGNMENT_CREATED",
  "QUIZ_AVAILABLE",
  "ATTENDANCE_OPENED",
  "ATTENDANCE_RECORDED",
  "ATTENDANCE_CORRECTED",
  "ACHIEVEMENT_UNLOCKED",
] as const;
