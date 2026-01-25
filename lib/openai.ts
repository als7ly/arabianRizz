import OpenAI from "openai";

const apiKey = process.env.OPENAI_API_KEY || "dummy-key";
const baseURL = process.env.OPENAI_BASE_URL; // Optional: for custom models

export const openai = new OpenAI({
  apiKey: apiKey,
  baseURL: baseURL,
  dangerouslyAllowBrowser: true, // Only if we use it on client, but we are using it in actions (server)
});
