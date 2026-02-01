"use server";

import { connectToDatabase } from "@/lib/database/mongoose";
import User from "@/lib/database/models/user.model";

export async function updateGamification(userId: string) {
  try {
    await connectToDatabase();

    const user = await User.findById(userId);
    if (!user) return;

    // 1. Update Interactions
    user.totalInteractions = (user.totalInteractions || 0) + 1;

    // 2. Update Streak
    const now = new Date();
    const lastActive = new Date(user.streak?.lastActive || 0);
    const diffTime = Math.abs(now.getTime() - lastActive.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
        // Consecutive day
        user.streak.current += 1;
    } else if (diffDays > 1) {
        // Streak broken
        user.streak.current = 1;
    }
    // If diffDays is 0 (same day), do nothing to streak count
    user.streak.lastActive = now;

    // 3. Check Badges
    const newBadges = [];
    const currentBadges = user.badges || [];

    if (user.totalInteractions >= 10 && !currentBadges.includes("Apprentice")) {
        newBadges.push("Apprentice");
    }
    if (user.totalInteractions >= 50 && !currentBadges.includes("Wingman")) {
        newBadges.push("Wingman");
    }
    if (user.totalInteractions >= 100 && !currentBadges.includes("Rizz God")) {
        newBadges.push("Rizz God");
    }
    if (user.streak.current >= 3 && !currentBadges.includes("On Fire")) {
        newBadges.push("On Fire");
    }

    if (newBadges.length > 0) {
        user.badges = [...currentBadges, ...newBadges];
    }

    await user.save();
    return JSON.parse(JSON.stringify(user));

  } catch (error) {
    console.error("Gamification Error:", error);
  }
}

export async function getLeaderboard() {
    try {
        await connectToDatabase();
        // Top 10 by total interactions
        const users = await User.find({})
            .sort({ totalInteractions: -1 })
            .limit(10)
            .select("username firstName photo totalInteractions badges streak");

        return JSON.parse(JSON.stringify(users));
    } catch (error) {
        console.error("Leaderboard Error:", error);
        return [];
    }
}
