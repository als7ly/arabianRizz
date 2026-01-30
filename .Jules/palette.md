## 2024-05-24 - Missing ARIA Labels on Icon Buttons
**Learning:** This codebase frequently uses icon-only buttons (using Lucide icons) without `aria-label` attributes. This makes the application difficult to navigate for screen reader users, as they only hear "button" without context.
**Action:** Systematically check all icon-only buttons and add descriptive `aria-label` attributes. Also consider adding `title` for tooltip behavior for mouse users.
