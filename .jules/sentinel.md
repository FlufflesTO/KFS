## 2025-06-08 - Refactoring the jobs POST API
**Vulnerability:** Complex routing structures can accidentally combine access boundaries.
**Learning:** Organizing route handling into separate functions ensures the exact required conditions can be met and reviewed more easily.
**Prevention:** Continuing to separate logical actions into bounded helper functions underneath standard access controls.

## 2026-07-29 - Timing-Safe Comparisons for Strings
**Vulnerability:** String-based timing-safe comparisons can still leak information through string length checks, exposing potential timing attacks.
**Learning:** When performing cryptographic equality checks on strings, they should first be encoded to `Uint8Array` using `TextEncoder`, and a byte-level `timingSafeEqual` function must be used.
**Prevention:** Replace all string-based `constantTimeEqual` implementations with `Uint8Array` based `timingSafeEqual` functions.
