"use server";

import User from "../database/models/user.model";
import Girl from "../database/models/girl.model";
import Message from "../database/models/message.model";
import UserKnowledge from "../database/models/user-knowledge.model";
import { connectToDatabase } from "../database/mongoose";
import { handleError } from "../utils";
import { auth } from "@clerk/nextjs";

// EXPORT ALL DATA
export async function exportAllUserData() {
  try {
    await connectToDatabase();

    const { userId: clerkId } = auth();
    if (!clerkId) throw new Error("Unauthorized");

    const user = await User.findOne({ clerkId });
    if (!user) throw new Error("User not found");

    // Fetch Persona
    const persona = await UserKnowledge.find({ user: user._id });

    // Fetch Girls
    const girls = await Girl.find({ author: user._id });

    // Fetch Messages for each Girl
    const chats = await Promise.all(
        girls.map(async (girl) => {
            const messages = await Message.find({ girl: girl._id }).sort({ createdAt: 1 });
            return {
                girl: {
                    name: girl.name,
                    vibe: girl.vibe,
                    relationshipStatus: girl.relationshipStatus,
                    dialect: girl.dialect,
                    createdAt: girl.createdAt
                },
                messages: messages.map(msg => ({
                    role: msg.role,
                    content: msg.content,
                    createdAt: msg.createdAt,
                    feedback: msg.feedback
                }))
            };
        })
    );

    const exportData = {
        user: {
            username: user.username,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            createdAt: user.createdAt,
            creditBalance: user.creditBalance,
            badges: user.badges
        },
        persona: persona.map((p: any) => ({
            content: p.content,
            createdAt: p.createdAt
        })),
        chats
    };

    return JSON.parse(JSON.stringify(exportData));
  } catch (error) {
    handleError(error);
  }
}

// READ
export async function getUserById(userId: string) {
  try {
    await connectToDatabase();

    const { userId: clerkId } = auth();
    if (!clerkId) throw new Error("Unauthorized");

    // Security: Only allow users to fetch their own data to prevent IDOR
    if (userId !== clerkId) {
        throw new Error("Unauthorized: Cannot access other user data");
    }

    const user = await User.findOne({ clerkId: userId });

    if (!user) throw new Error("User not found");

    return JSON.parse(JSON.stringify(user));
  } catch (error) {
    handleError(error);
  }
}

// CREDIT MANAGEMENT

/**
 * Deducts credits from the user's balance.
 * Uses atomic findOneAndUpdate to ensure thread safety and sufficient funds.
 * @param userId MongoDB User ID
 * @param amount Number of credits to deduct (positive integer)
 * @returns The updated User object
 * @throws Error if insufficient credits or user not found
 */
export async function deductCredits(userId: string, amount: number) {
  if (amount < 0) throw new Error("Amount must be positive");

  await connectToDatabase();

  const updatedUser = await User.findOneAndUpdate(
    { _id: userId, creditBalance: { $gte: amount } },
    { $inc: { creditBalance: -amount } },
    { new: true }
  );

  if (!updatedUser) {
    // Check if user exists but just has low balance
    const user = await User.findById(userId);
    if (!user) throw new Error("User not found");
    throw new Error("Insufficient credits");
  }

  return JSON.parse(JSON.stringify(updatedUser));
}

/**
 * Refunds credits to the user's balance.
 * Used for rolling back failed operations.
 * @param userId MongoDB User ID
 * @param amount Number of credits to refund
 * @returns The updated User object
 */
export async function refundCredits(userId: string, amount: number) {
  if (amount < 0) throw new Error("Amount must be positive");

  await connectToDatabase();

  const updatedUser = await User.findByIdAndUpdate(
    userId,
    { $inc: { creditBalance: amount } },
    { new: true }
  );

  if (!updatedUser) throw new Error("User not found during refund");

  return JSON.parse(JSON.stringify(updatedUser));
}
