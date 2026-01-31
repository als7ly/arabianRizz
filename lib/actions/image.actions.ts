"use server";

import { auth } from "@clerk/nextjs";
import { connectToDatabase } from "../database/mongoose";
import { handleError } from "../utils";
import User from "../database/models/user.model";
import Girl from "../database/models/girl.model";
import { openai } from "../openai";
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const IMAGE_COST = 3;

export async function generateArt(prompt: string, girlId: string) {
  try {
    const { userId: clerkId } = auth();
    if (!clerkId) throw new Error("Unauthorized");

    await connectToDatabase();

    const user = await User.findOne({ clerkId });
    if (!user) throw new Error("User not found");

    // 1. Check & Deduct Credits
    if (user.creditBalance < IMAGE_COST) {
        throw new Error(`Insufficient credits. You need ${IMAGE_COST} credits.`);
    }

    const updatedUser = await User.findOneAndUpdate(
        { _id: user._id, creditBalance: { $gte: IMAGE_COST } },
        { $inc: { creditBalance: -IMAGE_COST } },
        { new: true }
    );

    if (!updatedUser) {
        throw new Error("Insufficient credits");
    }

    try {
        // 2. Fetch Girl Details
        const girl = await Girl.findById(girlId);
        if (!girl) throw new Error("Girl not found");

        // 3. Construct Prompt
        const fullPrompt = `
            Character: A girl named ${girl.name}.
            Appearance/Vibe: ${girl.vibe}.
            Scene/Action: ${prompt}.
            Style: High quality, photorealistic or artistic as requested.
        `;

        // 4. Call DALL-E 3
        if (process.env.OPENAI_API_KEY === "dummy-key" && !process.env.OPENAI_BASE_URL) {
            return {
                imageUrl: "https://via.placeholder.com/1024x1024.png?text=Mock+DALL-E+Image",
                remainingCredits: updatedUser.creditBalance
            };
        }

        const response = await openai.images.generate({
            model: "dall-e-3",
            prompt: fullPrompt,
            n: 1,
            size: "1024x1024",
            quality: "hd",
            style: "vivid"
        });

        const imageUrl = response.data[0]?.url;

        if (!imageUrl) throw new Error("Image generation failed");

        // Upload to Cloudinary for persistence
        let finalUrl = imageUrl;
        try {
            const uploadResult = await cloudinary.uploader.upload(imageUrl, {
                folder: 'wingman_generated',
            });
            finalUrl = uploadResult.secure_url;
        } catch (uploadError) {
            console.warn("Cloudinary Upload Failed, using DALL-E URL:", uploadError);
            // Fallback to DALL-E URL (will expire)
        }

        return { imageUrl: finalUrl, remainingCredits: updatedUser.creditBalance };

    } catch (error) {
        // Rollback credits on failure
        await User.findByIdAndUpdate(user._id, { $inc: { creditBalance: IMAGE_COST } });
        throw error;
    }

  } catch (error) {
    handleError(error);
    return { error: "Failed to generate image" };
  }
}
