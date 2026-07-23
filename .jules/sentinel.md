## 2025-06-08 - Refactoring the jobs POST API
**Vulnerability:** Complex routing structures can accidentally combine access boundaries.
**Learning:** Organizing route handling into separate functions ensures the exact required conditions can be met and reviewed more easily.
**Prevention:** Continuing to separate logical actions into bounded helper functions underneath standard access controls.
## 2025-06-08 - Timing Attacks in String Comparisons
**Vulnerability:** Comparing sensitive cryptographic material (like HMACs, hashes, or TOTP codes) using standard string comparison functions or operators can leak the length of the string and allow timing attacks.
**Learning:** `constantTimeEqual` implementations that rely on XORing characters and returning immediately if string lengths differ are secure *only* if the expected string length is known or fixed, but XORing string characters in JS is not as robust as comparing bytes in a `Uint8Array`.
**Prevention:** Always convert strings to `Uint8Array` using `TextEncoder` before performing bitwise operations for timing-safe equality checks.
