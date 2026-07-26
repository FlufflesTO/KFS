## 2025-06-08 - Refactoring the jobs POST API
**Vulnerability:** Complex routing structures can accidentally combine access boundaries.
**Learning:** Organizing route handling into separate functions ensures the exact required conditions can be met and reviewed more easily.
**Prevention:** Continuing to separate logical actions into bounded helper functions underneath standard access controls.

## 2026-07-26 - Timing Attacks in Cryptographic Comparisons
**Vulnerability:** Comparing strings using typical string operations (or char-by-char bitwise XOR) is vulnerable to timing attacks in JavaScript, as string length and internal representation (rope vs sequential) can vary comparison time.
**Learning:** Javascript strings shouldn't be used for cryptographic secrets comparison.
**Prevention:** Encode all secrets to `Uint8Array` using `TextEncoder` before doing a constant-time comparison on the raw bytes.
