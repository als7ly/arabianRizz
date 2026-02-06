"use server";

import { openai } from "../openai";
import { logger } from "@/lib/services/logger.service";

export async function analyzeProfile(text: string) {
  try {
    if (!text) return null;

    const systemPrompt = `
    Analyze the following text extracted from a dating profile screenshot.
    Extract the following information:
    - Name (string)
    - Age (number, estimate if not explicit)
    - Vibe (string, a short description of personality/interests)
    - Dialect (string, guess based on language used: Modern Standard Arabic, Egyptian, Levantine, Gulf, Maghrebi, Iraqi. Default to Modern Standard Arabic)
    - Relationship Status (string, guess: Just met, Talking, Dating, It's Complicated. Default to Just met)

    Return ONLY a JSON object with these keys: name, age, vibe, dialect, relationshipStatus.
    `;

    const completion = await openai.chat.completions.create({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: text },
      ],
      model: "gpt-4o",
      response_format: { type: "json_object" },
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) return null;

    return JSON.parse(content);
  } catch (error) {
    logger.error("Analysis Error:", error);
    return null;
  }
}
