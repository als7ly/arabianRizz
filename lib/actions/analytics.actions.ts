"use server";

import { connectToDatabase } from "@/lib/database/mongoose";
import User from "@/lib/database/models/user.model";
import Transaction from "@/lib/database/models/transaction.model";
import GlobalKnowledge from "@/lib/database/models/global-knowledge.model";
import { logger } from "@/lib/services/logger.service";

export async function getAnalyticsData() {
  try {
    await connectToDatabase();

    // 1. Total Revenue
    const revenueResult = await Transaction.aggregate([
      { $group: { _id: null, total: { $sum: "$amount" } } }
    ]);
    const totalRevenue = revenueResult[0]?.total || 0;

    // 2. Active Users (Last 24h)
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const activeUsers = await User.countDocuments({ "streak.lastActive": { $gte: oneDayAgo } });

    // 3. Total Users
    const totalUsers = await User.countDocuments();

    // 4. Knowledge Base Size
    const totalKnowledge = await GlobalKnowledge.countDocuments({ status: 'approved' });

    // 5. Total Interactions
    const interactionsResult = await User.aggregate([
      { $group: { _id: null, total: { $sum: "$totalInteractions" } } }
    ]);
    const totalInteractions = interactionsResult[0]?.total || 0;

    return {
        totalRevenue,
        activeUsers,
        totalUsers,
        totalKnowledge,
        totalInteractions
    };

  } catch (error) {
    logger.error("Analytics Error:", error);
    return {
        totalRevenue: 0,
        activeUsers: 0,
        totalUsers: 0,
        totalKnowledge: 0,
        totalInteractions: 0
    };
  }
}
