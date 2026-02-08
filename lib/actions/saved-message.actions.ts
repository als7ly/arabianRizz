"use server";

import { revalidatePath } from "next/cache";
import { connectToDatabase } from "../database/mongoose";
import SavedMessage from "../database/models/saved-message.model";
import Message from "../database/models/message.model";
import User from "../database/models/user.model";
import "../database/models/girl.model"; // Ensure Girl model is registered for population
import { auth } from "@clerk/nextjs";

export async function toggleSaveMessage(messageId: string, path: string) {
  try {
    const { userId: clerkId } = auth();
    if (!clerkId) throw new Error("Unauthorized");

    await connectToDatabase();
    const user = await User.findOne({ clerkId });
    if (!user) throw new Error("User not found");

    const existing = await SavedMessage.findOne({ user: user._id, message: messageId });

    if (existing) {
      await SavedMessage.findByIdAndDelete(existing._id);
      revalidatePath(path);
      return { isSaved: false, message: "Removed from saved lines." };
    } else {
      const msg = await Message.findById(messageId).populate("girl");
      if (!msg) throw new Error("Message not found");

      // Security: Ensure the user owns the girl associated with the message
      if (!msg.girl || msg.girl.author.toString() !== user._id.toString()) {
        throw new Error("Unauthorized");
      }

      await SavedMessage.create({
        user: user._id,
        message: messageId,
        content: msg.content,
      });
      revalidatePath(path);
      return { isSaved: true, message: "Message saved!" };
    }
  } catch (error) {
    console.error("Toggle Save Error:", error);
    throw new Error("Failed to toggle save message");
  }
}

export async function getSavedMessages() {
  try {
    const { userId: clerkId } = auth();
    if (!clerkId) throw new Error("Unauthorized");

    await connectToDatabase();
    const user = await User.findOne({ clerkId });
    if (!user) throw new Error("User not found");

    const savedMessages = await SavedMessage.find({ user: user._id })
      .sort({ createdAt: -1 })
      .populate({
        path: "message",
        populate: {
            path: "girl",
            select: "name"
        }
      });

    return JSON.parse(JSON.stringify(savedMessages));
  } catch (error) {
    console.error("Get Saved Messages Error:", error);
    return [];
  }
}

export async function getSavedMessageIds() {
  try {
    const { userId: clerkId } = auth();
    if (!clerkId) throw new Error("Unauthorized");

    await connectToDatabase();
    const user = await User.findOne({ clerkId });
    if (!user) throw new Error("User not found");

    const savedMessages = await SavedMessage.find({ user: user._id })
      .select("message")
      .lean();

    return savedMessages.map((msg: any) => msg.message.toString());
  } catch (error) {
    console.error("Get Saved Message IDs Error:", error);
    return [];
  }
}

export async function isMessageSaved(messageId: string) {
  try {
    const { userId: clerkId } = auth();
    if (!clerkId) return false;

    await connectToDatabase();
    const user = await User.findOne({ clerkId });
    if (!user) return false;

    const existing = await SavedMessage.findOne({ user: user._id, message: messageId });
    return !!existing;
  } catch (error) {
    console.error("Check Saved Error:", error);
    return false;
  }
}

export async function deleteSavedMessage(savedMessageId: string, path: string) {
    try {
        const { userId: clerkId } = auth();
        if (!clerkId) throw new Error("Unauthorized");

        await connectToDatabase();
        const user = await User.findOne({ clerkId });
        if (!user) throw new Error("User not found");

        const saved = await SavedMessage.findById(savedMessageId);
        if (!saved) throw new Error("Saved message not found");

        if (saved.user.toString() !== user._id.toString()) {
            throw new Error("Unauthorized");
        }

        await SavedMessage.findByIdAndDelete(savedMessageId);
        revalidatePath(path);
        return { success: true, message: "Removed from saved lines." };
    } catch (error) {
        console.error("Delete Saved Error:", error);
        throw new Error("Failed to delete saved message");
    }
}
