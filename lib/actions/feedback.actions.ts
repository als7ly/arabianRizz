"use server";

import { connectToDatabase } from "../database/mongoose";
import Message from "../database/models/message.model";
import { handleError } from "../utils";
import { revalidatePath } from "next/cache";

export async function submitFeedback(messageId: string, feedback: 'up' | 'down', path: string) {
  try {
    await connectToDatabase();

    const updatedMessage = await Message.findByIdAndUpdate(
      messageId,
      { feedback },
      { new: true }
    );

    if (!updatedMessage) throw new Error("Message not found");

    revalidatePath(path);
    return JSON.parse(JSON.stringify(updatedMessage));
  } catch (error) {
    handleError(error);
  }
}
