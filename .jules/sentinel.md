## 2025-06-08 - Refactoring the jobs POST API
**Vulnerability:** Complex routing structures can accidentally combine access boundaries.
**Learning:** Organizing route handling into separate functions ensures the exact required conditions can be met and reviewed more easily.
**Prevention:** Continuing to separate logical actions into bounded helper functions underneath standard access controls.

## 2025-06-08 - Fixed timing leak in constantTimeEqual for variable length inputs
**Vulnerability:** constantTimeEqual early exits on different lengths and uses non-constant JIT ops in javascript.
**Learning:** JIT engines optimize length checking and out of bounds array access, which can create timing attacks.
**Prevention:** Ensure both inputs are normalized to exactly the same length by first hashing them (e.g., using SHA-256) before performing bitwise XOR comparisons.
