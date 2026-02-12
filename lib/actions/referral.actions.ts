"use server";

import ReferralItem from "@/lib/database/models/referral-item.model";
import { connectToDatabase } from "@/lib/database/mongoose";
import { generateEmbedding } from "@/lib/services/rag.service";
import { revalidatePath } from "next/cache";
import { auth } from "@clerk/nextjs";
import User from "@/lib/database/models/user.model";
import Girl from "@/lib/database/models/girl.model";
import Message from "@/lib/database/models/message.model";

// --- CRUD Operations ---

export async function createReferralItem(data: any) {
  try {
    const { userId } = auth();
    if (!userId) throw new Error("Unauthorized");

    await connectToDatabase();

    // Admin check
    const user = await User.findOne({ clerkId: userId });
    if (!user || user.role !== 'admin') {
        throw new Error("Unauthorized: Admin only");
    }

    const textToEmbed = `${data.name} ${data.description} ${data.category} ${data.tags ? data.tags.join(" ") : ""}`;
    const embedding = await generateEmbedding(textToEmbed);

    const newItem = await ReferralItem.create({
      ...data,
      embedding
    });

    revalidatePath("/admin/referrals");
    return JSON.parse(JSON.stringify(newItem));
  } catch (error) {
    console.error("Create Referral Error:", error);
    throw error;
  }
}

export async function updateReferralItem(id: string, data: any) {
  try {
    const { userId } = auth();
    if (!userId) throw new Error("Unauthorized");

    await connectToDatabase();

    const user = await User.findOne({ clerkId: userId });
    if (!user || user.role !== 'admin') {
        throw new Error("Unauthorized: Admin only");
    }

    const item = await ReferralItem.findById(id);
    if (!item) throw new Error("Item not found");

    // Check if we need to regenerate embedding (if text fields changed)
    const oldText = `${item.name} ${item.description} ${item.category} ${item.tags ? item.tags.join(" ") : ""}`;
    const newText = `${data.name} ${data.description} ${data.category} ${data.tags ? data.tags.join(" ") : ""}`;

    if (oldText !== newText) {
        data.embedding = await generateEmbedding(newText);
    }

    const updatedItem = await ReferralItem.findByIdAndUpdate(id, data, { new: true });

    revalidatePath("/admin/referrals");
    return JSON.parse(JSON.stringify(updatedItem));
  } catch (error) {
    console.error("Update Referral Error:", error);
    throw error;
  }
}

export async function deleteReferralItem(id: string) {
  try {
    const { userId } = auth();
    if (!userId) throw new Error("Unauthorized");

    await connectToDatabase();
    const user = await User.findOne({ clerkId: userId });
    if (!user || user.role !== 'admin') throw new Error("Unauthorized: Admin only");

    await ReferralItem.findByIdAndDelete(id);
    revalidatePath("/admin/referrals");
  } catch (error) {
    console.error("Delete Referral Error:", error);
    throw error;
  }
}

export async function getReferralItems({ page = 1, limit = 20, category = 'all' }: { page?: number, limit?: number, category?: string }) {
  try {
    await connectToDatabase();

    const query: any = {};
    if (category && category !== 'all') {
        query.category = category;
    }

    const skip = (page - 1) * limit;

    const items = await ReferralItem.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await ReferralItem.countDocuments(query);

    return {
        data: JSON.parse(JSON.stringify(items)),
        totalPages: Math.ceil(total / limit),
        currentPage: page
    };
  } catch (error) {
    console.error("Get Referrals Error:", error);
    return { data: [], totalPages: 0, currentPage: 1 };
  }
}

// --- Recommendation Logic ---

function cosineSimilarity(vecA: number[], vecB: number[]) {
    if (!vecA || !vecB || vecA.length !== vecB.length) return -1;

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    for (let i = 0; i < vecA.length; i++) {
        dotProduct += vecA[i] * vecB[i];
        normA += vecA[i] * vecA[i];
        normB += vecB[i] * vecB[i];
    }

    if (normA === 0 || normB === 0) return 0;

    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

export async function getWingmanRecommendations(girlId: string) {
  try {
    const { userId } = auth();
    if (!userId) throw new Error("Unauthorized");

    await connectToDatabase();

    const user = await User.findOne({ clerkId: userId });
    if (!user) throw new Error("User not found");

    // 1. Get Context
    // Verify ownership by checking author field against user._id
    const girl = await Girl.findOne({ _id: girlId, author: user._id });
    if (!girl) throw new Error("Girl not found or unauthorized");

    // Fetch messages (reverse order for context building)
    const messages = await Message.find({ girl: girlId })
        .sort({ createdAt: -1 })
        .limit(20);

    const conversation = messages.reverse().map((m: any) => `${m.role}: ${m.content}`).join("\n");

    // Construct context string
    const contextText = `
      Girl Name: ${girl.name}
      Vibe: ${girl.vibe || "Unknown"}
      Relationship Status: ${girl.relationshipStatus}

      Recent Conversation:
      ${conversation}

      Task: Recommend gifts, date ideas, or products that fit this context.
    `.trim();

    // 2. Generate Embedding for Context
    const queryEmbedding = await generateEmbedding(contextText);

    // 3. Fetch Candidates (Active Items Only)
    // We explicitly select the hidden 'embedding' field
    const candidates = await ReferralItem.find({ isActive: true }).select('+embedding');

    if (!candidates || candidates.length === 0) {
        return [];
    }

    // 4. Rank by Similarity
    // Map to array of { item, score }
    const scoredItems = candidates.map((item: any) => {
        // If embedding is missing (e.g. old items), score is low
        if (!item.embedding || item.embedding.length === 0) return { item, score: -1 };

        const score = cosineSimilarity(queryEmbedding, item.embedding);
        return { item, score };
    });

    // Sort descending by score
    scoredItems.sort((a: any, b: any) => b.score - a.score);

    // Return top 5 items (removing embedding from result to save bandwidth)
    const topItems = scoredItems.slice(0, 5).map((entry: any) => {
        const itemObj = entry.item.toObject();
        delete itemObj.embedding; // Ensure embedding is not sent to client
        return itemObj;
    });

    return JSON.parse(JSON.stringify(topItems));

  } catch (error) {
    console.error("Recommendation Error:", error);
    return [];
  }
}
