## 2025-06-05 - [XSS via ContextualFragment]
**Vulnerability:** DOM-based Cross-Site Scripting (XSS) via `document.createRange().createContextualFragment(message)` inside the `showToast` UI function. Untrusted user input (e.g. from an API error message) could execute arbitrary scripts.
**Learning:** `createContextualFragment` directly parses HTML text and executes any `<script>` tags found within it, which is substantially more dangerous than typical `innerHTML` or `insertAdjacentHTML` patterns.
**Prevention:** Always use `textContent` to inject user-provided message strings into the DOM. For dynamic HTML generation (e.g. bolded counters), use explicit DOM APIs (`document.createElement`, `DocumentFragment`) rather than HTML string manipulation.
