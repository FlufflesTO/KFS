## 2025-06-08 - Refactoring the jobs POST API
**Vulnerability:** Complex routing structures can accidentally combine access boundaries.
**Learning:** Organizing route handling into separate functions ensures the exact required conditions can be met and reviewed more easily.
**Prevention:** Continuing to separate logical actions into bounded helper functions underneath standard access controls.

## 2026-09-16 - [HIGH] Fix timing attack in constantTimeEqual
**Vulnerability:** `constantTimeEqual` functions were checking string lengths before doing a bitwise comparison. If strings were different lengths, they returned immediately, allowing an attacker to brute force the length of a secret.
**Learning:** Checking lengths upfront on secret values leaks critical information via timing channels.
**Prevention:** Always normalize the lengths of unknown strings by hashing them first before performing XOR constant-time comparisons. Use centralized crypto utilities instead of replicating them across files.
