"use server";

import { ImageAnnotatorClient } from "@google-cloud/vision";

// Initialize the client
// Ensure GOOGLE_APPLICATION_CREDENTIALS env var is set or credentials are passed here
const client = new ImageAnnotatorClient();

export async function extractTextFromImage(imageUrl: string): Promise<string> {
  try {
    // If no credentials are setup, return mock data for development
    if (!process.env.GOOGLE_APPLICATION_CREDENTIALS && !process.env.GOOGLE_API_KEY) {
      console.warn("No Google Cloud credentials found. Returning MOCK OCR data.");
      return "MOCK DATA: Hey! I had a really great time last night. We should definitely do it again sometime. \n(Sent at 10:30 PM)";
    }

    const [result] = await client.textDetection(imageUrl);
    const detections = result.textAnnotations;

    if (!detections || detections.length === 0) {
      return "";
    }

    // The first annotation contains the full text
    return detections[0].description || "";
  } catch (error) {
    console.error("OCR Error:", error);
    // Fallback for dev if API fails
    return "MOCK DATA (Fallback): Hey! I had a really great time last night. We should definitely do it again sometime. \n(Sent at 10:30 PM)";
  }
}
