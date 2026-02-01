"use server";

import { connectToDatabase } from "@/lib/database/mongoose";
import UserKnowledge from "@/lib/database/models/user-knowledge.model";
import { generateEmbedding } from "@/lib/actions/rag.actions";
import { revalidatePath } from "next/cache";

export async function completeOnboarding(userId: string, data: { name: string, age: string, vibe: string, goal: string }) {
  try {
    await connectToDatabase();

    // Construct initial persona text
    const personaText = `My name is ${data.name}. I am ${data.age} years old. My vibe/interests are: ${data.vibe}. My current dating goal is: ${data.goal}.`;

    const embedding = await generateEmbedding(personaText);

    await UserKnowledge.create({
        user: userId,
        content: personaText,
        embedding: embedding,
        category: "Persona"
    });

    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("Onboarding Error:", error);
    return { success: false };
  }
}
