"use server";

import { revalidatePath } from "next/cache";
import { connectToDatabase } from "../database/mongoose";
import User from "../database/models/user.model";
import { auth } from "@clerk/nextjs";
import { handleError } from "../utils";

export async function updateUserSettings(settings: {
  defaultTone?: string;
  lowBalanceAlerts?: boolean;
  theme?: string;
}) {
  try {
    await connectToDatabase();

    const { userId: clerkId } = auth();
    if (!clerkId) throw new Error("Unauthorized");

    const updateData: any = {};
    if (settings.defaultTone !== undefined) updateData["settings.defaultTone"] = settings.defaultTone;
    if (settings.lowBalanceAlerts !== undefined) updateData["settings.lowBalanceAlerts"] = settings.lowBalanceAlerts;
    if (settings.theme !== undefined) updateData["settings.theme"] = settings.theme;

    const user = await User.findOneAndUpdate(
      { clerkId },
      { $set: updateData },
      { new: true }
    );

    if (!user) throw new Error("User not found");

    revalidatePath("/settings");
    revalidatePath("/profile");
    return JSON.parse(JSON.stringify(user));
  } catch (error) {
    handleError(error);
  }
}

export async function getUserSettings() {
    try {
        await connectToDatabase();
        const { userId: clerkId } = auth();
        if (!clerkId) throw new Error("Unauthorized");

        const user = await User.findOne({ clerkId }).select("settings");
        if (!user) throw new Error("User not found");

        return JSON.parse(JSON.stringify(user.settings));
    } catch (error) {
        handleError(error);
    }
}
