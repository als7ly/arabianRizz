## 2024-05-22 - [CRITICAL] Missing Admin Authorization
**Vulnerability:** Admin actions (crawling, approving/rejecting knowledge) were exposed to any authenticated user.
**Learning:** Checking for `userId` (authentication) is not enough for administrative functions; `role` (authorization) must also be checked.
**Prevention:** Always implement role-based access control (RBAC) middleware or helper functions for admin-only actions.
