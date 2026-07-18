## 2025-06-08 - Refactoring the jobs POST API
**Vulnerability:** Complex routing structures can accidentally combine access boundaries.
**Learning:** Organizing route handling into separate functions ensures the exact required conditions can be met and reviewed more easily.
**Prevention:** Continuing to separate logical actions into bounded helper functions underneath standard access controls.

## 2025-06-08 - Use Uint8Array timing-safe comparisons over string-based ones
**Vulnerability:** Comparing sensitive values (like passwords, MFA tokens, webhook secrets) via bitwise operations on strings leaks string length and may be prone to timing attacks because string comparison and encoding abstractions vary. The custom `constantTimeEqual` function over strings was used inconsistently and incorrectly for security tokens.
**Learning:** String-based bitwise XOR comparison (`a.charCodeAt(i) ^ b.charCodeAt(i)`) is insufficient for a true timing-safe check in all JavaScript engines, and lengths were being returned early, leaking information.
**Prevention:** Instead of string comparison, always encode strings into a `Uint8Array` (e.g., via `TextEncoder`) and use a reliable, standardized `timingSafeEqual` function operating over byte arrays. Do not implement ad-hoc string comparisons for cryptographic checks.
