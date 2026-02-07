## 2024-05-23 - Missing Database Indexes
**Learning:** MongoDB does not automatically index foreign keys. The `Message` collection is queried frequently by `girl` (foreign key) and sorted by `createdAt`, but lacks an index. This leads to collection scans which will degrade performance as the chat history grows.
**Action:** Always check schema definitions for foreign keys and common query patterns (filter + sort) and add compound indexes where appropriate.

## 2024-05-24 - Missing Transaction Index
**Learning:** The `Transaction` collection was also missing an index on the `buyer` field, despite being frequently queried by user ID and sorted by date. This confirms the pattern of missing indexes on foreign keys across the codebase.
**Action:** Systematically audit all models for foreign key references and verify if they are part of common query patterns (especially with sorts).
