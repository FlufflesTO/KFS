## 2025-06-08 - Refactoring the jobs POST API
**Vulnerability:** Complex routing structures can accidentally combine access boundaries.
**Learning:** Organizing route handling into separate functions ensures the exact required conditions can be met and reviewed more easily.
**Prevention:** Continuing to separate logical actions into bounded helper functions underneath standard access controls.
## 2025-07-14 - Use Uint8Array for timing-safe string comparisons
**Vulnerability:** String-based timing-safe comparison loops (like comparing characters using `.charCodeAt`) can leak string length and are generally less secure in JavaScript due to internal string representations and optimization behavior. Several parts of the application were using a custom string comparison `constantTimeEqual` function.
**Learning:** Using `Uint8Array` combined with `crypto.subtle` timing-safe capabilities or a strict binary comparison is essential to completely prevent timing attacks when comparing sensitive tokens (such as passwords, MFA codes, or webhook secrets).
**Prevention:** Avoid string-based security comparisons. Always encode sensitive strings to `Uint8Array` (e.g., using `TextEncoder`) and use the centralized `timingSafeEqual` function exported from `src/lib/server/auth.ts`.
