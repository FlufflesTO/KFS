---
name: security-review
description: Guidelines for security reviews, enforcing CSP nonces, CSRF token inputs, constant-time comparisons, and strict bans on DOM HTML injections. Use before finalising code changes or running validation audits.
---

# Security Review & Enforcement Guidelines

Strict security invariants must be maintained across all pull requests and commits.

## Core Security Checks

1. **Content Security Policy (CSP) Nonce**: Inline `<script>` blocks in all Astro files must map the nonce value:
   ```astro
   <script nonce={Astro.locals.nonce}>...</script>
   ```
2. **CSRF Forms**: State-mutating `<form>` elements in the portal must include the `<CsrfInput />` component:
   ```astro
   <form method="POST">
     <CsrfInput />
     ...
   </form>
   ```
3. **HTML Injections**: Never use `innerHTML`, `outerHTML`, or `insertAdjacentHTML`. Use safe alternatives:
   ```ts
   // Safe text placement
   el.textContent = "Safe Text";
   
   // Safe child clearing
   el.replaceChildren();
   ```
4. **IP Hashing**: To comply with POPIA, never store raw IP addresses. Always hash using SHA-256 before writing to databases or logging.
5. **Constant-Time Token Comparisons**: Always use constant-time equality checks for session/security tokens to mitigate timing attacks.
