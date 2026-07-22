## 2025-06-08 - Refactoring the jobs POST API
**Vulnerability:** Complex routing structures can accidentally combine access boundaries.
**Learning:** Organizing route handling into separate functions ensures the exact required conditions can be met and reviewed more easily.
**Prevention:** Continuing to separate logical actions into bounded helper functions underneath standard access controls.
## 2025-10-24 - Timing Attacks in String Comparsion
**Vulnerability:** Comparing strings character-by-character allows timing attacks because it exposes the length of the string and leaks string lengths during cryptographic comparisons.
**Learning:** For sensitive cryptographic comparisons, do not use string-based comparisons as they can leak string length.
**Prevention:** Instead, encode strings to `Uint8Array` using `TextEncoder` and use the `timingSafeEqual` function from `src/lib/server/auth.ts` to prevent timing attacks.

## 2025-10-24 - Cryptography Improvements
**Learning:** `constantTimeEqual` does a character-by-character comparison in the string form and exposes length differences, which causes timing attacks and breaks side-channel resistance.
**Prevention:** Convert string inputs into `Uint8Array` format and use `timingSafeEqual` in `src/lib/server/auth.ts` or implement length matching for the same purpose.
