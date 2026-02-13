"use server";

import { auth } from "@clerk/nextjs";
import { connectToDatabase } from "../database/mongoose";
import UserKnowledge from "../database/models/user-knowledge.model";
import User from "../database/models/user.model";
import { generateEmbedding, retrieveUserContext } from "../services/rag.service";
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
    const { userId: clerkId } = auth();
    if (!clerkId) return [];

    await connectToDatabase();

    // Ensure we are searching for the correct user (mongo ID)
    const user = await User.findOne({ clerkId });
    if (!user || user._id.toString() !== userId) {
      return [];
    }

    return await retrieveUserContext(userId, query, embedding);
  } catch (error) {
    console.error("User RAG Error:", error);
    // Silent fail for RAG context
    return [];
  }
}
