"use server";

import { crawlUrl, processAndSave } from "@/lib/services/crawler.service";
import GlobalKnowledge from "@/lib/database/models/global-knowledge.model";
import { connectToDatabase } from "@/lib/database/mongoose";
import { revalidatePath } from "next/cache";
import { auth } from "@clerk/nextjs";
import { checkRateLimit } from "@/lib/ratelimit";

export const crawlAndStage = async (url: string, language: string) => {
  try {
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
        await connectToDatabase();
        // Recalculate embedding if content changes significantly?
        // For MVP, we might keep old embedding or assume small edits.
        // Ideally, we regenerate embedding.

        // Let's assume we just update text for now to fix typos.
        await GlobalKnowledge.findByIdAndUpdate(id, { content });
        revalidatePath("/admin/knowledge");
        return { success: true };
    } catch (error) {
        console.error("Edit Knowledge Error:", error);
        return { success: false };
    }
}
