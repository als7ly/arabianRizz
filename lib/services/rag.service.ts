import { openai } from "../openai";
import { connectToDatabase } from "../database/mongoose";
import Message from "../database/models/message.model";
import mongoose from "mongoose";

// Generate Embedding
export async function generateEmbedding(text: string): Promise<number[]> {
  try {
    if (process.env.OPENAI_API_KEY === "dummy-key" && !process.env.OPENAI_BASE_URL) {
      console.warn("Using MOCK Embeddings (Random Vectors)");
      return Array.from({ length: 1536 }, () => Math.random());
    }

    const response = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: text,
      encoding_format: "float",
    });

    return response.data[0].embedding;
  } catch (error) {
    console.error("Embedding Error:", error);
    // Return mock vector on error to prevent app crash during dev
    return Array.from({ length: 1536 }, () => Math.random());
  }
}

// Retrieve Context (RAG) - Internal Service Function (No Ownership Verification)
export async function retrieveContext(girlId: string, query: string, embedding?: number[]) {
  try {
    // Ensure DB is connected
    await connectToDatabase();

    const queryEmbedding = embedding || await generateEmbedding(query);

    // MongoDB Atlas Vector Search Aggregation
    const results = await Message.aggregate([
      {
        $vectorSearch: {
          index: "vector_index",
          path: "embedding",
          queryVector: queryEmbedding,
          numCandidates: 100,
          limit: 5,
          filter: {
            girl: { $eq: new mongoose.Types.ObjectId(girlId) }
          }
        }
      } as any,
      {
        $project: {
          _id: 0,
          content: 1,
          role: 1,
          score: { $meta: "vectorSearchScore" }
        }
      }
    ]);

    if (results.length === 0) {
        const recentMessages = await Message.find({ girl: girlId })
            .sort({ createdAt: -1 })
            .limit(10);
        return recentMessages.reverse().map((msg) => ({
            role: msg.role,
            content: msg.content
        }));
    }

    return results;
  } catch (error) {
    console.error("RAG Retrieval Error:", error);
    // Fallback: Return recent messages
    const recentMessages = await Message.find({ girl: girlId })
        .sort({ createdAt: -1 })
        .limit(10);
    return JSON.parse(JSON.stringify(recentMessages.reverse()));
  }
}
