import { z } from "zod";

export const announcementSchema = z.object({
  title: z.string().min(3).max(150),
  content: z.string().min(10).max(5000),
  division_id: z.string().uuid().nullable().optional(),
  class_id: z.string().uuid().nullable().optional(),
  is_pinned: z.boolean().default(false),
  is_published: z.boolean().default(true),
});

export const threadSchema = z.object({
  category_id: z.string().uuid(),
  title: z.string().min(3).max(150),
  content: z.string().min(10).max(10000),
  is_pinned: z.boolean().default(false),
  is_locked: z.boolean().default(false),
});

export const postSchema = z.object({
  thread_id: z.string().uuid(),
  content: z.string().min(1).max(10000),
});

export const commentSchema = z.object({
  material_id: z.string().uuid(),
  content: z.string().min(1).max(5000),
  parent_id: z.string().uuid().nullable().optional(),
});

export const messageSchema = z.object({
  conversation_id: z.string().uuid(),
  content: z.string().min(1).max(5000),
});

export const notificationSchema = z.object({
  recipient_id: z.string().uuid(),
  type: z.enum([
    "ASSIGNMENT_CREATED",
    "ASSIGNMENT_DEADLINE_SOON",
    "ASSIGNMENT_GRADED",
    "ASSIGNMENT_REVISION_REQUIRED",
    "QUIZ_AVAILABLE",
    "QUIZ_DEADLINE_SOON",
    "QUIZ_GRADED",
    "ATTENDANCE_OPENED",
    "ATTENDANCE_RECORDED",
    "ATTENDANCE_CORRECTED",
    "GRADE_PUBLISHED",
    "ANNOUNCEMENT_CREATED",
    "EVENT_CREATED",
    "EVENT_REMINDER",
    "CERTIFICATE_ISSUED",
    "ACHIEVEMENT_UNLOCKED",
  ]),
  title: z.string().min(3).max(150),
  body: z.string().max(2000).optional().nullable(),
  entity_type: z.string().nullable().optional(),
  entity_id: z.string().uuid().nullable().optional(),
  channel: z.enum(["IN_APP", "REALTIME", "EMAIL"]).default("IN_APP"),
});

export type AnnouncementInput = z.infer<typeof announcementSchema>;
export type ThreadInput = z.infer<typeof threadSchema>;
