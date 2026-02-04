## 2024-05-22 - [CRITICAL] Missing Admin Authorization
**Vulnerability:** Admin actions (crawling, approving/rejecting knowledge) were exposed to any authenticated user.
**Learning:** Checking for `userId` (authentication) is not enough for administrative functions; `role` (authorization) must also be checked.
**Prevention:** Always implement role-based access control (RBAC) middleware or helper functions for admin-only actions.

## 2024-05-23 - [CRITICAL] Publicly Exposed Transaction Creation
**Vulnerability:** The `createTransaction` function was exported from a file marked with `"use server"`, allowing any authenticated user to invoke it directly and add credits to their account without payment.
**Learning:** Functions intended for internal server-side use (like webhook handlers) must NOT be exported from files marked with `"use server"`. They should be in separate service files or not exported.
**Prevention:** Move sensitive logic to `*.service.ts` files that do not have `"use server"` at the top. Only export functions intended for client consumption in `*.actions.ts` files.
