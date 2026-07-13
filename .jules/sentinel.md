## 2024-05-16 - Timing Attack Vulnerability in Custom `constantTimeEqual`

**Vulnerability:** The codebase had multiple redundant implementations of a string-based `constantTimeEqual` function (e.g., in `crypto-utils.ts`, `auth.ts`, `mfa.ts`) that were used to compare cryptographic hashes and secrets. These functions were vulnerable to side-channel timing attacks because they operated directly on JavaScript strings, which can have different internal memory representations (e.g., V8's flat vs. cons/rope strings) and encodings, leaking information about the string lengths and content.

**Learning:** String comparisons, even when implemented with a bitwise XOR loop to avoid early exit, are generally not safe for cryptographic equality checks in high-level languages like JavaScript/V8. The only robust way to perform constant-time comparison is to convert the strings into byte arrays (`Uint8Array`) first, ensuring predictable memory representation, and then compare the bytes.

**Prevention:** Always encode strings to `Uint8Array` using `TextEncoder` before performing cryptographic comparisons. Utilize a single, centralized `timingSafeEqual(a: Uint8Array, b: Uint8Array)` function for all such checks.
