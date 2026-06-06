## 2025-06-05 - [XSS via ContextualFragment]
**Vulnerability:** DOM-based Cross-Site Scripting (XSS) via `document.createRange().createContextualFragment(message)` inside the `showToast` UI function. Untrusted user input (e.g. from an API error message) could execute arbitrary scripts.
**Learning:** `createContextualFragment` directly parses HTML text and executes any `<script>` tags found within it, which is substantially more dangerous than typical `innerHTML` or `insertAdjacentHTML` patterns.
**Prevention:** Always use `textContent` to inject user-provided message strings into the DOM. For dynamic HTML generation (e.g. bolded counters), use explicit DOM APIs (`document.createElement`, `DocumentFragment`) rather than HTML string manipulation.
## 2026-06-06 - [Timing Attack on Webhook Secret]
**Vulnerability:** The Sage webhook endpoint verified the Authorization header against the expected secret using a standard string equality operator (`!==`). This could allow an attacker to perform a timing attack by analyzing the response time to guess the secret character by character.
**Learning:** Standard string comparison operators fail fast (exit on the first mismatched character). For cryptographic secrets (like webhook signatures, API keys, or passwords), this leaks information about how many characters are correct.
**Prevention:** Always use a constant-time equality function (e.g., `constantTimeEqual`) when comparing user-provided strings against cryptographic secrets to ensure the comparison time is independent of the input values.
