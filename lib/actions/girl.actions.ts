"use server";

import { revalidatePath } from "next/cache";
import { connectToDatabase } from "../database/mongoose";
import { handleError } from "../utils";
import Girl from "../database/models/girl.model";
import User from "../database/models/user.model";
import Message from "../database/models/message.model";
import { auth } from "@clerk/nextjs";
import { deductCredits, refundCredits } from "./user.actions";
import { logUsage } from "./usage-log.actions";

async function getCurrentUser() {
    const { userId: clerkId } = auth();
    if (!clerkId) throw new Error("Unauthorized");
    
    await connectToDatabase();
    const user = await User.findOne({ clerkId });
    if (!user) throw new Error("User not found");
    
    return user;
}

// CREATE GIRL
export async function createGirl(girl: CreateGirlParams) {
  try {
    await connectToDatabase();
    
    // Security Check: Ensure the author exists and matches the authenticated user
    const user = await getCurrentUser();
    
    // Atomic update to ensure credits are sufficient and deducted
    const updatedUser = await deductCredits(user._id, 1);

    try {
        const newGirl = await Girl.create({
            ...girl,
            language: girl.language || "en", // Default to English
            author: user._id
        });

        await logUsage({ userId: user._id, action: "girl_creation", cost: 1, metadata: { girlId: newGirl._id } });

        revalidatePath(girl.path);
        return JSON.parse(JSON.stringify(newGirl));
    } catch (error) {
        // Rollback credits if creation fails
        await refundCredits(user._id, 1);
        throw error;
    }
  } catch (error) {
    handleError(error);
  }
}

// SEARCH MESSAGES
export async function searchMessages(girlId: string, query: string): Promise<{ success: boolean; data: Message[]; error?: string }> {
  try {
    await connectToDatabase();

    const girl = await Girl.findById(girlId);
    if (!girl) return { success: false, data: [], error: "Girl not found" };

    // Security Check
    const user = await getCurrentUser();
    if (girl.author.toString() !== user._id.toString()) {
        return { success: false, data: [], error: "Unauthorized" };
    }

    if (!query || query.trim().length === 0) {
        return { success: true, data: [] };
    }

    // Escape special regex characters
    const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    const messages = await Message.find({
        girl: girlId,
        content: { $regex: escapedQuery, $options: 'i' }
    }).sort({ createdAt: 1 });

    return { success: true, data: JSON.parse(JSON.stringify(messages)) };
  } catch (error) {
    console.error("Search Messages Error:", error);
    return { success: false, data: [], error: "Internal Server Error" };
  }
}

// GET CHAT HISTORY
export async function getChatHistory(girlId: string) {
  try {
    await connectToDatabase();

    const girl = await Girl.findById(girlId);
    if (!girl) throw new Error("Girl not found");

    // Security Check
    const user = await getCurrentUser();
    if (girl.author.toString() !== user._id.toString()) {
        throw new Error("Unauthorized");
    }

    const messages = await Message.find({ girl: girlId })
      .sort({ createdAt: 1 }); // Oldest first for history export

    return JSON.parse(JSON.stringify(messages));
  } catch (error) {
    handleError(error);
  }
}


// GET GIRL BY ID
export async function getGirlById(girlId: string) {
  try {
    await connectToDatabase();
    
    const girl = await Girl.findById(girlId);
    if (!girl) throw new Error("Girl not found");
    
    // Security Check
    const user = await getCurrentUser();
    if (girl.author.toString() !== user._id.toString()) {
        throw new Error("Unauthorized");
    }

    return JSON.parse(JSON.stringify(girl));
  } catch (error) {
    handleError(error);
  }
}

// GET ALL GIRLS FOR USER
export async function getUserGirls({ userId, page = 1, limit = 9, query = "" }: { userId: string, page?: number, limit?: number, query?: string }): Promise<{ data: Girl[], totalPages: number } | undefined> {
  try {
    await connectToDatabase();
    
    // Security Check
    const user = await getCurrentUser();
    if (user._id.toString() !== userId) {
         throw new Error("Unauthorized");
    }

    const skipAmount = (Number(page) - 1) * limit;

    const condition = {
        author: userId,
        ...(query && {
            $or: [
                { name: { $regex: query, $options: 'i' } },
                { vibe: { $regex: query, $options: 'i' } }
            ]
        })
    };

    const girlsQuery = Girl.find(condition)
      .sort({ createdAt: -1 })
      .skip(skipAmount)
      .limit(limit);

    const girls = await girlsQuery.exec();
    const girlsCount = await Girl.countDocuments(condition);

    return {
      data: JSON.parse(JSON.stringify(girls)),
      totalPages: Math.ceil(girlsCount / limit),
    };
  } catch (error) {
    handleError(error);
  }
}

// UPDATE GIRL
export async function updateGirl(girl: UpdateGirlParams) {
  try {
    await connectToDatabase();
    
    const girlToUpdate = await Girl.findById(girl._id);
    if (!girlToUpdate) throw new Error("Girl not found");
    
    // Security Check
    const user = await getCurrentUser();
    if (girlToUpdate.author.toString() !== user._id.toString()) {
        throw new Error("Unauthorized");
    }

    const updatedGirl = await Girl.findByIdAndUpdate(
      girl._id,
      {
        name: girl.name,
        age: girl.age,
        vibe: girl.vibe,
        dialect: girl.dialect,
        language: girl.language,
        voiceId: girl.voiceId,
        relationshipStatus: girl.relationshipStatus,
        rating: girl.rating,
        socialMediaHandle: girl.socialMediaHandle,
      },
      { new: true }
    );

    if (!updatedGirl) throw new Error("Girl update failed");
    revalidatePath(girl.path);

    return JSON.parse(JSON.stringify(updatedGirl));
  } catch (error) {
    handleError(error);
  }
}

// DELETE GIRL
export async function deleteGirl(girlId: string) {
  try {
    await connectToDatabase();
    
    const girlToDelete = await Girl.findById(girlId);
    if (!girlToDelete) throw new Error("Girl not found");

    // Security Check
    const user = await getCurrentUser();
    if (girlToDelete.author.toString() !== user._id.toString()) {
        throw new Error("Unauthorized");
    }

    await Message.deleteMany({ girl: girlId });
    await Girl.findByIdAndDelete(girlId);
    revalidatePath("/");
  } catch (error) {
    handleError(error);
  }
}

// CLEAR CHAT
export async function clearChat(girlId: string, path?: string) {
  try {
    await connectToDatabase();

    const girl = await Girl.findById(girlId);
    if (!girl) throw new Error("Girl not found");

    // Security Check
    const user = await getCurrentUser();
    if (girl.author.toString() !== user._id.toString()) {
        throw new Error("Unauthorized");
    }

    await Message.deleteMany({ girl: girlId });
    if (path) revalidatePath(path);
  } catch (error) {
    handleError(error);
  }
}
