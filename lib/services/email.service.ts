import { logger } from "./logger.service";
import { env } from "@/lib/env";

interface EmailParams {
  to: string;
  subject: string;
  html: string;
}

export const sendEmail = async ({ to, subject, html }: EmailParams) => {
  const apiKey = env.RESEND_API_KEY;

  // Real Email Service Implementation
  if (apiKey) {
    try {
      const fromAddress = env.EMAIL_FROM_ADDRESS || "ArabianRizz <onboarding@resend.dev>";

      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: fromAddress,
          to: [to],
          subject: subject,
          html: html,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        logger.error("📧 Resend API Failed", { status: response.status, error: errorData });
        return { success: false };
      }

      const data = await response.json();
      logger.info("📧 Email Sent via Resend", { id: data.id, recipient: to });
      return { success: true, messageId: data.id };

    } catch (error) {
      logger.error("📧 Resend Email Error", error);
      return { success: false };
    }
  }

  // Mock Implementation (Fallback)
  // In a real production environment, this would integrate with Resend, SendGrid, or AWS SES.
  // For this MVP/Monetization Plan phase, we implement a robust Mock Service that logs the intent.

  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 500));

  logger.info("📧 Mock Email Sent", {
    recipient: to,
    subject: subject,
    // Truncate HTML for logs
    contentPreview: html.substring(0, 100) + "..."
  });

  return { success: true, messageId: `mock_${Date.now()}` };
};
