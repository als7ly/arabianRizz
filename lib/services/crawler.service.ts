import GlobalKnowledge from "@/lib/database/models/global-knowledge.model";
import { connectToDatabase } from "@/lib/database/mongoose";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export const crawlUrl = async (url: string) => {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch URL: ${response.statusText}`);
    }
    const html = await response.text();

    // Metadata Extraction
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    const title = titleMatch ? titleMatch[1] : "";

    const descMatch = html.match(/<meta\s+name=["']description["']\s+content=["']([^"']+)["']/i);
    const description = descMatch ? descMatch[1] : "";

    const keywordsMatch = html.match(/<meta\s+name=["']keywords["']\s+content=["']([^"']+)["']/i);
    const keywords = keywordsMatch ? keywordsMatch[1].split(',').map(k => k.trim()) : [];

    const extractedTags = [...keywords];
    if (title) extractedTags.push(`title:${title}`);

    // Simple HTML to Text converter
    // 1. Remove scripts and styles
    let text = html.replace(/<script\b[^>]*>([\s\S]*?)<\/script>/gim, "");
    text = text.replace(/<style\b[^>]*>([\s\S]*?)<\/style>/gim, "");

    // 2. Remove HTML tags
    text = text.replace(/<[^>]+>/g, "\n");

    // 3. Decode HTML entities (basic)
    text = text.replace(/&nbsp;/g, " ")
               .replace(/&amp;/g, "&")
               .replace(/&quot;/g, '"')
               .replace(/&lt;/g, "<")
               .replace(/&gt;/g, ">")
               .replace(/&#39;/g, "'");

    // 4. Normalize whitespace
    text = text.replace(/\s+/g, " ").trim();

    // Prepend metadata to text to ensure context is preserved in the first chunk
    if (title || description) {
        text = `Source Title: ${title}\nSource Description: ${description}\n\n${text}`;
    }

    // Chunking strategy: Split by roughly 1000 characters or sentences
    const chunks = [];
    const MAX_CHUNK_SIZE = 1000;

    let currentChunk = "";
    const sentences = text.split(/(?<=[.!?])\s+/);

    for (const sentence of sentences) {
      if ((currentChunk + sentence).length > MAX_CHUNK_SIZE) {
        chunks.push(currentChunk.trim());
        currentChunk = "";
      }
      currentChunk += sentence + " ";
    }
    if (currentChunk.trim()) {
      chunks.push(currentChunk.trim());
    }

    return { chunks, tags: extractedTags };
  } catch (error) {
    console.error("Crawler Error:", error);
    throw error;
  }
};

export const processAndSave = async (chunks: string[], language: string, url: string, extraTags: string[] = []) => {
  await connectToDatabase();

  const results = [];
  const baseTags = ['crawler', ...extraTags];

  for (const chunk of chunks) {
    if (!chunk || chunk.length < 50) continue; // Skip very short chunks

    try {
      const embeddingResponse = await openai.embeddings.create({
        model: "text-embedding-3-small",
        input: chunk,
      });

      const embedding = embeddingResponse.data[0].embedding;

      const knowledge = await GlobalKnowledge.create({
        content: chunk,
        embedding: embedding,
        language: language,
        sourceUrl: url,
        status: 'pending',
        tags: baseTags,
      });

      results.push(knowledge);
    } catch (error) {
      console.error("Embedding/Save Error for chunk:", error);
      // Continue to next chunk even if one fails
    }
  }

  return results;
};
