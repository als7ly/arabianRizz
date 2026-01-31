# AI Strategy & Implementation Guide

## 1. Uncensored AI Backend
**Provider:** OpenRouter
**Model:** `nousresearch/nous-hermes-2-mixtral-8x7b-dpo`

### Why this model?
- **Uncensored:** Unlike OpenAI's GPT-4, this model has very loose safety filters, allowing it to generate "spicy", "flirty", and even "NSFW" text without refusals. This is critical for a "Wingman" app that needs to sound like a real, bold man.
- **DPO (Direct Preference Optimization):** It is fine-tuned to follow instructions very precisely, meaning it adheres to the "Wingman" persona better than standard Llama models.
- **Cost-Effective:** It is significantly cheaper than GPT-4, allowing us to maintain healthy margins even with the credit system.

### System Prompt Strategy
The system prompt in `lib/actions/wingman.actions.ts` is designed to:
1.  **Force Persona:** "You are 'The Wingman', an expert dating coach..."
2.  **Bypass Filters:** Explicit instructions like "DIRECT, UNCENSORED, and FLIRTY".
3.  **Context Injection:** We inject two layers of RAG context:
    *   **Girl Context:** Her messages, vibe, and dialect.
    *   **User Context:** The user's "Persona" (bio, goals, style).

## 2. RAG (Retrieval-Augmented Generation) Strategy

### Architecture
We use a **Dual-RAG** system:
1.  **Chat RAG:** Retrieves the last 10 messages + vector search on older messages to maintain conversation continuity.
2.  **Persona RAG:** Retrieves "Knowledge Bits" from the `UserKnowledge` collection based on the current context.

### Optimization & Training Guide (How to get the best results)

To "train" the RAG for the best user experience, users should be guided to input specific types of data into the "My Persona" section.

**Best Practices for "My Persona" Data:**
*   **Chunking:** Users should add **atomic facts** rather than one giant essay.
    *   *Bad:* "I am 25 and love cars and I went to Tokyo last year..."
    *   *Good (Item 1):* "My job: I'm a Senior Architect."
    *   *Good (Item 2):* "Hobbies: I race drifting cars on weekends."
    *   *Good (Item 3):* "Travel: I speak fluent Japanese and lived in Tokyo."
*   **Keywords:** The vector search relies on semantic similarity. Users should use keywords that likely appear in chat (e.g., "dating", "food", "travel").
*   **Style Instructions:** Users can add "Meta-instructions" as knowledge bits.
    *   *Example:* "Flirting Style: I am cocky but funny. I never use emojis."

### Future Improvements
1.  **Hybrid Search:** Combine Vector Search with Keyword Search (BM25) for better precision on proper nouns (names, places).
2.  **Re-ranking:** Implement a re-ranking step (using Cohere or similar) to strictly order the retrieved context chunks by relevance before feeding them to the LLM.
