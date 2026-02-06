# ArabianRizz 🧞‍♂️ - Production & Monetization Roadmap

This document outlines the current state of the codebase, missing features required for a production launch, and a strategic monetization plan.

## 1. Implemented Features Audit

### ✅ Core AI Wingman
*   **Engine:** `lib/actions/wingman.actions.ts` successfully integrates OpenRouter (Hermes 2 Mixtral) for uncensored replies.
*   **RAG System:** Retrieves context from Conversation History (`rag.actions.ts`), User Persona (`user-knowledge.actions.ts`), and Global Knowledge Base (`global-rag.actions.ts`).
*   **Dialect Support:** Explicit logic for Arabic dialects handling.
*   **Ownership:** `verifyOwnership` middleware ensures data privacy.
*   **Safety Filter:** Basic content moderation using keyword blocking implemented in `wingman.actions.ts`.

### ✅ Rich Chat Interface
*   **Media:** Support for text, generated images (DALL-E 3), and audio messages (OpenAI TTS).
*   **Actions:** Quick Actions (Roast, Date Idea), Saved Lines, and "Copy to Clipboard".
*   **UI:** Polished React components using Tailwind CSS and Radix UI (`ChatInterface.tsx`, `MessageBubble.tsx`).
*   **Resilience:** `ChatErrorBoundary` prevents white-screen crashes.

### ✅ Payments (Basic)
*   **Integration:** Stripe Checkout implemented for one-time payments (`checkoutCredits`).
*   **Webhooks:** Enhanced webhook listener at `app/api/webhooks/stripe/route.ts` handling `checkout.session.completed` and `invoice.payment_succeeded` using Price ID matching (with fallback).
*   **Billing UI:** Transaction history visible on Profile page.
*   **Subscription Management:** Stripe Customer Portal implemented for managing subscriptions (`createCustomerPortalSession`).

### ✅ Infrastructure
*   **Database:** MongoDB Mongoose schemas defined for `User`, `Girl`, `Message`, `Transaction`.
*   **Localization:** `next-intl` set up for 10+ languages.
*   **Admin:** Back-end actions for crawling and knowledge management exist.
*   **Legal:** Terms of Service and Privacy Policy pages created.
*   **Age Verification:** Client-side 18+ gate modal implemented.
*   **Env Validation:** Strict Zod schema (`lib/env.ts`) ensures strict environment variable validation at startup.

---

## 2. Production Readiness Checklist (Remaining Items)

Before launching, the following items **should** be addressed:

### 🟡 User Experience (UX)
1.  **Email Notifications:** Send receipt emails or "Low Balance" alerts via Resend or SendGrid.

### 🟡 DevOps
2.  **Logging:** Implement structured logging (e.g., Sentry) for production error tracking.

---

## 3. Monetization Plan

A hybrid model maximizing revenue from both casual users and power users.

### 💎 Currency: "Rizz Credits"
Used for high-value AI actions.
*   **Wingman Reply:** 1 Credit
*   **Hookup Line:** 1 Credit
*   **Image Generation:** 3 Credits
*   **Audio Message:** 1 Credit

### 📦 One-Time Packs (Consumable)
*Target: Casual users who need a quick fix for a specific date.*

| Pack Name | Price | Credits | CPM (Cost Per Msg) |
| :--- | :--- | :--- | :--- |
| **Starter Pack** | $9.99 | 100 | $0.10 |
| **Playboy Pack** | $19.99 | 250 | $0.08 |
| **Rizz God Pack** | $49.99 | 1000 | $0.05 |

### 👑 Subscription: "Pro Wingman" (Recurring)
*Target: Power users active on multiple dating apps.*

**Price:** $29.99 / month

**Benefits:**
1.  **Monthly Allowance:** 500 Credits (Value: $40).
2.  **Daily Streak Bonus:** 2x Login Bonus.
3.  **Priority Generation:** Skip the queue during high traffic.
4.  **"My Persona" Unlimited:** Unlimited storage for RAG context (vs. 50 entries limit for free users).

### 🚀 Upsell Opportunities
*   **Low Balance Trigger:** Send an email/push notification when credits drop below 10.
*   **"Unlock Dialect":** Charge a small fee (or locked behind Pro) for specific niche dialects (e.g., specific country slang).

---

## 4. Technical Implementation Steps

1.  **Stripe Setup:**
    *   Create Products in Stripe Dashboard corresponding to the Packs and Subscription.
    *   Copy `price_` IDs to `constants/index.ts`.
2.  **Frontend:**
    *   Update `Checkout.tsx` to support `mode: 'subscription'`.
    *   Create `SubscriptionStatus.tsx` component.
3.  **Backend:**
    *   Refactor `api/webhooks/stripe` to handle `customer.subscription.created/deleted` events robustly.
