import GlobalKnowledge from "@/lib/database/models/global-knowledge.model";
import { connectToDatabase } from "@/lib/database/mongoose";
import { generateEmbedding } from "@/lib/actions/rag.actions";

export const getGlobalKnowledge = async (query: string, language: string, embedding?: number[]) => {
  try {
    await connectToDatabase();

    const queryEmbedding = embedding || await generateEmbedding(query);

    // Using MongoDB Atlas Vector Search
    // Assuming an index "global_vector_index" exists on the GlobalKnowledge collection
    // path: "embedding"

    // Note: If the index doesn't exist, this aggregation will fail.
    // In a real deployment, we'd ensure the index exists.
    // For now, I'll wrap it in a try-catch and fallback to a simple text match or recent items if it fails.

    try {
        const results = await GlobalKnowledge.aggregate([
          {
            $vectorSearch: {
              index: "vector_index",
              path: "embedding",
              queryVector: queryEmbedding,
              numCandidates: 100,
              limit: 3,
              filter: {
                status: 'approved',
                language: language
              }
            }
          } as any,
          {
            $project: {
              _id: 0,
              content: 1,
              score: { $meta: "vectorSearchScore" }
            }
          }
        ]);

        if (results.length > 0) return results;

    } catch (vectorError) {
        console.warn("Vector search failed (index missing?), falling back to basic query.", vectorError);
    }

    // Fallback: Just return recent approved tips for this language
    const fallbackResults = await GlobalKnowledge.find({ status: 'approved', language })
        .sort({ createdAt: -1 })
        .limit(3)
        .select('content -_id')
        .lean();

    return fallbackResults;

  } catch (error) {
    console.error("Global Knowledge RAG Error:", error);
    return [];
  }
};
