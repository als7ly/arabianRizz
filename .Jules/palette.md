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
