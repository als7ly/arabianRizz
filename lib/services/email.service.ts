import { logger } from "./logger.service";

interface EmailParams {
  to: string;
  subject: string;
  html: string;
}

export const sendEmail = async ({ to, subject, html }: EmailParams) => {
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
