"use server";

import { revalidatePath } from "next/cache";
import { connectToDatabase } from "../database/mongoose";
import { handleError } from "../utils";
import Girl from "../database/models/girl.model";
import User from "../database/models/user.model";
import Message from "../database/models/message.model";
import { auth } from "@clerk/nextjs";

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
    // Note: getCurrentUser retrieves the MongoDB user document
    const user = await getCurrentUser();
    
    // girl.userId is the Clerk ID passed from the client
    if (user.clerkId !== girl.userId) {
         throw new Error("Unauthorized: User ID mismatch");
    }

    // Atomic update to ensure credits are sufficient and deducted
    const updatedUser = await User.findOneAndUpdate(
        { _id: user._id, creditBalance: { $gte: 1 } },
        { $inc: { creditBalance: -1 } },
        { new: true }
    );

    if (!updatedUser) {
        throw new Error("Insufficient credits");
    }

    try {
        const newGirl = await Girl.create({
            ...girl,
            author: user._id
        });

        revalidatePath(girl.path);
        return JSON.parse(JSON.stringify(newGirl));
    } catch (error) {
        // Rollback credits if creation fails
        await User.findByIdAndUpdate(user._id, { $inc: { creditBalance: 1 } });
        throw error;
    }

    return JSON.parse(JSON.stringify(newGirl));
  } catch (error) {
    handleError(error);
  }
}

// CLEAR CHAT
export async function clearChat(girlId: string) {
  try {
    await connectToDatabase();

    // Security Check
    const user = await getCurrentUser();

    // Verify ownership of the girl profile first
    const girl = await Girl.findById(girlId);
    if (!girl) throw new Error("Girl not found");

    if (girl.author.toString() !== user._id.toString()) {
        throw new Error("Unauthorized");
    }

    await Message.deleteMany({ girl: girlId });
    revalidatePath(`/girls/${girlId}`);
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
export async function getUserGirls({ userId, page = 1, limit = 9 }: { userId: string, page?: number, limit?: number }) {
  try {
    await connectToDatabase();
    
    // Security Check
    const user = await getCurrentUser();
    if (user._id.toString() !== userId) {
         throw new Error("Unauthorized");
    }

    const skipAmount = (Number(page) - 1) * limit;

    const girlsQuery = Girl.find({ author: userId })
      .sort({ createdAt: -1 })
      .skip(skipAmount)
      .limit(limit);

    const girls = await girlsQuery.exec();
    const girlsCount = await Girl.countDocuments({ author: userId });

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
