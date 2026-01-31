"use server";

import { openai } from "../openai";
import { openrouter, WINGMAN_MODEL } from "../openrouter";
import { getContext } from "./rag.actions";
import { getUserContext } from "./user-knowledge.actions";
import { getGirlById } from "./girl.actions";
import { extractTextFromImage } from "./ocr.actions";
import Message from "../database/models/message.model";
import { connectToDatabase } from "../database/mongoose";

export async function submitFeedback(messageId: string, feedback: 'positive' | 'negative') {
  try {
    await connectToDatabase();
    await Message.findByIdAndUpdate(messageId, { feedback });
    return { success: true };
  } catch (error) {
    console.error("Feedback Error:", error);
    return { success: false };
  }
}

export async function generateWingmanReply(girlId: string, userMessage: string, tone: string = "Flirty") {
  try {
    // 1. Fetch Girl Details
    const girl = await getGirlById(girlId);

    // 2. Fetch Context (RAG - Girl)
    const contextMessages = await getContext(girlId, userMessage);
    const contextString = JSON.stringify(contextMessages);

    // 3. Fetch Context (RAG - User)
    // girl.author is the MongoDB ObjectId of the user
    const userContext = await getUserContext(girl.author.toString(), userMessage);
    const userContextString = userContext.map((k: any) => k.content).join("\n");

    // 4. Construct System Prompt
    const dialectInstruction = girl.dialect 
        ? `She speaks the ${girl.dialect} Arabic dialect. You MUST use ${girl.dialect} slang and expressions in your suggested reply if the conversation is in Arabic.`
        : "Support Arabic dialects (Egyptian, Levantine, Gulf) if the user or girl speaks them.";

    const systemPrompt = `
You are "The Wingman", an expert dating coach and master of female psychology.
Your Goal: Help the user ("The Man") hook up with the girl ("${girl.name}").
Details about her: ${girl.vibe || "Unknown"}. Status: ${girl.relationshipStatus}.
Tone requested: ${tone}.

Context about The User ("Me"):
${userContextString || "No specific details provided."}

Instructions:
1. Analyze the conversation context provided.
2. Provide a DIRECT, UNCENSORED, and ${tone.toUpperCase()} reply that the user should send.
3. Explain WHY this reply works (briefly) based on psychology.
4. ${dialectInstruction}
5. Be cool, confident, and not desperate.
6. YOU MUST RESPOND IN VALID JSON FORMAT with two keys: "reply" (the suggested message) and "explanation" (the psychology reasoning).

Context from previous messages:
${contextString}
`;

    // 4. Call LLM (OpenRouter Uncensored)
    if (process.env.OPENROUTER_API_KEY === "dummy-openrouter-key" && !process.env.OPENAI_BASE_URL) {
       // Fallback mock if key missing
       return {
         reply: `(Mock Wingman - ${tone}): Tell her "You have a vibe that I can't quite put my finger on, but I like it."`,
         explanation: "It's mysterious and complimentary without being too eager."
       };
    }

    const completion = await openrouter.chat.completions.create({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `She just said/I want to say: "${userMessage}". What should I say?` },
      ],
      model: WINGMAN_MODEL,
      // Many OpenRouter models support JSON mode, but not all. Hermes does.
      response_format: { type: "json_object" },
    });

    const aiContent = completion.choices[0]?.message?.content;

    if (aiContent) {
        try {
            const parsed = JSON.parse(aiContent);
            return {
                reply: parsed.reply || "Error parsing reply",
                explanation: parsed.explanation || "No explanation provided"
            };
        } catch (e) {
            console.error("JSON Parse Error:", e);
            return {
                reply: aiContent, // Fallback to raw content if not JSON
                explanation: "Could not parse AI response."
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
    // 1. OCR
    const text = await extractTextFromImage(imageUrl);
    if (!text) return null;

    // 2. AI Analysis
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

    // Use OpenRouter for analysis too to keep it consistent
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

    // Check if data exists and has length
    if (response.data && response.data.length > 0) {
        return response.data[0].url;
    }
    return null;
  } catch (error) {
    console.error("Image Gen Error:", error);
    return null;
  }
}

export async function generateSpeech(text: string) {
  try {
    if (process.env.OPENAI_API_KEY === "dummy-key" && !process.env.OPENAI_BASE_URL) {
        return null; // Mock fallback not implemented for audio
    }

    const mp3 = await openai.audio.speech.create({
      model: "tts-1",
      voice: "onyx",
      input: text,
    });

    const buffer = Buffer.from(await mp3.arrayBuffer());
    const base64 = buffer.toString('base64');
    return `data:audio/mp3;base64,${base64}`;

  } catch (error) {
    console.error("Speech Gen Error:", error);
    return null;
  }
}

export async function generateHookupLine(girlId: string) {
  try {
    const girl = await getGirlById(girlId);

    // Fetch User Context
    const userContext = await getUserContext(girl.author.toString(), "hookup line flirting");
    const userContextString = userContext.map((k: any) => k.content).join("\n");

    const dialectInstruction = girl.dialect
        ? `She speaks the ${girl.dialect} Arabic dialect. You MUST use ${girl.dialect} slang and expressions.`
        : "Support Arabic dialects if appropriate.";

    const systemPrompt = `
You are "The Wingman", an expert dating coach.
Your Goal: Generate a DIRECT, UNCENSORED, and FLIRTY hookup line for the user to say to "${girl.name}".
Details about her: ${girl.vibe || "Unknown"}. Status: ${girl.relationshipStatus}.

Context about The User:
${userContextString}

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
