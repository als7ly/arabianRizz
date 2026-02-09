"use server";

import UsageLog from "../database/models/usage-log.model";
import { connectToDatabase } from "../database/mongoose";
import { handleError } from "../utils";
import { revalidatePath } from "next/cache";

export type UsageAction = "message_generation" | "image_generation" | "girl_creation" | "hookup_line";

export async function logUsage(params: { userId: string, action: UsageAction, cost: number, metadata?: any }) {
  try {
    await connectToDatabase();

    await UsageLog.create({
      user: params.userId,
      action: params.action,
      cost: params.cost,
      metadata: params.metadata,
    });

    revalidatePath("/credits/history");
  } catch (error) {
    // Logging failure should not crash the app, but we should log the error
    console.error("Failed to log usage:", error);
  }
}

export async function getUserUsage(userId: string) {
  try {
    await connectToDatabase();

    const logs = await UsageLog.find({ user: userId }).sort({ createdAt: -1 });

    return JSON.parse(JSON.stringify(logs));
  } catch (error) {
    handleError(error);
    return [];
  }
}
