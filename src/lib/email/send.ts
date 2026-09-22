import "server-only";

import { getResendClient, getFromEmail } from "./resend";
import { getFromForEvent } from "./config";

type SendEmailOptions = {
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
  react?: React.ReactElement;
  from?: string;
  replyTo?: string;
  tags?: { name: string; value: string }[];
};

type SendResult =
  | { success: true; id: string }
  | { success: false; error: { code: string; message: string } };

/**
 * Transactional email via Resend (server-only).
 * Gunakan selektif per AGENTS.md §47 — jangan untuk tiap realtime event.
 * Events: ASSIGNMENT_GRADED, GRADE_PUBLISHED, CERTIFICATE_ISSUED, dll (§46)
 */
export async function sendEmail(options: SendEmailOptions): Promise<SendResult> {
  try {
    const resend = getResendClient();
    const from = options.from || getFromEmail();

    const { data, error } = await resend.emails.send({
      from,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
      react: options.react,
      replyTo: options.replyTo,
      tags: options.tags,
    });

    if (error) {
      console.error("[email] Resend error:", error);
      return {
        success: false,
        error: { code: "EMAIL_SEND_FAILED", message: error.message || "Failed to send email" },
      };
    }

    return { success: true, id: data?.id || "" };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown email error";
    console.error("[email] sendEmail exception:", message);
    return { success: false, error: { code: "INTERNAL_ERROR", message } };
  }
}

// Convenience helpers untuk event-type sesuai AGENTS.md §46
// Per-event FROM via config.ts (jawaban #1), selective email per §47
export async function sendAssignmentGradedEmail(to: string, assignmentTitle: string, grade: string) {
  return sendEmail({
    from: getFromForEvent("ASSIGNMENT_GRADED"),
    to,
    subject: `Assignment Graded: ${assignmentTitle}`,
    html: `<p>Assignment <strong>${assignmentTitle}</strong> telah dinilai. Nilai: <strong>${grade}</strong></p>`,
    tags: [{ name: "type", value: "ASSIGNMENT_GRADED" }],
  });
}

export async function sendAssignmentRevisionRequiredEmail(to: string, assignmentTitle: string, feedback: string) {
  return sendEmail({
    from: getFromForEvent("ASSIGNMENT_REVISION_REQUIRED"),
    to,
    subject: `Revision Required: ${assignmentTitle}`,
    html: `<p>Assignment <strong>${assignmentTitle}</strong> memerlukan revisi.</p><p>Feedback: ${feedback}</p>`,
    tags: [{ name: "type", value: "ASSIGNMENT_REVISION_REQUIRED" }],
  });
}

export async function sendAssignmentDeadlineSoonEmail(to: string, assignmentTitle: string, dueAt: string) {
  return sendEmail({
    from: getFromForEvent("ASSIGNMENT_DEADLINE_SOON"),
    to,
    subject: `Deadline Reminder: ${assignmentTitle}`,
    html: `<p>Pengingat: Assignment <strong>${assignmentTitle}</strong> deadline <strong>${dueAt}</strong>.</p>`,
    tags: [{ name: "type", value: "ASSIGNMENT_DEADLINE_SOON" }],
  });
}

export async function sendQuizGradedEmail(to: string, quizTitle: string, score: number) {
  return sendEmail({
    from: getFromForEvent("QUIZ_GRADED"),
    to,
    subject: `Quiz Graded: ${quizTitle}`,
    html: `<p>Quiz <strong>${quizTitle}</strong> telah dinilai. Skor: <strong>${score}</strong></p>`,
    tags: [{ name: "type", value: "QUIZ_GRADED" }],
  });
}

export async function sendCertificateIssuedEmail(to: string, certificateNumber: string, verifyUrl: string) {
  return sendEmail({
    from: getFromForEvent("CERTIFICATE_ISSUED"),
    to,
    subject: "Certificate Issued",
    html: `<p>Sertifikat Anda <strong>${certificateNumber}</strong> telah terbit.</p><p>Verifikasi: <a href="${verifyUrl}">${verifyUrl}</a></p>`,
    tags: [{ name: "type", value: "CERTIFICATE_ISSUED" }],
  });
}

export async function sendGradePublishedEmail(to: string, period: string) {
  return sendEmail({
    from: getFromForEvent("GRADE_PUBLISHED"),
    to,
    subject: `Grade Published: ${period}`,
    html: `<p>Nilai periode <strong>${period}</strong> telah dipublikasikan.</p>`,
    tags: [{ name: "type", value: "GRADE_PUBLISHED" }],
  });
}

export async function sendAnnouncementEmail(to: string | string[], title: string, body: string) {
  return sendEmail({
    from: getFromForEvent("ANNOUNCEMENT_CREATED"),
    to,
    subject: `Announcement: ${title}`,
    html: `<h3>${title}</h3><p>${body}</p>`,
    tags: [{ name: "type", value: "ANNOUNCEMENT_CREATED" }],
  });
}

export async function sendEventReminderEmail(to: string | string[], eventTitle: string, eventAt: string, location?: string) {
  return sendEmail({
    from: getFromForEvent("EVENT_REMINDER"),
    to,
    subject: `Event Reminder: ${eventTitle}`,
    html: `<p>Pengingat event <strong>${eventTitle}</strong> pada <strong>${eventAt}</strong>${location ? ` di ${location}` : ""}.</p>`,
    tags: [{ name: "type", value: "EVENT_REMINDER" }],
  });
}

export async function sendEventCreatedEmail(to: string | string[], eventTitle: string, eventAt: string) {
  return sendEmail({
    from: getFromForEvent("EVENT_CREATED"),
    to,
    subject: `New Event: ${eventTitle}`,
    html: `<p>Event baru <strong>${eventTitle}</strong> dijadwalkan pada ${eventAt}.</p>`,
    tags: [{ name: "type", value: "EVENT_CREATED" }],
  });
}
