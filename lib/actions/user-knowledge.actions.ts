"use server";

import { auth } from "@clerk/nextjs";
import { connectToDatabase } from "../database/mongoose";
import UserKnowledge from "../database/models/user-knowledge.model";
import User from "../database/models/user.model";
import { generateEmbedding } from "./rag.actions"; // Reuse embedding logic
import { handleError } from "../utils";
import mongoose from "mongoose";

// Add Knowledge
export async function addUserKnowledge(content: string) {
  try {
    const { userId: clerkId } = auth();
    if (!clerkId) throw new Error("Unauthorized");

    await connectToDatabase();

    const user = await User.findOne({ clerkId });
    if (!user) throw new Error("User not found");

    const embedding = await generateEmbedding(content);

    const newKnowledge = await UserKnowledge.create({
      user: user._id,
      content,
      embedding,
    });

    return JSON.parse(JSON.stringify(newKnowledge));
  } catch (error) {
    handleError(error);
  }
}

// Delete Knowledge
export async function deleteUserKnowledge(knowledgeId: string) {
  try {
    const { userId: clerkId } = auth();
    if (!clerkId) throw new Error("Unauthorized");

    await connectToDatabase();

    const user = await User.findOne({ clerkId });
    if (!user) throw new Error("User not found");

    const knowledge = await UserKnowledge.findById(knowledgeId);
    if (!knowledge) throw new Error("Knowledge not found");

    // Verify ownership
    if (knowledge.user.toString() !== user._id.toString()) {
      throw new Error("Unauthorized");
    }

    await UserKnowledge.findByIdAndDelete(knowledgeId);

    return { success: true };
  } catch (error) {
    handleError(error);
  }
}

// List Knowledge (for management UI)
export async function getUserKnowledgeList() {
  try {
    const { userId: clerkId } = auth();
    if (!clerkId) throw new Error("Unauthorized");

    await connectToDatabase();

    const user = await User.findOne({ clerkId });
    if (!user) throw new Error("User not found");

    const knowledgeList = await UserKnowledge.find({ user: user._id })
      .select("content createdAt _id") // Exclude embedding to save bandwidth
      .sort({ createdAt: -1 });

    return JSON.parse(JSON.stringify(knowledgeList));
  } catch (error) {
    handleError(error);
  }
}

// RAG Retrieval
export async function getUserContext(userId: string, query: string, embedding?: number[]) {
  try {
    await connectToDatabase();

    // Ensure we are searching for the correct user (mongo ID)
    // userId passed here is the MongoDB _id string

    const queryEmbedding = embedding || await generateEmbedding(query);

    // MongoDB Atlas Vector Search
    // Note: If using Mongoose ObjectId, the filter might need specific handling depending on Atlas config.
    // However, usually equality match works. We try aggregation first.

    const results = await UserKnowledge.aggregate([
      {
        $vectorSearch: {
          index: "vector_index",
          path: "embedding",
          queryVector: queryEmbedding,
          numCandidates: 50,
          limit: 3,
          filter: {
            user: { $eq: new mongoose.Types.ObjectId(userId) }
          }
        }
      } as any,
      {
        $project: {
          _id: 0,
          content: 1,
          score: { $meta: "vectorSearchScore" }
        }
      }
    ]);

    if (!results || results.length === 0) {
        // Fallback: Return recent 3 items
        const recent = await UserKnowledge.find({ user: userId })
            .sort({ createdAt: -1 })
            .limit(3)
            .select("content");

        return recent.map(k => ({ content: k.content }));
    }

    return results;
  } catch (error) {
    console.error("User RAG Error:", error);
    // Silent fail for RAG context
    return [];
  }
}
