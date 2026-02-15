"use server";

import { openrouter, WINGMAN_MODEL } from "../openrouter";
import { logger } from "@/lib/services/logger.service";
import { auth } from "@clerk/nextjs";
import { connectToDatabase } from "../database/mongoose";
import User from "../database/models/user.model";
import Girl from "../database/models/girl.model";
import Message from "../database/models/message.model";
import { deductCredits } from "../services/user.service";
import { logUsage } from "../services/usage.service";
import { ConversationAnalysisSchema, ConversationAnalysis } from "../validations/analysis";
import { sendEmail } from "@/lib/services/email.service";
import { LOW_BALANCE_THRESHOLD } from "@/constants";

// Helper (duplicated from wingman.actions.ts to avoid circular deps/refactor)
async function checkAndNotifyLowBalance(user: any) {
    if (user.settings?.lowBalanceAlerts === false) return;
    if (user.creditBalance < LOW_BALANCE_THRESHOLD) {
        if (user.lastLowBalanceEmailSent) {
            const lastSent = new Date(user.lastLowBalanceEmailSent);
            const now = new Date();
            const hoursSinceLastSent = (now.getTime() - lastSent.getTime()) / (1000 * 60 * 60);
            if (hoursSinceLastSent < 24) return;
        }
        try {
            await sendEmail({
                to: user.email,
                subject: "⚡ Low Balance Alert - Top Up Your Rizz",
                html: `<h1>Running Low on Rizz?</h1><p>You have fewer than ${LOW_BALANCE_THRESHOLD} credits left (${user.creditBalance}). Don't get left on read. <a href="${process.env.NEXT_PUBLIC_SERVER_URL}/credits">Top up now</a>.</p>`
            });
            await User.findByIdAndUpdate(user._id, { lastLowBalanceEmailSent: new Date() });
        } catch (e) {
            logger.error("Failed to send low balance email", e);
        }
    }
}

export async function analyzeConversation(girlId: string): Promise<ConversationAnalysis | null> {
  try {
    const { userId: clerkId } = auth();
    if (!clerkId) throw new Error("Unauthorized");

    await connectToDatabase();

    // Optimization: Parallelize User and Girl fetch
    const [user, girl] = await Promise.all([
        User.findOne({ clerkId }).lean(),
        Girl.findById(girlId).lean()
    ]);

    if (!user) throw new Error("User not found");
    if (!girl) throw new Error("Girl not found");

    if (girl.author.toString() !== user._id.toString()) {
        throw new Error("Unauthorized Access");
    }

    if (user.creditBalance < 1) {
        throw new Error("Insufficient credits");
    }

    // Optimization: Fetch only last 20 messages instead of entire history
    // Also use .select() to avoid fetching embeddings and .lean() for performance
    const lastMessages = await Message.find({ girl: girlId })
        .sort({ createdAt: -1 })
        .limit(20)
        .select('role content')
        .lean();

    if (!lastMessages || lastMessages.length === 0) {
        throw new Error("Not enough messages to analyze.");
    }

    // Reverse to chronological order (oldest first) for context
    const recentMessages = lastMessages.reverse().map((m: any) => `${m.role}: ${m.content}`).join("\n");

    const systemPrompt = `
    You are an expert dating coach ("The Wingman").
    Analyze the following conversation history between a user ("user") and a girl ("girl" or "wingman").

    Provide a "Rizz Analysis" in VALID JSON format with the following fields:
    - score: number (0-100), rating the user's performance.
    - summary: string (Brief summary of the dynamic).
    - strengths: string[] (List of 2-3 things the user is doing well).
    - weaknesses: string[] (List of 2-3 things the user should improve).
    - tips: string (One actionable piece of advice for the next move).

    Be honest, constructive, and slightly "bro-to-bro" in tone but professional.
    `;

    if (process.env.OPENROUTER_API_KEY === "dummy-openrouter-key") {
         return {
             score: 85,
             summary: "You're doing great! She seems interested.",
             strengths: ["Good humor", "Asking open questions"],
             weaknesses: ["Sometimes too slow to reply"],
             tips: "Ask her out for a drink soon."
         };
    }

    const completion = await openrouter.chat.completions.create({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Conversation History:\n${recentMessages}` },
      ],
      model: WINGMAN_MODEL,
      response_format: { type: "json_object" },
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) throw new Error("No response from AI");

    let parsed;
    try {
        parsed = JSON.parse(content);
    } catch (e) {
        throw new Error("Failed to parse AI response");
    }

    const result = ConversationAnalysisSchema.parse(parsed);

    // Deduct credits and log usage ONLY if successful
    const updatedUser = await deductCredits(user._id.toString(), 1);
    await logUsage({ userId: user._id.toString(), action: "conversation_analysis", cost: 1, metadata: { girlId } });

    checkAndNotifyLowBalance(updatedUser).catch(err => logger.error("Background Low Balance Check Error", err));

    return result;

  } catch (error) {
    logger.error("Analyze Conversation Error:", error);
    return null; // The UI handles null as error
  }
}
