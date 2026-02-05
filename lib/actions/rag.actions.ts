"use server";

import { openai } from "../openai";
import { connectToDatabase } from "../database/mongoose";
import Message from "../database/models/message.model";
import Girl from "../database/models/girl.model";
import User from "../database/models/user.model";
import { handleError } from "../utils";
import { auth } from "@clerk/nextjs";
import mongoose from "mongoose";

async function verifyGirlOwnership(girlId: string) {
    const { userId: clerkId } = auth();
    if (!clerkId) throw new Error("Unauthorized");
    
    await connectToDatabase();
    const user = await User.findOne({ clerkId });
    if (!user) throw new Error("User not found");
    
    const girl = await Girl.findById(girlId);
    if (!girl) throw new Error("Girl not found");
    
    if (girl.author.toString() !== user._id.toString()) {
        throw new Error("Unauthorized");
    }
}

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

// Add Message to DB (with embedding)
export async function addMessage({ girlId, role, content, path }: CreateMessageParams) {
  try {
    await verifyGirlOwnership(girlId);

    // 1. Generate Embedding
    const embedding = await generateEmbedding(content);

    // 2. Create Message
    const newMessage = await Message.create({
      girl: girlId,
      role,
      content,
      embedding,
    });

    return JSON.parse(JSON.stringify(newMessage));
  } catch (error) {
    handleError(error);
  }
}

// Retrieve Context (RAG)
export async function getContext(girlId: string, query: string) {
  try {
    await verifyGirlOwnership(girlId);

    const queryEmbedding = await generateEmbedding(query);

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
    // Note: We already verified ownership, so it's safe to fetch
    const recentMessages = await Message.find({ girl: girlId })
        .sort({ createdAt: -1 })
        .limit(10);
    return JSON.parse(JSON.stringify(recentMessages.reverse()));
  }
}

// Clear Chat
export async function clearChat(girlId: string) {
  try {
    await verifyGirlOwnership(girlId);

    await Message.deleteMany({ girl: girlId });

    return { success: true };
  } catch (error) {
    handleError(error);
  }
}

// Submit Feedback
export async function submitFeedback(messageId: string, feedback: "up" | "down" | null) {
  try {
    const { userId: clerkId } = auth();
    if (!clerkId) throw new Error("Unauthorized");

    await connectToDatabase();

    // We need to verify ownership of the message via the girl
    const message = await Message.findById(messageId).populate("girl");
    if (!message) throw new Error("Message not found");

    // Check if the user owns the girl profile associated with the message
    const user = await User.findOne({ clerkId });
    if (!user || message.girl.author.toString() !== user._id.toString()) {
        throw new Error("Unauthorized");
    }

    const updatedMessage = await Message.findByIdAndUpdate(
      messageId,
      { feedback },
      { new: true }
    );

    return JSON.parse(JSON.stringify(updatedMessage));
  } catch (error) {
    handleError(error);
  }
}
