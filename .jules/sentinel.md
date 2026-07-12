## 2025-06-08 - Refactoring the jobs POST API
**Vulnerability:** Complex routing structures can accidentally combine access boundaries.
**Learning:** Organizing route handling into separate functions ensures the exact required conditions can be met and reviewed more easily.
**Prevention:** Continuing to separate logical actions into bounded helper functions underneath standard access controls.
## 2024-05-18 - String Length Leakage in Custom constantTimeEqual
**Vulnerability:** A custom string-based `constantTimeEqual` function contained an early return based on `a.length !== b.length`. In JavaScript, strings are UTF-16 encoded, so returning early on string length discrepancies leaks the string length itself, defeating the purpose of constant-time comparison for secrets where length could be sensitive or provide clues to attackers (e.g. comparing user-provided strings against hashed tokens before uniform encoding).
**Learning:** Even well-intentioned "constant time" functions can leak data if they operate on variable-length structures that might give hints about their contents or structure.
**Prevention:** Always encode strings to byte arrays (`Uint8Array`) before performing cryptographic comparisons, and use a centralized byte-based `timingSafeEqual` function instead of duplicating string-based implementations across files.
