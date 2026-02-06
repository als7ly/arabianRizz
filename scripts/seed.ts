
import { connectToDatabase } from '../lib/database/mongoose';
import GlobalKnowledge from '../lib/database/models/global-knowledge.model';
import { openai } from '../lib/openai';

const SEED_DATA = [
    {
        content: "When she mentions her favorite food, offer to cook it for her or take her to a place that serves it best. It shows you listen.",
        language: "en",
        tags: ["dating-tip", "first-date"],
        sourceUrl: "system-seed"
    },
    {
        content: "Confidence is key. Maintain eye contact, but don't stare. Smile naturally.",
        language: "en",
        tags: ["body-language", "dating-tip"],
        sourceUrl: "system-seed"
    },
    {
        content: "If she replies with short answers, change the topic to something more open-ended like 'What's the most spontaneous thing you've done lately?'",
        language: "en",
        tags: ["conversation-starter", "dating-tip"],
        sourceUrl: "system-seed"
    }
];

async function generateEmbedding(text: string) {
    try {
        if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'dummy-key') {
            console.warn("⚠️ No valid OPENAI_API_KEY found. Using mock embedding.");
            return new Array(1536).fill(0.01);
        }
        const response = await openai.embeddings.create({
            model: "text-embedding-3-small",
            input: text,
        });
        return response.data[0].embedding;
    } catch (error) {
        console.warn("⚠️ Failed to generate embedding. Using mock embedding. Error:", error);
        return new Array(1536).fill(0.01);
    }
}

async function seed() {
    console.log("🌱 Starting seeding...");
    try {
        await connectToDatabase();

        for (const item of SEED_DATA) {
            const exists = await GlobalKnowledge.findOne({ content: item.content });
            if (exists) {
                console.log(`Skipping (already exists): ${item.content.substring(0, 30)}...`);
                continue;
            }

            console.log(`Generating embedding for: ${item.content.substring(0, 30)}...`);
            const embedding = await generateEmbedding(item.content);

            await GlobalKnowledge.create({
                ...item,
                embedding,
                status: 'approved'
            });
            console.log(`Inserted: ${item.content.substring(0, 30)}...`);
        }

        console.log("✅ Seeding complete.");
        process.exit(0);
    } catch (error) {
        console.error("❌ Seeding failed:", error);
        process.exit(1);
    }
}

seed();
