"use server";

import UsageLog from "../database/models/usage-log.model";
import { connectToDatabase } from "../database/mongoose";
import { handleError } from "../utils";
import { auth } from "@clerk/nextjs";
import User from "../database/models/user.model";

export async function getUserUsage(userId: string) {
  try {
    await connectToDatabase();

    const { userId: clerkId } = auth();
    if (!clerkId) throw new Error("Unauthorized");

    const user = await User.findOne({ clerkId });
    if (!user) throw new Error("User not found");

    if (user._id.toString() !== userId) {
        throw new Error("Unauthorized");
    }

    const logs = await UsageLog.find({ user: userId }).sort({ createdAt: -1 });

    return JSON.parse(JSON.stringify(logs));
  } catch (error) {
    handleError(error);
    return [];
  }
}
