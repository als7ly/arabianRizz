"use server";

import User from "../database/models/user.model";
import { connectToDatabase } from "../database/mongoose";
import { handleError } from "../utils";
import { auth } from "@clerk/nextjs";

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
