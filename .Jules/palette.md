# UX Journal - ArabianRizz

## Tone Selection
*   **Decision:** Placed tone selection in the chat header toolbar rather than inside the input form.
*   **Reasoning:** Users usually set a tone for the session or change it infrequently. Placing it in the header keeps the input area clean for typing.
*   **Accessibility:** Uses native `Select` component which is keyboard accessible.

## Copy to Clipboard
*   **Decision:** Added a small "copy" icon button next to the Wingman label in the message bubble.
*   **Reasoning:** Allows users to quickly copy the AI suggestion to paste into their dating app.
*   **Feedback:** Provides a toast notification "Copied to clipboard" and changes icon to a checkmark for 2 seconds.

## Regenerate Response
*   **Decision:** Added a "Regenerate" button (RotateCw) in the input toolbar, visible only when the last message is from Wingman.
*   **Reasoning:** Quick access to try a different angle without retyping context.
*   **Accessibility:** Icon button has a `title` attribute for screen readers.

## Clear Chat
*   **Decision:** Added a "Trash" icon in the header toolbar, distinct from primary actions (red color on hover).
*   **Safety:** Includes a native `confirm` dialog to prevent accidental deletion of conversation history.

## Magic Fill
*   **Flow:** Upload -> OCR -> AI Analysis -> Auto-fill Form.
*   **Feedback:** Uses multiple toast notifications to keep user informed of the progress ("Reading...", "Analyzing...", "Success").
## 2024-05-24 - Missing ARIA Labels on Icon Buttons
**Learning:** This codebase frequently uses icon-only buttons (using Lucide icons) without `aria-label` attributes. This makes the application difficult to navigate for screen reader users, as they only hear "button" without context.
**Action:** Systematically check all icon-only buttons and add descriptive `aria-label` attributes. Also consider adding `title` for tooltip behavior for mouse users.

## 2024-05-24 - Internationalization of ARIA Labels
**Learning:** Some buttons use `t()` for `title` attributes, but `aria-label`s are often hardcoded strings. This creates an accessibility gap for non-English users using screen readers.
**Action:** When adding `aria-label`s to components that use `useTranslations`, ensure the label text is also localized using the `t()` function.

## 2024-05-24 - Broken Dialog and Redundant Actions
**Learning:** Found a severe syntax error in `ChatInterface.tsx` (extra closing tags) and a redundant "Clear Chat" button. The redundant button was using a native `confirm()` which is poor UX compared to the `AlertDialog` used elsewhere. Also, `Select` component was malformed.
**Action:** Always check for matching tags in complex components. Avoid using native `confirm()` when custom modals exist. Ensure form controls like `Select` are properly structured with triggers.

## 2024-05-24 - Native Confirm Dialog Replacement
**Learning:** The `DeleteGirlButton` component was using `window.confirm()` which halts the main thread and provides a poor native UI experience that doesn't match the application's design system.
**Action:** Replaced `window.confirm()` with the `AlertDialog` component from the design system. This provides a consistent, accessible, and stylable confirmation modal. Added `aria-label` to the trigger button for better accessibility.

## 2024-05-25 - Localized Accessibility Attributes
**Learning:** Discovered that ensuring all interactive elements (buttons, inputs) have localized `aria-label` and `title` attributes significantly improves the experience for international users relying on assistive technology. Consistent use of translation namespaces (e.g., `Chat`, `Dashboard`) keeps the codebase organized.
**Action:** Systematically audited `ChatInterface`, `Sidebar`, `GirlCard`, and `Feedback` components to replace hardcoded strings with `t()` calls, adding missing keys to `messages/en.json` where necessary.

## 2026-02-06 - Missing Form Labels in Wizards
**Learning:** The OnboardingWizard used inputs with placeholders but no labels. This is a common anti-pattern that hurts accessibility (screen readers) and usability (context loss when typing).
**Action:** When creating forms, always wrap inputs in a container with a visible `<Label>` component linked via `htmlFor`/`id`, or use `aria-label` if a visible label is visually impossible.
