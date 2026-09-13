## 2025-06-08 - Refactoring the jobs POST API
**Vulnerability:** Complex routing structures can accidentally combine access boundaries.
**Learning:** Organizing route handling into separate functions ensures the exact required conditions can be met and reviewed more easily.
**Prevention:** Continuing to separate logical actions into bounded helper functions underneath standard access controls.

## 2026-09-13 - Fix Timing Attack Vulnerability
**Vulnerability:** Timing leak in constantTimeEqual for unknown-length string comparisons.
**Learning:** JIT compilation de-optimizes out-of-bounds array access and early returns cause timing leaks. Padding strings manually does not securely fix it in JS.
**Prevention:** Normalize input length by using crypto.subtle.digest to hash both inputs before bitwise comparison, removing the length variation.
