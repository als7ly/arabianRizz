"use server";

import { connectToDatabase } from "@/lib/database/mongoose";
import User from "@/lib/database/models/user.model";


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
