import GlobalKnowledge from "@/lib/database/models/global-knowledge.model";
import { connectToDatabase } from "@/lib/database/mongoose";

export async function getRandomTip(language: string) {
  try {
    await connectToDatabase();
    // Using sample aggregation to get a random tip
    const tips = await GlobalKnowledge.aggregate([
      { $match: { status: 'approved', language: language } },
      { $sample: { size: 1 } }
    ]);

    if (tips.length > 0) {
        return JSON.parse(JSON.stringify(tips[0]));
    }
    return null;
  } catch (error) {
    console.error("Get Random Tip Error:", error);
    return null;
  }
}
