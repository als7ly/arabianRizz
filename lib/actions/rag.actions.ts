"use server";

import { connectToDatabase } from "../database/mongoose";
import Message from "../database/models/message.model";
import Girl from "../database/models/girl.model";
import User from "../database/models/user.model";
import { handleError } from "../utils";
import { auth } from "@clerk/nextjs";
import mongoose from "mongoose";
import { generateEmbedding, retrieveContext } from "../services/rag.service";

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
export async function getContext(girlId: string, query: string, embedding?: number[]) {
  // Security: Verify ownership first.
  // If this fails, it throws an error and we do NOT proceed to retrieval.
  await verifyGirlOwnership(girlId);

  // Delegate to service which handles embedding generation, vector search, and fallback
  return await retrieveContext(girlId, query, embedding);
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
