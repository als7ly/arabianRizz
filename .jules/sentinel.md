## 2024-05-22 - [CRITICAL] Missing Admin Authorization
**Vulnerability:** Admin actions (crawling, approving/rejecting knowledge) were exposed to any authenticated user.
**Learning:** Checking for `userId` (authentication) is not enough for administrative functions; `role` (authorization) must also be checked.
**Prevention:** Always implement role-based access control (RBAC) middleware or helper functions for admin-only actions.

## 2024-05-22 - [HIGH] RAG Poisoning via User Feedback
**Vulnerability:** The `submitFeedback` action automatically approved user-generated content into the global knowledge base.
**Learning:** In RAG systems, never trust user feedback as a source of truth without verification; it allows prompt injection attacks to become permanent system knowledge.
**Prevention:** All user-generated training data must enter a 'pending' state requiring admin approval.

## 2024-05-22 - [CRITICAL] Exposed Sensitive Server Action
**Vulnerability:** The `createTransaction` function was exported from a file with `"use server"`, allowing any client to invoke it and grant free credits.
**Learning:** Placing sensitive administrative logic in Server Action files (marked with `"use server"`) exposes them as public API endpoints, even if they are only intended for internal use.
**Prevention:** Move internal logic/services to separate files *without* `"use server"` directives. Only export functions that are explicitly intended to be called by the client from Server Action files.

## 2024-05-22 - [HIGH] Exposed Gamification Logic
**Vulnerability:** The `updateGamification` function was exported from a `"use server"` file without any authentication checks, allowing potential IDOR or gamification abuse.
**Learning:** Even low-risk logic like gamification should not be exposed as a public API if it modifies state.
**Prevention:** Move internal state-modifying logic to service files.

## 2024-05-24 - [CRITICAL] IDOR in Transaction History
**Vulnerability:** The `getTransactions` Server Action allowed any user to fetch transaction history for any other user by providing their MongoDB ID.
**Learning:** Server Actions are public endpoints. Verification of ownership must be explicit, comparing the authenticated user's ID with the requested resource's owner ID.
**Prevention:** Always derive the user context from `auth()` inside the server action and validate it against input parameters.
