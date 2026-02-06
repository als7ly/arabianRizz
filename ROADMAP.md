# ArabianRizz 🧞‍♂️ - Production & Monetization Roadmap

This document outlines the current state of the codebase, missing features required for a production launch, and a strategic monetization plan.

## 1. Implemented Features Audit

### ✅ Core AI Wingman
*   **Engine:** `lib/actions/wingman.actions.ts` successfully integrates OpenRouter (Hermes 2 Mixtral) for uncensored replies.
*   **RAG System:** Retrieves context from Conversation History (`rag.actions.ts`), User Persona (`user-knowledge.actions.ts`), and Global Knowledge Base (`global-rag.actions.ts`).
*   **Dialect Support:** Explicit logic for Arabic dialects handling.
*   **Ownership:** `verifyOwnership` middleware ensures data privacy.

### ✅ Rich Chat Interface
*   **Media:** Support for text, generated images (DALL-E 3), and audio messages (OpenAI TTS).
*   **Actions:** Quick Actions (Roast, Date Idea), Saved Lines, and "Copy to Clipboard".
*   **UI:** Polished React components using Tailwind CSS and Radix UI (`ChatInterface.tsx`, `MessageBubble.tsx`).

### ✅ Payments (Basic)
*   **Integration:** Stripe Checkout implemented for one-time payments (`checkoutCredits`).
*   **Webhooks:** Basic webhook listener at `app/api/webhooks/stripe/route.ts` handling `checkout.session.completed`.

### ✅ Infrastructure
*   **Database:** MongoDB Mongoose schemas defined for `User`, `Girl`, `Message`, `Transaction`.
*   **Localization:** `next-intl` set up for 10+ languages.
*   **Admin:** Back-end actions for crawling and knowledge management exist.

---

## 2. Production Readiness Checklist (Critical Missing Items)

Before launching, the following items **must** be addressed:

### 🔴 Critical Reliability
1.  **Stripe Webhook Hardening:** The current `invoice.payment_succeeded` logic "guesses" the plan based on the amount paid. This is fragile.
    *   *Fix:* Update `constants/index.ts` to include real Stripe Price IDs and match against `invoice.lines.data[0].price.id`.
2.  **Env Variable Safety:** Code currently contains logic checking for `dummy-key`. Ensure strictly validated environment variables in Production.

### 🔴 Legal & Compliance
3.  **Legal Pages:** Missing `app/[locale]/(root)/terms/page.tsx` and `privacy/page.tsx`. Required by Stripe.
4.  **Age Verification:** Ensure there is a clear "18+" gate on the landing page or signup.
5.  **Content Moderation:** While "Uncensored", illegal content must be blocked. Implement a safety filter (e.g., checking for CSAM/Violence keywords) to protect the platform.

### 🔴 User Experience (UX)
6.  **Error Boundaries:** Wrap `ChatInterface` in a React Error Boundary to prevent white-screen crashes.
7.  **Subscription Management:** No UI for users to view or cancel their active subscriptions. Add a "Billing" tab to `/profile`.

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
