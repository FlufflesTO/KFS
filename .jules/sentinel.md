## 2025-06-08 - Refactoring the jobs POST API
**Vulnerability:** Complex routing structures can accidentally combine access boundaries.
**Learning:** Organizing route handling into separate functions ensures the exact required conditions can be met and reviewed more easily.
**Prevention:** Continuing to separate logical actions into bounded helper functions underneath standard access controls.
## 2025-06-08 - Fixed timing attack in webhook verification
**Vulnerability:** Using constantTimeEqual on variable-length inputs leaks length via execution time.
**Learning:** The length of the inputs being compared must be normalized before comparison to prevent attackers from deducing the secret length.
**Prevention:** Hash both inputs with SHA-256 before applying constant-time comparison.
