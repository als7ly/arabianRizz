"use server";

import { openai } from "../openai";
import { getContext } from "./rag.actions";
import { getGirlById } from "./girl.actions";
import { extractTextFromImage } from "./ocr.actions";

export async function generateWingmanReply(girlId: string, userMessage: string) {
  try {
    // 1. Fetch Girl Details
    const girl = await getGirlById(girlId);

    // 2. Fetch Context (RAG)
    const contextMessages = await getContext(girlId, userMessage);
    const contextString = JSON.stringify(contextMessages);

    // 3. Construct System Prompt
    const dialectInstruction = girl.dialect 
        ? `She speaks the ${girl.dialect} Arabic dialect. You MUST use ${girl.dialect} slang and expressions in your suggested reply if the conversation is in Arabic.`
        : "Support Arabic dialects (Egyptian, Levantine, Gulf) if the user or girl speaks them.";

    const systemPrompt = `
You are "The Wingman", an expert dating coach and master of female psychology.
Your Goal: Help the user ("The Man") hook up with the girl ("${girl.name}").
Details about her: ${girl.vibe || "Unknown"}. Status: ${girl.relationshipStatus}.

Instructions:
1. Analyze the conversation context provided.
2. Provide a DIRECT, UNCENSORED, and FLIRTY reply that the user should send.
3. Explain WHY this reply works (briefly) based on psychology.
4. ${dialectInstruction}
5. Be cool, confident, and not desperate.
6. YOU MUST RESPOND IN VALID JSON FORMAT with two keys: "reply" (the suggested message) and "explanation" (the psychology reasoning).

Context from previous messages:
${contextString}
`;

    // 4. Call LLM
    if (process.env.OPENAI_API_KEY === "dummy-key" && !process.env.OPENAI_BASE_URL) {
       return {
         reply: `(Mock Wingman): Tell her "You have a vibe that I can't quite put my finger on, but I like it."`,
         explanation: "It's mysterious and complimentary without being too eager."
       };
    }

    const completion = await openai.chat.completions.create({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `She just said/I want to say: "${userMessage}". What should I say?` },
      ],
      model: "gpt-4o",
      response_format: { type: "json_object" }
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

    if (process.env.OPENAI_API_KEY === "dummy-key" && !process.env.OPENAI_BASE_URL) {
        return {
            name: "Sarah (Mock)",
            age: 24,
            vibe: "Loves traveling, sushi, and hiking. Adventurous spirit."
        };
    }

    const completion = await openai.chat.completions.create({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Profile Text:\n${text}` },
      ],
      model: "gpt-4o",
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

export async function generateHookupLine(girlId: string) {
  try {
    const girl = await getGirlById(girlId);

    const dialectInstruction = girl.dialect
        ? `She speaks the ${girl.dialect} Arabic dialect. You MUST use ${girl.dialect} slang and expressions.`
        : "Support Arabic dialects if appropriate.";

    const systemPrompt = `
You are "The Wingman", an expert dating coach.
Your Goal: Generate a DIRECT, UNCENSORED, and FLIRTY hookup line for the user to say to "${girl.name}".
Details about her: ${girl.vibe || "Unknown"}. Status: ${girl.relationshipStatus}.

Instructions:
1. Generate a bold, spicy, and effective hookup line.
2. It should be uncensored but charming.
3. ${dialectInstruction}
4. YOU MUST RESPOND IN VALID JSON FORMAT with two keys: "line" (the suggested line) and "explanation" (why it works).
`;

    if (process.env.OPENAI_API_KEY === "dummy-key" && !process.env.OPENAI_BASE_URL) {
       return {
         line: `(Mock Hookup): "Are you a magician? Because whenever I look at you, everyone else disappears."`,
         explanation: "Classic cheesy line."
       };
    }

    const completion = await openai.chat.completions.create({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: "Give me your best hookup line for her." },
      ],
      model: "gpt-4o",
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
