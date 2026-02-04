## 2024-05-22 - [CRITICAL] Missing Admin Authorization
**Vulnerability:** Admin actions (crawling, approving/rejecting knowledge) were exposed to any authenticated user.
**Learning:** Checking for `userId` (authentication) is not enough for administrative functions; `role` (authorization) must also be checked.
**Prevention:** Always implement role-based access control (RBAC) middleware or helper functions for admin-only actions.

## 2024-05-22 - [HIGH] RAG Poisoning via User Feedback
**Vulnerability:** The `submitFeedback` action automatically approved user-generated content into the global knowledge base.
**Learning:** In RAG systems, never trust user feedback as a source of truth without verification; it allows prompt injection attacks to become permanent system knowledge.
**Prevention:** All user-generated training data must enter a 'pending' state requiring admin approval.
