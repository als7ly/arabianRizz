"use server";

import UsageLog from "../database/models/usage-log.model";
import { connectToDatabase } from "../database/mongoose";
import { handleError } from "../utils";
import { auth } from "@clerk/nextjs";
import User from "../database/models/user.model";

export async function getUserUsage(userId: string, page: number = 1, limit: number = 10) {
  try {
    await connectToDatabase();

    const { userId: clerkId } = auth();
    if (!clerkId) throw new Error("Unauthorized");

    const user = await User.findOne({ clerkId });
    if (!user) throw new Error("User not found");

    if (user._id.toString() !== userId) {
        throw new Error("Unauthorized");
    }

    const skip = (page - 1) * limit;

    const [logs, total] = await Promise.all([
        UsageLog.find({ user: userId })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit),
        UsageLog.countDocuments({ user: userId })
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
        data: JSON.parse(JSON.stringify(logs)),
        totalPages,
        currentPage: page
    };
  } catch (error) {
    handleError(error);
    return { data: [], totalPages: 0, currentPage: 1 };
  }
}
