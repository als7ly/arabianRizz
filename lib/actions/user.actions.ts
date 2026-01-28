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

    // Optional: Ensure the user is fetching their own data or public data
    // For now, we assume fetching by clerkId is safe for self-lookup
    const user = await User.findOne({ clerkId: userId });

    if (!user) throw new Error("User not found");

    return JSON.parse(JSON.stringify(user));
  } catch (error) {
    handleError(error);
  }
}
