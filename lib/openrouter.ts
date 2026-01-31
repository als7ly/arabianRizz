import OpenAI from "openai";

// Ensure the API key is set in your .env file as OPENROUTER_API_KEY
const apiKey = process.env.OPENROUTER_API_KEY || "dummy-openrouter-key";
const baseURL = "https://openrouter.ai/api/v1";

export const openrouter = new OpenAI({
  apiKey: apiKey,
  baseURL: baseURL,
  defaultHeaders: {
    "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000", // Optional: for OpenRouter analytics
    "X-Title": "ArabianRizz Wingman", // Optional
  },
});

// Recommended Uncensored Models on OpenRouter:
// - "nousresearch/nous-hermes-2-mixtral-8x7b-dpo" (Strong, uncensored)
// - "dolphin-2.6-mixtral-8x7b" (Very uncensored)
// - "mistralai/mixtral-8x7b-instruct" (Good all-rounder)

export const WINGMAN_MODEL = "nousresearch/nous-hermes-2-mixtral-8x7b-dpo";
