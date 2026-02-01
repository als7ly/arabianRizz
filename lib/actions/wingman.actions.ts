"use server";

import { openai } from "../openai";
import { openrouter, WINGMAN_MODEL } from "../openrouter";
import { getContext } from "./rag.actions";
import { getUserContext } from "./user-knowledge.actions";
import { getGlobalKnowledge } from "./global-rag.actions";
import { getGirlById } from "./girl.actions";
import { extractTextFromImage } from "./ocr.actions";
import Message from "../database/models/message.model";
import { connectToDatabase } from "../database/mongoose";
import { auth } from "@clerk/nextjs";
import User from "../database/models/user.model";
import GlobalKnowledge from "../database/models/global-knowledge.model";
import { v2 as cloudinary } from 'cloudinary';
import { Readable } from 'stream';
import { updateGamification } from "./gamification.actions";

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

async function verifyOwnership(girlAuthorId: any) {
    const { userId: clerkId } = auth();
    if (!clerkId) throw new Error("Unauthorized");

    await connectToDatabase();
    const user = await User.findOne({ clerkId });
    if (!user) throw new Error("User not found");

    if (girlAuthorId.toString() !== user._id.toString()) {
        throw new Error("Unauthorized Access");
    }
    return user;
}

export async function submitFeedback(messageId: string, feedback: 'positive' | 'negative') {
  try {
    await connectToDatabase();
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
            status: 'approved',
            tags: ['user-feedback', 'auto-learned']
        });
    }

    return { success: true };
  } catch (error) {
    console.error("Feedback Error:", error);
    return { success: false };
  }
}

export async function generateWingmanReply(girlId: string, userMessage: string, tone: string = "Flirty") {
  try {
    // Security: Validate tone to prevent prompt injection
    const ALLOWED_TONES = ['Flirty', 'Funny', 'Serious', 'Mysterious'];
    const safeTone = ALLOWED_TONES.includes(tone) ? tone : 'Flirty';

    const girl = await getGirlById(girlId);
    const user = await verifyOwnership(girl.author);

    if (user.creditBalance < 1) {
        return {
            reply: "You are out of credits! Please top up to continue.",
            explanation: "Insufficient credits."
        };
    }

    const contextMessages = await getContext(girlId, userMessage);
    const contextString = JSON.stringify(contextMessages);

    const userContext = await getUserContext(girl.author.toString(), userMessage);
    const userContextString = userContext.map((k: any) => k.content).join("\n");

    const arabicPattern = /[\u0600-\u06FF]/;
    const isArabic = arabicPattern.test(userMessage) || (girl.dialect && girl.dialect !== 'English');
    const language = isArabic ? 'ar' : 'en';

    const globalKnowledge = await getGlobalKnowledge(userMessage, language);
    const globalContextString = globalKnowledge.map((k: any) => k.content).join("\n");

    const dialectInstruction = girl.dialect 
        ? `She speaks the ${girl.dialect} Arabic dialect. You MUST use ${girl.dialect} slang and expressions in your suggested reply if the conversation is in Arabic.`
        : "Support Arabic dialects (Egyptian, Levantine, Gulf) if the user or girl speaks them.";

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

    const completion = await openrouter.chat.completions.create({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `She just said/I want to say: "${userMessage}". What should I say?` },
      ],
      model: WINGMAN_MODEL,
      response_format: { type: "json_object" },
    });

    const aiContent = completion.choices[0]?.message?.content;

    if (aiContent) {
        // Deduct Credit on Success
        await User.findByIdAndUpdate(user._id, { $inc: { creditBalance: -1 } });

        // Update Gamification Stats
        const gamificationResult = await updateGamification(user._id);
        const newBadges = gamificationResult?.newBadges || [];

        try {
            const parsed = JSON.parse(aiContent);
            return {
                reply: parsed.reply || "Error parsing reply",
                explanation: parsed.explanation || "No explanation provided",
                newBadges // Include badges in response
            };
        } catch (e) {
            console.error("JSON Parse Error:", e);
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

  } catch (error) {
    console.error("Wingman Error:", error);
    return {
        reply: "Error generating reply.",
        explanation: "Something went wrong with the AI."
    };
  }
}

export async function analyzeProfile(imageUrl: string) {
  try {
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
            console.error("JSON Parse Error:", e);
            return null;
        }
    }
    return null;

  } catch (error) {
    console.error("Analyze Profile Error:", error);
    return null;
  }
}

export async function generateResponseImage(prompt: string) {
  try {
    if (process.env.OPENAI_API_KEY === "dummy-key" && !process.env.OPENAI_BASE_URL) {
        return "https://via.placeholder.com/1024x1024.png?text=Mock+AI+Image";
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
    console.error("Image Gen Error:", error);
    return null;
  }
}

export async function generateSpeech(text: string, voiceId: string = "nova", messageId?: string) {
  try {
    if (process.env.OPENAI_API_KEY === "dummy-key" && !process.env.OPENAI_BASE_URL) {
        return null;
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
        console.error("Cloudinary Upload Error:", uploadError);
        // Fallback to Base64 if upload fails, so the user still hears it
        const base64 = buffer.toString('base64');
        return `data:audio/mp3;base64,${base64}`;
    }

  } catch (error) {
    console.error("Speech Gen Error:", error);
    return null;
  }
}

export async function generateHookupLine(girlId: string) {
  try {
    const girl = await getGirlById(girlId);

    const user = await verifyOwnership(girl.author);

    if (user.creditBalance < 1) {
         return {
            line: "You are out of credits! Please top up.",
            explanation: "Insufficient credits."
        };
    }

    const userContext = await getUserContext(girl.author.toString(), "hookup line flirting");
    const userContextString = userContext.map((k: any) => k.content).join("\n");

    const dialectInstruction = girl.dialect
        ? `She speaks the ${girl.dialect} Arabic dialect. You MUST use ${girl.dialect} slang and expressions.`
        : "Support Arabic dialects if appropriate.";

    const language = (girl.dialect && girl.dialect !== 'English') ? 'ar' : 'en';
    const globalKnowledge = await getGlobalKnowledge("best hookup lines dating advice", language);
    const globalContextString = globalKnowledge.map((k: any) => k.content).join("\n");

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
        await User.findByIdAndUpdate(user._id, { $inc: { creditBalance: -1 } });
        await updateGamification(user._id);

        try {
            const parsed = JSON.parse(aiContent);
            return {
                line: parsed.line || parsed.reply || "Error parsing line",
                explanation: parsed.explanation || "No explanation provided"
            };
        } catch (e) {
             return {
                line: aiContent,
                explanation: "Could not parse AI response."
            };
        }
    }

    return {
        line: "Error generating line.",
        explanation: "AI failure."
    };

  } catch (error) {
    console.error("Hookup Line Error:", error);
    return {
        line: "Error generating line.",
        explanation: "Something went wrong."
    };
  }
}
