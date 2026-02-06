# Developer Guide & Agent Context (AGENTS.md)

This file provides critical context for future developers (human or AI) working on the **ArabianRizz** codebase. It outlines architectural decisions, known limitations, and standard operating procedures.

## 🏗️ Project Architecture

*   **Framework:** Next.js 14 (App Router)
*   **Database:** MongoDB via Mongoose.
*   **Auth:** Clerk (User management, OAuth).
*   **Payments:** Stripe (Checkout for Credits, Billing Portal for Subscriptions).
*   **AI:** OpenRouter (Hermes 2 Mixtral for chat), OpenAI (Embeddings, DALL-E 3, TTS).
*   **Logging:** Structured JSON logging via `lib/services/logger.service.ts`.

### Key Directories
*   `lib/actions/*.ts`: **Server Actions**. These are the primary API surface for the client. They handle logic, DB access, and AI calls.
*   `lib/database/models/*.ts`: Mongoose schemas.
*   `components/shared/*.ts`: Reusable UI components.
*   `app/[locale]/(root)/*`: Main application routes (authenticated).

## 🧩 Key Decisions & "Gotchas"

### 1. Subscription Management (MVP)
*   **Context:** The `User` model does not explicitly store a `stripeCustomerId`.
*   **Workaround:** The `createCustomerPortalSession` action looks up the Stripe Customer by **email address**.
*   **Future Fix:** In a future migration, add `stripeCustomerId` to the `User` schema and populate it during the `checkout.session.completed` webhook.

### 2. Mock Email Service
*   **File:** `lib/services/email.service.ts`
*   **Status:** Currently logs email payloads to the console (`logger.info`).
*   **Action:** Before scaling, replace the body of `sendEmail` with a real provider call (Resend, SendGrid, SES).

### 3. Stripe Price IDs
*   **File:** `constants/index.ts`
*   **Status:** Contains placeholders like `price_starter_pack_placeholder`.
*   **Action:** These **MUST** be replaced with real Price IDs from the Stripe Dashboard before deploying to Production.

### 4. Content Safety
*   **Mechanism:** `checkContentSafety` in `wingman.actions.ts`.
*   **Logic:** Tries OpenAI Moderation API first. If that fails (or key is missing/dummy), falls back to a basic keyword blocklist.

### 5. Internal Analytics
*   **Mechanism:** `Event` model + `logEvent` action.
*   **Usage:** Tracks 'page_view' via `AnalyticsProvider` in the root layout.
*   **Limit:** `Event` documents have a TTL index (`expires`) of 30 days to prevent DB bloat.

## 🛠️ Development Standards

*   **Environment Variables:** Defined in `.env.local` and validated at runtime via `lib/env.ts` (Zod).
*   **Logging:** Use `logger.info/warn/error`, **not** `console.log`.
*   **Strict Mode:** All new code must be TypeScript strict compliant.

## 🚀 Deployment Checklist

1.  Set real Stripe keys in Vercel.
2.  Create Stripe Products and update `constants/index.ts`.
3.  Set `OPENAI_API_KEY` for DALL-E and Moderation.
4.  Configure `NEXT_PUBLIC_SERVER_URL` to the production domain.
