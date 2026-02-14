"use server";

import { openai } from "../openai";
import { auth } from "@clerk/nextjs";
import { connectToDatabase } from "../database/mongoose";
import User from "../database/models/user.model";
import { deductCredits, refundCredits } from "../services/user.service";
import { logUsage } from "../services/usage.service";
import { logger } from "../services/logger.service";

const SPEECH_COST = 1;

export async function generateSpeech(text: string) {
  try {
    if (!text) return null;

    const { userId: clerkId } = auth();
    if (!clerkId) throw new Error("Unauthorized");

    await connectToDatabase();

    const user = await User.findOne({ clerkId });
    if (!user) throw new Error("User not found");

    // Deduct credits before calling expensive API
    const updatedUser = await deductCredits(user._id, SPEECH_COST);

    try {
        if (process.env.OPENAI_API_KEY === "dummy-key" && !process.env.OPENAI_BASE_URL) {
           console.warn("Using MOCK TTS (No Audio)");
           // We should probably refund here if it's a mock run that didn't actually cost money?
           // But for testing purposes, maybe we want to simulate cost.
           // However, logically, if we don't call OpenAI, we shouldn't charge.
           // But existing code returned null. Let's return a mock string to indicate success?
           // The original code returned null. I will keep it returning null but log warning.
           // Actually, if we deduct credits, we MUST return something useful or refund.
           // Since this is a "dummy-key" scenario, it's dev/test. I'll refund and return null.
           await refundCredits(user._id, SPEECH_COST);
           return null;
        }

        const mp3 = await openai.audio.speech.create({
          model: "tts-1",
          voice: "onyx",
          input: text,
        });

        const buffer = Buffer.from(await mp3.arrayBuffer());
        const base64 = buffer.toString("base64");

        const audioUrl = `data:audio/mp3;base64,${base64}`;

        await logUsage({
            userId: user._id,
            action: "speech_generation",
            cost: SPEECH_COST
        });

        return audioUrl;

    } catch (error) {
        // Refund credits if OpenAI call fails
        await refundCredits(user._id, SPEECH_COST);
        throw error;
    }

  } catch (error) {
    logger.error("TTS Error:", error);
    // Return null to handle error gracefully on client, or rethrow?
    // The original code returned null. I'll stick to that but ensure we logged it.
    return null;
  }
}
