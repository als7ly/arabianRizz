import OpenAI from "openai";

const apiKey = process.env.OPENAI_API_KEY || "dummy-key";
const baseURL = process.env.OPENAI_BASE_URL; // Optional: for custom models

export const openai = new OpenAI({
  apiKey: apiKey,
  baseURL: baseURL,
});
