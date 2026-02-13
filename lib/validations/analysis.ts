import { z } from "zod";

export const ConversationAnalysisSchema = z.object({
  score: z.number().min(0).max(100),
  summary: z.string(),
  strengths: z.array(z.string()),
  weaknesses: z.array(z.string()),
  tips: z.string(),
});

export type ConversationAnalysis = z.infer<typeof ConversationAnalysisSchema>;
