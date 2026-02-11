
import { revalidatePath } from "next/cache";
import User from "../database/models/user.model";
import { connectToDatabase } from "../database/mongoose";
import { handleError } from "../utils";

// CREATE
export async function createUser(user: CreateUserParams) {
  try {
    await connectToDatabase();

    const newUser = await User.create(user);

    return JSON.parse(JSON.stringify(newUser));
  } catch (error) {
    handleError(error);
  }
}

// UPDATE
export async function updateUser(clerkId: string, user: UpdateUserParams) {
  try {
    await connectToDatabase();

    const updatedUser = await User.findOneAndUpdate({ clerkId }, user, {
      new: true,
    });

    if (!updatedUser) throw new Error("User update failed");

    return JSON.parse(JSON.stringify(updatedUser));
  } catch (error) {
    handleError(error);
  }
}

// DELETE
export async function deleteUser(clerkId: string) {
  try {
    await connectToDatabase();

    // Find user to delete
    const userToDelete = await User.findOne({ clerkId });

    if (!userToDelete) {
      throw new Error("User not found");
    }

    // Delete user
    const deletedUser = await User.findByIdAndDelete(userToDelete._id);
    revalidatePath("/");

    return deletedUser ? JSON.parse(JSON.stringify(deletedUser)) : null;
  } catch (error) {
    handleError(error);
  }
}

// USE CREDITS
export async function updateCredits(userId: string, creditFee: number) {
  try {
    await connectToDatabase();

    const updatedUserCredits = await User.findOneAndUpdate(
      { _id: userId },
      { $inc: { creditBalance: creditFee }},
      { new: true }
    )

    if(!updatedUserCredits) throw new Error("User credits update failed");

    return JSON.parse(JSON.stringify(updatedUserCredits));
  } catch (error) {
    handleError(error);
  }
}

// CREDIT MANAGEMENT

/**
 * Deducts credits from the user's balance.
 * Uses atomic findOneAndUpdate to ensure thread safety and sufficient funds.
 * @param userId MongoDB User ID
 * @param amount Number of credits to deduct (positive integer)
 * @returns The updated User object
 * @throws Error if insufficient credits or user not found
 */
export async function deductCredits(userId: string, amount: number) {
  if (amount < 0) throw new Error("Amount must be positive");

  await connectToDatabase();

  const updatedUser = await User.findOneAndUpdate(
    { _id: userId, creditBalance: { $gte: amount } },
    { $inc: { creditBalance: -amount } },
    { new: true }
  );

  if (!updatedUser) {
    // Check if user exists but just has low balance
    const user = await User.findById(userId);
    if (!user) throw new Error("User not found");
    throw new Error("Insufficient credits");
  }

  return JSON.parse(JSON.stringify(updatedUser));
}

/**
 * Refunds credits to the user's balance.
 * Used for rolling back failed operations.
 * @param userId MongoDB User ID
 * @param amount Number of credits to refund
 * @returns The updated User object
 */
export async function refundCredits(userId: string, amount: number) {
  if (amount < 0) throw new Error("Amount must be positive");

  await connectToDatabase();

  const updatedUser = await User.findByIdAndUpdate(
    userId,
    { $inc: { creditBalance: amount } },
    { new: true }
  );

  if (!updatedUser) throw new Error("User not found during refund");

  return JSON.parse(JSON.stringify(updatedUser));
}
