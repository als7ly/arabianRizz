"use server";

import { openai } from "../openai";
import { openrouter, WINGMAN_MODEL } from "../openrouter";
import { generateEmbedding, retrieveContext, retrieveUserContext } from "../services/rag.service";
import { getGlobalKnowledge } from "./global-rag.actions";
import { extractTextFromImage } from "./ocr.actions";
import Message from "../database/models/message.model";
import Girl from "../database/models/girl.model";
import { connectToDatabase } from "../database/mongoose";
import { auth } from "@clerk/nextjs";
import User from "../database/models/user.model";
import GlobalKnowledge from "../database/models/global-knowledge.model";
import { v2 as cloudinary } from 'cloudinary';
import { Readable } from 'stream';
import { updateGamification } from "@/lib/services/gamification.service";
import { logger } from "@/lib/services/logger.service";
import { sendEmail } from "@/lib/services/email.service";
import { BLOCKED_KEYWORDS, LOW_BALANCE_THRESHOLD } from "@/constants";
import { deductCredits, refundCredits } from "../services/user.service";
import { logUsage } from "../services/usage.service";
import { getGirlById } from "./girl.actions";

export interface WingmanReplyResponse {
  reply: string;
  explanation: string;
  newBadges?: string[];
  newBalance?: number;
}

export interface HookupLineResponse {
  line: string;
  explanation: string;
  newBadges?: string[];
  newBalance?: number;
}

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

async function checkContentSafety(text: string): Promise<boolean> {
    // 1. Advanced Moderation via OpenAI API (if available)
    if (process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'dummy-key') {
        try {
            const moderation = await openai.moderations.create({ input: text });
            const result = moderation.results[0];
            if (result.flagged) {
                logger.warn("OpenAI Moderation Flagged Content", { categories: result.categories });
                return false;
            }
            return true;
        } catch (error) {
            logger.error("OpenAI Moderation API Failed", error);
            // Fallthrough to keyword check if API fails
        }
    }

    // 2. Basic Keyword Fallback
    const lowerText = text.toLowerCase();
    const hasBlockedKeyword = BLOCKED_KEYWORDS.some(keyword => lowerText.includes(keyword));

    if (hasBlockedKeyword) {
        logger.warn("Keyword Safety Check Failed", { text });
        return false;
    }

    return true;
}

async function getUserAndGirl(girlId: string) {
    const { userId: clerkId } = auth();
    if (!clerkId) throw new Error("Unauthorized");

    await connectToDatabase();

    const [user, girl] = await Promise.all([
        User.findOne({ clerkId }).lean(),
        Girl.findById(girlId).lean()
    ]);

    if (!user) throw new Error("User not found");
    if (!girl) throw new Error("Girl not found");

    if (girl.author.toString() !== user._id.toString()) {
        throw new Error("Unauthorized Access");
    }

    return { user, girl };
}

interface UserWithSettings {
    _id: string;
    email: string;
    creditBalance: number;
    settings?: {
        lowBalanceAlerts: boolean;
    };
    lastLowBalanceEmailSent?: Date;
}

// Low Balance Check Utility
async function checkAndNotifyLowBalance(user: UserWithSettings) {
    // Check if user disabled alerts
    if (user.settings?.lowBalanceAlerts === false) {
        return;
    }

    // Threshold: 10 credits
    if (user.creditBalance < LOW_BALANCE_THRESHOLD) {
        // Rate Limiting: Check last email sent timestamp
        if (user.lastLowBalanceEmailSent) {
            const lastSent = new Date(user.lastLowBalanceEmailSent);
            const now = new Date();
            const hoursSinceLastSent = (now.getTime() - lastSent.getTime()) / (1000 * 60 * 60);

            if (hoursSinceLastSent < 24) {
                logger.info("Low balance email skipped (rate limited)", { userId: user._id, lastSent });
                return;
            }
        }

        try {
            await sendEmail({
                to: user.email,
                subject: "⚡ Low Balance Alert - Top Up Your Rizz",
                html: `<h1>Running Low on Rizz?</h1><p>You have fewer than ${LOW_BALANCE_THRESHOLD} credits left (${user.creditBalance}). Don't get left on read. <a href="${process.env.NEXT_PUBLIC_SERVER_URL}/credits">Top up now</a>.</p>`
            });

            // Update lastLowBalanceEmailSent timestamp
            await User.findByIdAndUpdate(user._id, { lastLowBalanceEmailSent: new Date() });

            logger.info("Low balance alert sent", { userId: user._id });
        } catch (e) {
            logger.error("Failed to send low balance email", e);
        }
    }
}

async function saveFeedbackToKnowledgeBase(message: any) {
    try {
        const arabicPattern = /[\u0600-\u06FF]/;
        const language = arabicPattern.test(message.content) ? 'ar' : 'en';

        const embeddingResponse = await openai.embeddings.create({
            model: "text-embedding-3-small",
            input: message.content,
        });
        const embedding = embeddingResponse.data[0].embedding;

        await GlobalKnowledge.create({
            content: message.content,
            embedding: embedding,
            language: language,
            sourceUrl: "user-feedback",
            status: 'pending',
            tags: ['user-feedback', 'auto-learned']
        });
        logger.info("Feedback saved to GlobalKnowledge", { messageId: message._id });
    } catch (error) {
        logger.error("Failed to save feedback to GlobalKnowledge", error);
    }
}

export async function submitFeedback(messageId: string, feedback: 'positive' | 'negative') {
  try {
    await connectToDatabase();

    // Security: Verify ownership before updating
    const originalMessage = await Message.findById(messageId);
    if (!originalMessage) {
        return { success: false };
    }
    // Verify ownership via helper (fetches both to check author match)
    await getUserAndGirl(originalMessage.girl.toString());

    // 1. Update the message
    const message = await Message.findByIdAndUpdate(messageId, { feedback }, { new: true });

    // 2. Auto-Learning: If positive, save to GlobalKnowledge
    if (feedback === 'positive' && message && message.role === 'wingman') {
        // Optimization: Fire-and-forget background task to prevent blocking the UI
        saveFeedbackToKnowledgeBase(message).catch(err => {
             logger.error("Background Knowledge Save Error", err);
        });
    }

    return { success: true };
  } catch (error) {
    logger.error("Feedback Error:", error);
    return { success: false };
  }
}

export async function generateWingmanReply(girlId: string, userMessage: string, tone: string = "Flirty", senderRole: "user" | "girl" | "instruction" = "user"): Promise<WingmanReplyResponse> {
  try {
    // Safety Check
    const isSafe = await checkContentSafety(userMessage);
    if (!isSafe) {
        return {
            reply: "I cannot generate a response for this content as it violates our safety guidelines.",
            explanation: "Content violation detected."
        };
    }

    // Security: Validate tone to prevent prompt injection
    const ALLOWED_TONES = ['Flirty', 'Funny', 'Serious', 'Mysterious'];
    const safeTone = ALLOWED_TONES.includes(tone) ? tone : 'Flirty';

    const { user, girl } = await getUserAndGirl(girlId);

    // Deduct Credit (Generate Reply is 1 credit)
    const COST = 1;
    let updatedUser;
    try {
        updatedUser = await deductCredits(user._id.toString(), COST);
    } catch (e) {
        return {
            reply: "You are out of credits! Please top up to continue.",
            explanation: "Insufficient credits."
        };
    }

    try {
    // Language Handling
    const languageCode = girl.language || 'en';
    const languageMap: { [key: string]: string } = {
        'en': 'English', 'ar': 'Arabic', 'fr': 'French', 'zh': 'Chinese',
        'ja': 'Japanese', 'es': 'Spanish', 'hi': 'Hindi', 'pt': 'Portuguese',
        'ru': 'Russian', 'de': 'German'
    };
    const fullLanguage = languageMap[languageCode] || 'English';

    // Optimization: Generate embedding once and reuse for all RAG retrievals
    const embedding = await generateEmbedding(userMessage);

    const [contextMessages, userContext, globalKnowledge] = await Promise.all([
      retrieveContext(girlId, userMessage, embedding),
      retrieveUserContext(girl.author.toString(), userMessage, embedding),
      getGlobalKnowledge(userMessage, languageCode, embedding)
    ]);

    const contextString = JSON.stringify(contextMessages);
    const userContextString = userContext.map((k: any) => k.content).join("\n");
    const globalContextString = globalKnowledge.map((k: any) => k.content).join("\n");

    // Dialect Handling (Only for Arabic)
    let dialectInstruction = "";
    if (languageCode === 'ar' && girl.dialect) {
        dialectInstruction = `She speaks the ${girl.dialect} Arabic dialect. You MUST use ${girl.dialect} slang and expressions in your suggested reply.`;
    } else {
        dialectInstruction = `You MUST generate the reply in ${fullLanguage}.`;
    }

    const systemPrompt = `
You are "The Wingman", an expert dating coach and master of female psychology.
Your Goal: Help the user ("The Man") hook up with the girl ("${girl.name}").
Details about her: ${girl.vibe || "Unknown"}. Status: ${girl.relationshipStatus}.
Tone requested: ${safeTone}.

Context about The User ("Me"):
Name: ${user.firstName || user.username}
Age: ${user.age || "Unknown"}
Gender: ${user.gender || "Unknown"}
Occupation: ${user.occupation || "Unknown"}
Relationship Goal: ${user.relationshipGoal || "Unknown"}
Bio/Vibe: ${user.bio || "Unknown"}
${userContextString ? `Additional Memories:\n${userContextString}` : ""}

Expert Tips & Cultural Context (from Knowledge Base):
${globalContextString || "No specific tips found."}

Instructions:
1. Analyze the conversation context provided.
2. Provide a DIRECT, UNCENSORED, and ${safeTone.toUpperCase()} reply that the user should send.
3. Explain WHY this reply works (briefly) based on psychology.
4. ${dialectInstruction}
5. Be cool, confident, and not desperate.
6. YOU MUST RESPOND IN VALID JSON FORMAT with two keys: "reply" (the suggested message) and "explanation" (the psychology reasoning).

Context from previous messages:
${contextString}
`;

    if (process.env.OPENROUTER_API_KEY === "dummy-openrouter-key" && !process.env.OPENAI_BASE_URL) {
       return {
         reply: `(Mock Wingman - ${safeTone}): Tell her "You have a vibe that I can't quite put my finger on, but I like it."`,
         explanation: "It's mysterious and complimentary without being too eager."
       };
    }

    let contextInstruction = "";
    if (senderRole === 'girl') {
        contextInstruction = `She just said: "${userMessage}". What should I say?`;
    } else if (senderRole === 'instruction') {
        contextInstruction = `User Instruction: "${userMessage}". Generate a reply to the girl following this instruction.`;
    } else {
        contextInstruction = `I want to say: "${userMessage}". Improve this or tell me what to say instead.`;
    }

    const completion = await openrouter.chat.completions.create({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: contextInstruction },
      ],
      model: WINGMAN_MODEL,
      response_format: { type: "json_object" },
    });

    const aiContent = completion.choices[0]?.message?.content;

    if (aiContent) {
        await logUsage({ userId: user._id, action: "message_generation", cost: COST, metadata: { girlId } });

        // Check for Low Balance
        checkAndNotifyLowBalance(updatedUser).catch(err => logger.error("Background Low Balance Check Error", err));

        // Update Gamification Stats
        const gamificationResult = await updateGamification(updatedUser);
        const newBadges = gamificationResult?.newBadges || [];

        try {
            const parsed = JSON.parse(aiContent);
            return {
                reply: parsed.reply || "Error parsing reply",
                explanation: parsed.explanation || "No explanation provided",
                newBadges, // Include badges in response
                newBalance: updatedUser.creditBalance
            };
        } catch (e) {
            logger.error("JSON Parse Error:", e);
            return {
                reply: aiContent,
                explanation: "Could not parse AI response.",
                newBadges,
                newBalance: updatedUser.creditBalance
            };
        }
    }

    // Refund if no AI content
    await refundCredits(user._id.toString(), COST);

    return {
      reply: "Error: No response from AI.",
      explanation: "Something went wrong."
    };

    } catch (apiError) {
        // Refund on API error
        await refundCredits(user._id.toString(), COST);
        throw apiError;
    }

  } catch (error: any) {
    logger.error("Wingman Error:", error);

    let explanation = "Something went wrong with the AI.";
    let reply = "I'm having trouble thinking right now. Please try again.";

    if (error?.status === 429 || error?.message?.includes("rate limit") || error?.code === 'rate_limit_exceeded') {
        explanation = "High traffic. Please wait a moment.";
        reply = "Too many requests! Give me a second to catch my breath.";
    } else if (error?.status === 400 || error?.message?.includes("context length") || error?.code === 'context_length_exceeded') {
        explanation = "Conversation is too long.";
        reply = "Our conversation is getting too long for me to remember everything. Please clear the chat.";
    } else if (error?.status === 503) {
        explanation = "AI Service unavailable.";
        reply = "My brain is offline momentarily. Check back soon.";
    }

    return {
        reply,
        explanation
    };
  }
}

export async function analyzeProfile(imageUrl: string) {
  try {
    const { userId: clerkId } = auth();
    if (!clerkId) throw new Error("Unauthorized");

    const text = await extractTextFromImage(imageUrl);
    if (!text) return null;

    const systemPrompt = `
      You are an AI that extracts data from dating profiles (Tinder, Bumble, Hinge, etc.).
      Extract the following fields from the provided text:
      - name: string (Her name)
      - age: number (Her age, or null if not found)
      - vibe: string (A summary of her bio, interests, and personality. Be descriptive.)
      - socialMediaHandle: string (Instagram/Snapchat handle starting with @ if found, else null)

      If information is missing, use null for age/socialMediaHandle and empty string for vibe.
      YOU MUST RESPOND IN VALID JSON FORMAT.
    `;

    if (process.env.OPENAI_API_KEY === "dummy-key" && !process.env.OPENROUTER_API_KEY) {
        return {
            name: "Sarah (Mock)",
            age: 24,
            vibe: "Loves traveling, sushi, and hiking. Adventurous spirit."
        };
    }

    await connectToDatabase();
    const user = await User.findOne({ clerkId }).lean();
    if (!user) throw new Error("User not found");

    // Deduct Credit (Analysis uses OCR + LLM)
    const ANALYSIS_COST = 1;
    await deductCredits(user._id.toString(), ANALYSIS_COST);

    try {
        const completion = await openrouter.chat.completions.create({
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: `Profile Text:\n${text}` },
          ],
          model: WINGMAN_MODEL,
          response_format: { type: "json_object" }
        });

        const aiContent = completion.choices[0]?.message?.content;
        if (aiContent) {
            try {
                const parsed = JSON.parse(aiContent);
                await logUsage({ userId: user._id, action: "profile_analysis", cost: ANALYSIS_COST, metadata: { imageUrl: imageUrl.substring(0, 100) } });
                return parsed;
            } catch (e) {
                logger.error("JSON Parse Error:", e);
                await refundCredits(user._id.toString(), ANALYSIS_COST);
                return null;
            }
        }

        await refundCredits(user._id.toString(), ANALYSIS_COST);
        return null;

    } catch (error) {
        // Rollback credits on API failure
        await refundCredits(user._id.toString(), ANALYSIS_COST);
        throw error;
    }
  } catch (error) {
    logger.error("Analyze Profile Error:", error);
    return null;
  }
}

export async function generateResponseImage(prompt: string) {
  try {
    const { userId: clerkId } = auth();
    if (!clerkId) throw new Error("Unauthorized");

    if (process.env.OPENAI_API_KEY === "dummy-key" && !process.env.OPENAI_BASE_URL) {
        return "https://via.placeholder.com/1024x1024.png?text=Mock+AI+Image";
    }

    await connectToDatabase();
    const user = await User.findOne({ clerkId }).lean();
    if (!user) throw new Error("User not found");

    // SECURITY: Deduct 3 credits before expensive image generation to prevent Denial of Wallet
    const IMAGE_COST = 3;
    await deductCredits(user._id.toString(), IMAGE_COST);

    // Safety Check for Image Generation
    const isSafe = await checkContentSafety(prompt);
    if (!isSafe) {
        logger.warn("Content safety violation blocked in image gen", { prompt });
        await refundCredits(user._id.toString(), IMAGE_COST);
        return "https://via.placeholder.com/1024x1024.png?text=Content+Violation";
    }

    try {
        const response = await openai.images.generate({
          model: "dall-e-3",
          prompt: prompt,
          n: 1,
          size: "1024x1024",
        });

        if (response.data && response.data.length > 0) {
            await logUsage({ userId: user._id, action: "image_generation", cost: IMAGE_COST, metadata: { prompt: prompt.substring(0, 100) } });
            return response.data[0].url;
        }

        await refundCredits(user._id.toString(), IMAGE_COST);
        return null;

    } catch (error) {
        // Rollback credits on API failure
        await refundCredits(user._id.toString(), IMAGE_COST);
        throw error;
    }
  } catch (error) {
    logger.error("Image Gen Error:", error);
    return null;
  }
}

export async function generateSpeech(text: string, voiceId: string = "nova", messageId?: string) {
  try {
    const { userId: clerkId } = auth();
    if (!clerkId) return null;

    if (process.env.OPENAI_API_KEY === "dummy-key" && !process.env.OPENAI_BASE_URL) {
        return null;
    }

    await connectToDatabase();
    const user = await User.findOne({ clerkId }).lean();
    if (!user) return null;

    // Security Check: If associating with a message, ensure user owns the girl.
    if (messageId) {
        const message = await Message.findById(messageId);
        if (message) {
             // This will throw Unauthorized if user is not author
             await getGirlById(message.girl.toString());
        } else {
             return null;
        }
    }

    // Deduct Credit (TTS is expensive)
    const SPEECH_COST = 1;
    const userWithCredits = await deductCredits(user._id.toString(), SPEECH_COST);

    // 1. Generate Speech via OpenAI
    const voice = voiceId as "alloy" | "echo" | "fable" | "onyx" | "nova" | "shimmer";
    let mp3;
    try {
        mp3 = await openai.audio.speech.create({
          model: "tts-1",
          voice: voice,
          input: text,
        });
    } catch (error) {
        // Rollback credits on API failure
        await refundCredits(user._id.toString(), SPEECH_COST);
        throw error;
    }

    const buffer = Buffer.from(await mp3.arrayBuffer());

    // 2. Upload to Cloudinary using a Promise wrapper for the upload stream
    // Since Cloudinary SDK upload_stream relies on callbacks
    const uploadToCloudinary = () => {
        return new Promise((resolve, reject) => {
            const uploadStream = cloudinary.uploader.upload_stream(
                {
                    resource_type: "video", // "video" is used for audio files in Cloudinary
                    folder: "wingman_audio",
                    format: "mp3"
                },
                (error, result) => {
                    if (error) reject(error);
                    else resolve(result?.secure_url);
                }
            );
            // Convert Buffer to Readable Stream
            const readableStream = new Readable();
            readableStream.push(buffer);
            readableStream.push(null);
            readableStream.pipe(uploadStream);
        });
    };

    try {
        const audioUrl = await uploadToCloudinary() as string;

        // 3. Persist URL if messageId is provided
        if (messageId && audioUrl) {
            await connectToDatabase();
            await Message.findByIdAndUpdate(messageId, { audioUrl });
        }

        // Log Usage & Check Balance
        await logUsage({ userId: user._id, action: "speech_generation", cost: SPEECH_COST, metadata: { messageId } });
        checkAndNotifyLowBalance(userWithCredits).catch(err => logger.error("Low Balance Notify Error", err));

        return audioUrl;

    } catch (uploadError) {
        logger.error("Cloudinary Upload Error:", uploadError);

        // Log Usage even on upload failure (user gets base64)
        await logUsage({ userId: user._id, action: "speech_generation", cost: SPEECH_COST, metadata: { messageId, fallback: true } });
        checkAndNotifyLowBalance(userWithCredits).catch(err => logger.error("Low Balance Notify Error", err));

        // Fallback to Base64 if upload fails, so the user still hears it
        const base64 = buffer.toString('base64');
        return `data:audio/mp3;base64,${base64}`;
    }

  } catch (error) {
    logger.error("Speech Gen Error:", error);
    return null;
  }
}

export async function generateHookupLine(girlId: string): Promise<HookupLineResponse> {
  try {
    const { user, girl } = await getUserAndGirl(girlId);

    // Deduct Credit (Hookup Line is 1 credit)
    const COST = 1;
    let updatedUser;
    try {
        updatedUser = await deductCredits(user._id.toString(), COST);
    } catch (e) {
         return {
            line: "You are out of credits! Please top up.",
            explanation: "Insufficient credits."
        };
    }

    try {
    const language = (girl.dialect && girl.dialect !== 'English') ? 'ar' : 'en';

    // Optimization: Generate embedding once and reuse
    const combinedQuery = "best hookup lines flirting dating advice";
    const embedding = await generateEmbedding(combinedQuery);

    const [userContext, globalKnowledge] = await Promise.all([
      retrieveUserContext(girl.author.toString(), combinedQuery, embedding),
      getGlobalKnowledge(combinedQuery, language, embedding)
    ]);

    const userContextString = userContext.map((k: any) => k.content).join("\n");
    const globalContextString = globalKnowledge.map((k: any) => k.content).join("\n");

    const dialectInstruction = girl.dialect
        ? `She speaks the ${girl.dialect} Arabic dialect. You MUST use ${girl.dialect} slang and expressions.`
        : "Support Arabic dialects if appropriate.";

    const systemPrompt = `
You are "The Wingman", an expert dating coach.
Your Goal: Generate a DIRECT, UNCENSORED, and FLIRTY hookup line for the user to say to "${girl.name}".
Details about her: ${girl.vibe || "Unknown"}. Status: ${girl.relationshipStatus}.

Context about The User:
Name: ${user.firstName || user.username}
Age: ${user.age || "Unknown"}
Gender: ${user.gender || "Unknown"}
Occupation: ${user.occupation || "Unknown"}
Relationship Goal: ${user.relationshipGoal || "Unknown"}
Bio/Vibe: ${user.bio || "Unknown"}
${userContextString ? `Additional Memories:\n${userContextString}` : ""}

Expert Tips & Cultural Context:
${globalContextString}

Instructions:
1. Generate a bold, spicy, and effective hookup line.
2. It should be uncensored but charming.
3. ${dialectInstruction}
4. YOU MUST RESPOND IN VALID JSON FORMAT with two keys: "line" (the suggested line) and "explanation" (why it works).
`;

    if (process.env.OPENROUTER_API_KEY === "dummy-openrouter-key") {
       return {
         line: `(Mock Hookup): "Are you a magician? Because whenever I look at you, everyone else disappears."`,
         explanation: "Classic cheesy line."
       };
    }

    const completion = await openrouter.chat.completions.create({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: "Give me your best hookup line for her." },
      ],
      model: WINGMAN_MODEL,
      response_format: { type: "json_object" }
    });

    const aiContent = completion.choices[0]?.message?.content;

    if (aiContent) {
        await logUsage({ userId: user._id, action: "hookup_line", cost: COST, metadata: { girlId } });

        // Check for Low Balance
        checkAndNotifyLowBalance(updatedUser).catch(err => logger.error("Background Low Balance Check Error", err));

        const gamificationResult = await updateGamification(updatedUser);
        const newBadges = gamificationResult?.newBadges || [];

        try {
            const parsed = JSON.parse(aiContent);
            return {
                line: parsed.line || parsed.reply || "Error parsing line",
                explanation: parsed.explanation || "No explanation provided",
                newBadges,
                newBalance: updatedUser.creditBalance
            };
        } catch (e) {
             return {
                line: aiContent,
                explanation: "Could not parse AI response.",
                newBadges,
                newBalance: updatedUser.creditBalance
            };
        }
    }

    await refundCredits(user._id.toString(), COST);
    return {
        line: "Error generating line.",
        explanation: "AI failure."
    };

    } catch (apiError) {
        await refundCredits(user._id.toString(), COST);
        throw apiError;
    }

  } catch (error) {
    logger.error("Hookup Line Error:", error);
    return {
        line: "Error generating line.",
        explanation: "Something went wrong."
    };
  }
}

export interface DateIdeaResponse {
  idea: string;
  explanation: string;
  locationType: string;
  newBadges?: string[];
  newBalance?: number;
}

export async function generateDateIdea(girlId: string): Promise<DateIdeaResponse> {
  try {
    const { user, girl } = await getUserAndGirl(girlId);

    // Deduct Credit (Date Idea is 1 credit)
    const COST = 1;
    let updatedUser;
    try {
        updatedUser = await deductCredits(user._id.toString(), COST);
    } catch (e) {
         return {
            idea: "You are out of credits! Please top up.",
            explanation: "Insufficient credits.",
            locationType: "None"
        };
    }

    try {
    const language = (girl.dialect && girl.dialect !== 'English') ? 'ar' : 'en';

    // Optimization: Generate embedding once and reuse
    const combinedQuery = "creative unique date ideas romantic fun activities";
    const embedding = await generateEmbedding(combinedQuery);

    const [userContext, globalKnowledge] = await Promise.all([
      retrieveUserContext(girl.author.toString(), combinedQuery, embedding),
      getGlobalKnowledge(combinedQuery, language, embedding)
    ]);

    const userContextString = userContext.map((k: any) => k.content).join("\n");
    const globalContextString = globalKnowledge.map((k: any) => k.content).join("\n");

    const systemPrompt = `
You are "The Wingman", an expert dating coach.
Your Goal: Generate a CREATIVE, PERSONALIZED DATE IDEA for the user and "${girl.name}".
Details about her: ${girl.vibe || "Unknown"}. Age: ${girl.age || "Unknown"}. Status: ${girl.relationshipStatus}.

Context about The User:
Bio/Vibe: ${user.bio || "Unknown"}
Interests: ${userContextString || "Unknown"}

Expert Tips:
${globalContextString}

Instructions:
1. Suggest a specific date activity that fits both personalities.
2. Be original (no boring "dinner and movie" unless there's a twist).
3. Explain WHY this date works for this specific couple.
4. Classify the location type (e.g., "Outdoors", "Restaurant", "Activity", "Home").
5. YOU MUST RESPOND IN VALID JSON FORMAT with three keys: "idea" (the activity), "explanation" (why), and "locationType".
`;

    if (process.env.OPENROUTER_API_KEY === "dummy-openrouter-key") {
       return {
         idea: "Pottery Class and Wine",
         explanation: "Hands-on activity builds chemistry.",
         locationType: "Activity",
         newBalance: updatedUser.creditBalance
       };
    }

    const completion = await openrouter.chat.completions.create({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: "Give me a date idea." },
      ],
      model: WINGMAN_MODEL,
      response_format: { type: "json_object" }
    });

    const aiContent = completion.choices[0]?.message?.content;

    if (aiContent) {
        await logUsage({ userId: user._id, action: "date_idea_generation", cost: COST, metadata: { girlId } });

        // Check for Low Balance
        checkAndNotifyLowBalance(updatedUser).catch(err => logger.error("Background Low Balance Check Error", err));

        const gamificationResult = await updateGamification(updatedUser);
        const newBadges = gamificationResult?.newBadges || [];

        try {
            const parsed = JSON.parse(aiContent);
            return {
                idea: parsed.idea || "Error parsing idea",
                explanation: parsed.explanation || "No explanation provided",
                locationType: parsed.locationType || "General",
                newBadges,
                newBalance: updatedUser.creditBalance
            };
        } catch (e) {
             return {
                idea: aiContent,
                explanation: "Could not parse AI response.",
                locationType: "Unknown",
                newBadges,
                newBalance: updatedUser.creditBalance
            };
        }
    }

    await refundCredits(user._id.toString(), COST);
    return {
        idea: "Error generating idea.",
        explanation: "AI failure.",
        locationType: "Error"
    };

    } catch (apiError) {
        await refundCredits(user._id.toString(), COST);
        throw apiError;
    }

  } catch (error) {
    logger.error("Date Idea Error:", error);
    return {
        idea: "Error generating idea.",
        explanation: "Something went wrong.",
        locationType: "Error"
    };
  }
}
