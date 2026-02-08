## 2024-05-23 - Missing Database Indexes
**Learning:** MongoDB does not automatically index foreign keys. The `Message` collection is queried frequently by `girl` (foreign key) and sorted by `createdAt`, but lacks an index. This leads to collection scans which will degrade performance as the chat history grows.
**Action:** Always check schema definitions for foreign keys and common query patterns (filter + sort) and add compound indexes where appropriate.

## 2024-05-24 - Missing Transaction Index
**Learning:** The `Transaction` collection was also missing an index on the `buyer` field, despite being frequently queried by user ID and sorted by date. This confirms the pattern of missing indexes on foreign keys across the codebase.
**Action:** Systematically audit all models for foreign key references and verify if they are part of common query patterns (especially with sorts).

## 2024-05-25 - Redundant Embeddings in Parallel Requests
**Learning:** `generateWingmanReply` was calling `getContext`, `getUserContext`, and `getGlobalKnowledge` in parallel. Each function independently generated an embedding for the same user message, resulting in 3x OpenAI API calls and latency.
**Action:** When making multiple RAG calls for the same query, generate the embedding once and pass it as an optional argument to retrieval functions.
