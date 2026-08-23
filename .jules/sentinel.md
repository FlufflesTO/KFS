## 2025-06-08 - Refactoring the jobs POST API
**Vulnerability:** Complex routing structures can accidentally combine access boundaries.
**Learning:** Organizing route handling into separate functions ensures the exact required conditions can be met and reviewed more easily.
**Prevention:** Continuing to separate logical actions into bounded helper functions underneath standard access controls.

## 2025-06-08 - Timing Attack in Secret Comparison
**Vulnerability:** Comparing webhook secrets character-by-character can leak information about the secret length and content through early returns.
**Learning:** Checking string lengths before doing a bitwise comparison creates a timing side-channel attack where an attacker can determine the expected length and progressively guess characters.
**Prevention:** Always normalize the inputs (e.g., using SHA-256 hash) before comparing them so both strings are identical in length, preventing length-based early return leaks.
