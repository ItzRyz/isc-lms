import "server-only";

import { getResendClient, getFromEmail } from "./resend";

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
export async function sendAssignmentGradedEmail(to: string, assignmentTitle: string, grade: string) {
  return sendEmail({
    to,
    subject: `Assignment Graded: ${assignmentTitle}`,
    html: `<p>Assignment <strong>${assignmentTitle}</strong> telah dinilai. Nilai: <strong>${grade}</strong></p>`,
    tags: [{ name: "type", value: "ASSIGNMENT_GRADED" }],
  });
}

export async function sendCertificateIssuedEmail(to: string, certificateNumber: string, verifyUrl: string) {
  return sendEmail({
    to,
    subject: "Certificate Issued",
    html: `<p>Sertifikat Anda <strong>${certificateNumber}</strong> telah terbit.</p><p>Verifikasi: <a href="${verifyUrl}">${verifyUrl}</a></p>`,
    tags: [{ name: "type", value: "CERTIFICATE_ISSUED" }],
  });
}

export async function sendGradePublishedEmail(to: string, period: string) {
  return sendEmail({
    to,
    subject: `Grade Published: ${period}`,
    html: `<p>Nilai periode <strong>${period}</strong> telah dipublikasikan.</p>`,
    tags: [{ name: "type", value: "GRADE_PUBLISHED" }],
  });
}
