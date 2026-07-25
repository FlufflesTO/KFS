## 2025-06-08 - Refactoring the jobs POST API
**Vulnerability:** Complex routing structures can accidentally combine access boundaries.
**Learning:** Organizing route handling into separate functions ensures the exact required conditions can be met and reviewed more easily.
**Prevention:** Continuing to separate logical actions into bounded helper functions underneath standard access controls.
## 2024-06-25 - Prevent Timing Attacks with String Comparisons
**Vulnerability:** Found custom `constantTimeEqual` function in `src/lib/server/crypto-utils.ts` and `src/lib/server/auth.ts` that performed string-based equality checks using `charCodeAt`.
**Learning:** In V8 and JavaScript engines, string encoding and normalization (like multi-byte characters) can cause slight timing variances even in loops designed to be constant-time, leading to potential timing attacks for sensitive cryptographic comparisons (like webhook signatures, session tokens, and MFA codes).
**Prevention:** For sensitive cryptographic comparisons, do not use string-based comparisons as they can leak string length. Instead, encode strings to `Uint8Array` using `TextEncoder` and use the `timingSafeEqual` function from `src/lib/server/crypto-utils.ts` to prevent timing attacks.
