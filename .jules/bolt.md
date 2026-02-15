## 2024-05-23 - Missing Database Indexes
**Learning:** MongoDB does not automatically index foreign keys. The `Message` collection is queried frequently by `girl` (foreign key) and sorted by `createdAt`, but lacks an index. This leads to collection scans which will degrade performance as the chat history grows.
**Action:** Always check schema definitions for foreign keys and common query patterns (filter + sort) and add compound indexes where appropriate.

## 2024-05-24 - Missing Transaction Index
**Learning:** The `Transaction` collection was also missing an index on the `buyer` field, despite being frequently queried by user ID and sorted by date. This confirms the pattern of missing indexes on foreign keys across the codebase.
**Action:** Systematically audit all models for foreign key references and verify if they are part of common query patterns (especially with sorts).

## 2024-05-25 - Redundant Embeddings in Parallel Requests
**Learning:** `generateWingmanReply` was calling `getContext`, `getUserContext`, and `getGlobalKnowledge` in parallel. Each function independently generated an embedding for the same user message, resulting in 3x OpenAI API calls and latency.
**Action:** When making multiple RAG calls for the same query, generate the embedding once and pass it as an optional argument to retrieval functions.

## 2024-05-26 - Unified Embedding for Similar Contexts
**Learning:** In `generateHookupLine`, `getUserContext` and `getGlobalKnowledge` were called with slightly different but semantically similar queries ("hookup line flirting" vs "best hookup lines dating advice"). This forced two separate embedding API calls. By combining them into a single query "best hookup lines flirting dating advice", we can reuse one embedding for both retrievals without significant loss of accuracy, saving 50% of embedding costs and API calls.
**Action:** Identify parallel RAG retrievals with similar intents and unify their query strings to share a single embedding vector.

## 2024-05-27 - Large Vector Embeddings in Default Queries
**Learning:** Mongoose fetches all fields by default, including large arrays like vector embeddings (1536 floats, ~12KB). This causes significant overhead in queries that list messages or history (e.g., `Message.find()`) where the embedding is not needed. This impacts page load time and memory usage.
**Action:** Always add `select: false` to large vector embedding fields in Mongoose schemas to ensure they are excluded by default and only fetched when explicitly projected (e.g., in vector search aggregations).
