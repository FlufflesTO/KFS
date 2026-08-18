## 2025-06-08 - Refactoring the jobs POST API
**Vulnerability:** Complex routing structures can accidentally combine access boundaries.
**Learning:** Organizing route handling into separate functions ensures the exact required conditions can be met and reviewed more easily.
**Prevention:** Continuing to separate logical actions into bounded helper functions underneath standard access controls.

## 2026-08-18 - [Timing Leak in Webhook Secret Verification]
**Vulnerability:** Timing leak in `sage-webhook.ts` when verifying webhook secrets using a length-dependent `constantTimeEqual` function.
**Learning:** In JavaScript, attempting constant-time string comparisons without normalizing lengths can result in JIT de-optimizations and timing leaks.
**Prevention:** Always normalize lengths of variable-length secrets by hashing them first before performing a constant-time bitwise XOR comparison.
