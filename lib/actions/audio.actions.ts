"use server";

import { openai } from "../openai";

export async function generateSpeech(text: string) {
  try {
    if (!text) return null;

    if (process.env.OPENAI_API_KEY === "dummy-key" && !process.env.OPENAI_BASE_URL) {
       console.warn("Using MOCK TTS (No Audio)");
       return null;
    }

    const mp3 = await openai.audio.speech.create({
      model: "tts-1",
      voice: "onyx",
      input: text,
    });

    const buffer = Buffer.from(await mp3.arrayBuffer());
    const base64 = buffer.toString("base64");

    return `data:audio/mp3;base64,${base64}`;

  } catch (error) {
    console.error("TTS Error:", error);
    return null;
  }
}
