## 2025-06-08 - Refactoring the jobs POST API
**Vulnerability:** Complex routing structures can accidentally combine access boundaries.
**Learning:** Organizing route handling into separate functions ensures the exact required conditions can be met and reviewed more easily.
**Prevention:** Continuing to separate logical actions into bounded helper functions underneath standard access controls.

## 2026-06-01 - Prevent Timing Attacks from String Comparison
**Vulnerability:** String-based comparisons for cryptographic checks (like `constantTimeEqual(a: string, b: string)`) can leak string length due to `.length` mismatches or character-by-character comparison encoding differences, opening the possibility for timing attacks.
**Learning:** Comparing cryptographic hashes or secrets using standard string methods is dangerous.
**Prevention:** Encode strings to `Uint8Array` using `TextEncoder` and use a `timingSafeEqual` function that compares the full byte array (performing operations on all bytes) although lengths must match, preventing side-channel timing attacks.
