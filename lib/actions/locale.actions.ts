"use server";

import { connectToDatabase } from "../database/mongoose";
import User from "../database/models/user.model";
import { auth } from "@clerk/nextjs";

export async function updateUserLocale(locale: string) {
  try {
    const { userId: clerkId } = auth();
    if (!clerkId) return;

    await connectToDatabase();

    await User.findOneAndUpdate(
        { clerkId },
        { locale },
        { new: true }
    );
  } catch (error) {
    console.error("Update Locale Error:", error);
  }
}
