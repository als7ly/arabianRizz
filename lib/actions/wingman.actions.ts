"use server";

import { openai } from "../openai";
import { openrouter, WINGMAN_MODEL } from "../openrouter";
import { generateEmbedding } from "../services/rag.service";
import { getContext } from "./rag.actions";
import { getUserContext } from "./user-knowledge.actions";
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
import { deductCredits } from "./user.actions";
import { logUsage } from "./usage-log.actions";

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
        User.findOne({ clerkId }),
        Girl.findById(girlId)
    ]);

    if (!user) throw new Error("User not found");
    if (!girl) throw new Error("Girl not found");

    if (girl.author.toString() !== user._id.toString()) {
        throw new Error("Unauthorized Access");
    }

    return { user, girl };
}

// Low Balance Check Utility
async function checkAndNotifyLowBalance(user: any) {
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
    }

    return { success: true };
  } catch (error) {
    logger.error("Feedback Error:", error);
    return { success: false };
  }
}

export async function generateWingmanReply(girlId: string, userMessage: string, tone: string = "Flirty", senderRole: "user" | "girl" | "instruction" = "user") {
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

    if (user.creditBalance < 1) {
        return {
            reply: "You are out of credits! Please top up to continue.",
            explanation: "Insufficient credits."
        };
    }

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
      getContext(girlId, userMessage, embedding),
      getUserContext(girl.author.toString(), userMessage, embedding),
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
${userContextString || "No specific details provided."}

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
        // Deduct Credit on Success
        const updatedUser = await deductCredits(user._id, 1);
        await logUsage({ userId: user._id, action: "message_generation", cost: 1, metadata: { girlId } });

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
                newBadges // Include badges in response
            };
        } catch (e) {
            logger.error("JSON Parse Error:", e);
            return {
                reply: aiContent,
                explanation: "Could not parse AI response.",
                newBadges
            };
        }
    }

    return {
      reply: "Error: No response from AI.",
      explanation: "Something went wrong."
    };

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
            return JSON.parse(aiContent);
        } catch (e) {
            logger.error("JSON Parse Error:", e);
            return null;
        }
    }
    return null;

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

    // Safety Check for Image Generation
    const isSafe = await checkContentSafety(prompt);
    if (!isSafe) {
        logger.warn("Content safety violation blocked in image gen", { prompt });
        return "https://via.placeholder.com/1024x1024.png?text=Content+Violation";
    }

    const response = await openai.images.generate({
      model: "dall-e-3",
      prompt: prompt,
      n: 1,
      size: "1024x1024",
    });

    if (response.data && response.data.length > 0) {
        return response.data[0].url;
    }
    return null;
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

    // Security Check: If associating with a message, ensure user owns the girl.
    if (messageId) {
        await connectToDatabase();
        const message = await Message.findById(messageId);
        if (message) {
             // This will throw Unauthorized if user is not author
             await getGirlById(message.girl.toString());
        } else {
             // If messageId provided but not found, maybe stop?
             // Or proceed without linking? Safer to stop or return null to prevent confusion.
             return null;
        }
    }

    // 1. Generate Speech via OpenAI
    const voice = voiceId as "alloy" | "echo" | "fable" | "onyx" | "nova" | "shimmer";
    const mp3 = await openai.audio.speech.create({
      model: "tts-1",
      voice: voice,
      input: text,
    });

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

        return audioUrl;

    } catch (uploadError) {
        logger.error("Cloudinary Upload Error:", uploadError);
        // Fallback to Base64 if upload fails, so the user still hears it
        const base64 = buffer.toString('base64');
        return `data:audio/mp3;base64,${base64}`;
    }

  } catch (error) {
    logger.error("Speech Gen Error:", error);
    return null;
  }
}

export async function generateHookupLine(girlId: string) {
  try {
    const { user, girl } = await getUserAndGirl(girlId);

    if (user.creditBalance < 1) {
         return {
            line: "You are out of credits! Please top up.",
            explanation: "Insufficient credits."
        };
    }

    const language = (girl.dialect && girl.dialect !== 'English') ? 'ar' : 'en';

    const [userContext, globalKnowledge] = await Promise.all([
      getUserContext(girl.author.toString(), "hookup line flirting"),
      getGlobalKnowledge("best hookup lines dating advice", language)
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
${userContextString}

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
        const updatedUser = await deductCredits(user._id, 1);
        await logUsage({ userId: user._id, action: "hookup_line", cost: 1, metadata: { girlId } });

        // Check for Low Balance
        checkAndNotifyLowBalance(updatedUser).catch(err => logger.error("Background Low Balance Check Error", err));

        const gamificationResult = await updateGamification(updatedUser);
        const newBadges = gamificationResult?.newBadges || [];

        try {
            const parsed = JSON.parse(aiContent);
            return {
                line: parsed.line || parsed.reply || "Error parsing line",
                explanation: parsed.explanation || "No explanation provided",
                newBadges
            };
        } catch (e) {
             return {
                line: aiContent,
                explanation: "Could not parse AI response.",
                newBadges
            };
        }
    }

    return {
        line: "Error generating line.",
        explanation: "AI failure."
    };

  } catch (error) {
    logger.error("Hookup Line Error:", error);
    return {
        line: "Error generating line.",
        explanation: "Something went wrong."
    };
  }
}
