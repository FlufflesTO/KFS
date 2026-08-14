## 2025-06-08 - Refactoring the jobs POST API
**Vulnerability:** Complex routing structures can accidentally combine access boundaries.
**Learning:** Organizing route handling into separate functions ensures the exact required conditions can be met and reviewed more easily.
**Prevention:** Continuing to separate logical actions into bounded helper functions underneath standard access controls.
## 2025-06-08 - Fixed string length leakage in constantTimeEqual
**Vulnerability:** The constantTimeEqual function was returning early when string lengths didn't match, which leaks the exact length of secrets to an attacker via a timing attack.
**Learning:** To securely compare strings of unknown/variable lengths, both inputs should be hashed first to normalize their lengths before performing a bitwise XOR comparison. Attempting to pad strings or track out-of-bounds array access in JavaScript ruins constant-time guarantees due to JIT engine de-optimizations.
**Prevention:** Always normalize lengths via cryptographic hashing (e.g., SHA-256) prior to comparison if standard library timing-safe equal functions don't support variable-length inputs natively.
