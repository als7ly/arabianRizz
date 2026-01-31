# Testing Guide

Since this project requires external APIs (OpenRouter, Stripe, Clerk, MongoDB), extensive manual testing is recommended before production deployment.

## 1. Local Development Setup
Run the following commands to start the project locally:
```bash
pnpm install
pnpm dev
```

## 2. Automated Tests
Run the unit test suite:
```bash
pnpm test
```
*Note: Ensure `jest.config.js` and `jest.setup.js` are correctly configured if adding new tests.*

## 3. Manual QA Checklist (Sanity Check)

### Authentication
- [ ] Sign up with a new email via Clerk.
- [ ] Verify that a new User document is created in MongoDB (`users` collection).
- [ ] Verify initial credit balance is 20 (Free Tier).

### Wingman Features (Core)
- [ ] **Create Girl:** Add a new girl profile manually. Verify it appears on Dashboard.
- [ ] **Magic Fill:** Upload a screenshot to a new profile. Verify OCR works and fields (Name, Age, Vibe) are auto-filled.
- [ ] **Chat:** Send a message. Verify "Wingman" replies (should cost 1 credit).
- [ ] **Hookup Line:** Click the "Zap" icon. Verify a spicy line is generated (should cost 1 credit).
- [ ] **Credit Deduction:** Check that balance decreases by 1 after each AI generation.

### User RAG (My Persona)
- [ ] Go to Profile Page -> "My Persona".
- [ ] Add a fact: "I am a pilot and love sushi."
- [ ] Go to Chat. Ask the Wingman: "Suggest a date idea based on my job."
- [ ] **Verification:** The Wingman should suggest a sushi date or mention flying, proving RAG is working.

### Art Generation
- [ ] In Chat, click the "Image" icon.
- [ ] Enter prompt: "Wearing a red dress at a bar".
- [ ] **Verification:** An image should appear in chat after ~10s.
- [ ] **Credit Deduction:** Balance should decrease by 3.

### Monetization
- [ ] Go to Profile -> Upgrade Plan.
- [ ] Select "Starter Pack" ($9.99).
- [ ] Complete Stripe Checkout (use Test Mode card: `4242 4242...`).
- [ ] **Verification:** Redirect back to app with "Order placed!" toast. Credit balance increases by 100.
