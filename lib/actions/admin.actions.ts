"use server";

import { crawlUrl, processAndSave } from "@/lib/services/crawler.service";
import GlobalKnowledge from "@/lib/database/models/global-knowledge.model";
import { connectToDatabase } from "@/lib/database/mongoose";
import User from "@/lib/database/models/user.model";
import { revalidatePath } from "next/cache";
import { auth } from "@clerk/nextjs";
import { checkRateLimit } from "@/lib/ratelimit";
import { generateEmbedding } from "./rag.actions";

const requireAdmin = async () => {
  const { userId } = auth();
  if (!userId) throw new Error("Unauthorized");
  await connectToDatabase();
  const user = await User.findOne({ clerkId: userId });
  if (!user || user.role !== 'admin') {
    throw new Error("Unauthorized: Admin access required");
  }
};

export const crawlAndStage = async (url: string, language: string) => {
  try {
    await requireAdmin();
    const { userId } = auth();
    if (!userId) {
        return { success: false, error: "Unauthorized" };
    }

    if (!checkRateLimit(userId)) {
        return { success: false, error: "Rate limit exceeded. Try again in a minute." };
    }

    const { chunks, tags } = await crawlUrl(url);
    const results = await processAndSave(chunks, language, url, tags);
    revalidatePath("/admin/knowledge");
    return { success: true, count: results.length };
  } catch (error) {
    console.error("Crawl Action Error:", error);
    return { success: false, error: "Failed to crawl and stage content." };
  }
};

export const getPendingKnowledge = async (page: number = 1, limit: number = 20, language?: string) => {
  try {
    await requireAdmin();
    await connectToDatabase();
    const skip = (page - 1) * limit;

    const query = { status: 'pending' };
    if (language && language !== 'all') {
      Object.assign(query, { language });
    }

    const knowledge = await GlobalKnowledge.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

    const total = await GlobalKnowledge.countDocuments(query);
    const totalPages = Math.ceil(total / limit);

    return {
        data: JSON.parse(JSON.stringify(knowledge)),
        totalPages,
        currentPage: page
    };
  } catch (error) {
    console.error("Get Pending Knowledge Error:", error);
    return { data: [], totalPages: 0, currentPage: 1 };
  }
};

export const approveKnowledge = async (id: string) => {
  try {
    await requireAdmin();
    await connectToDatabase();
    await GlobalKnowledge.findByIdAndUpdate(id, { status: 'approved' });
    revalidatePath("/admin/knowledge");
    return { success: true };
  } catch (error) {
    console.error("Approve Knowledge Error:", error);
    return { success: false, error: "Failed to approve." };
  }
};

export const rejectKnowledge = async (id: string) => {
  try {
    await requireAdmin();
    await connectToDatabase();
    await GlobalKnowledge.findByIdAndDelete(id);
    revalidatePath("/admin/knowledge");
    return { success: true };
  } catch (error) {
    console.error("Reject Knowledge Error:", error);
    return { success: false, error: "Failed to reject." };
  }
};

export const editKnowledge = async (id: string, content: string) => {
    try {
        await requireAdmin();
        await connectToDatabase();

        // Regenerate embedding for the updated content
        const embedding = await generateEmbedding(content);

        await GlobalKnowledge.findByIdAndUpdate(id, {
            content,
            embedding // Update the vector as well
        });

        revalidatePath("/admin/knowledge");
        return { success: true };
    } catch (error) {
        console.error("Edit Knowledge Error:", error);
        return { success: false };
    }
}
