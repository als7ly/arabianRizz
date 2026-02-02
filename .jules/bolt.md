## 2024-05-23 - Missing Database Indexes
**Learning:** MongoDB does not automatically index foreign keys. The `Message` collection is queried frequently by `girl` (foreign key) and sorted by `createdAt`, but lacks an index. This leads to collection scans which will degrade performance as the chat history grows.
**Action:** Always check schema definitions for foreign keys and common query patterns (filter + sort) and add compound indexes where appropriate.
