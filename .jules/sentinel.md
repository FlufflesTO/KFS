## 2025-06-08 - Refactoring the jobs POST API
**Vulnerability:** Complex routing structures can accidentally combine access boundaries.
**Learning:** Organizing route handling into separate functions ensures the exact required conditions can be met and reviewed more easily.
**Prevention:** Continuing to separate logical actions into bounded helper functions underneath standard access controls.

## 2025-06-08 - Cryptographic timing attack in token comparison
**Vulnerability:** String-based constant time comparison implementations can sometimes still leak string length or have early exits. The `constantTimeEqual` function wasn't truly robust against timing attacks and was being used for token and webhook verification.
**Learning:** For sensitive cryptographic comparisons, rely on a robust byte-level `timingSafeEqual` over `Uint8Array`s to avoid all forms of leakage including string length.
**Prevention:** Remove custom string-based `constantTimeEqual` functions. Always encode sensitive strings to `Uint8Array` using `TextEncoder` and compare them with `timingSafeEqual` to prevent timing attacks.
