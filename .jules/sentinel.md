## 2025-06-08 - Refactoring the jobs POST API
**Vulnerability:** Complex routing structures can accidentally combine access boundaries.
**Learning:** Organizing route handling into separate functions ensures the exact required conditions can be met and reviewed more easily.
**Prevention:** Continuing to separate logical actions into bounded helper functions underneath standard access controls.

## 2026-09-05 - Fixing timing leak in constantTimeEqual
**Vulnerability:** The constantTimeEqual function checked string lengths before bitwise comparisons and accessed arrays in ways that could trigger JIT de-optimization, creating a potential timing attack vector on webhook secrets.
**Learning:** In V8/JS environments, naive string iteration can expose lengths or de-optimize execution times unpredictably. True constant-time string comparison requires length normalization.
**Prevention:** Use Web Crypto API's SHA-256 digest on both inputs first to normalize lengths to 32 bytes before performing bitwise XOR comparisons on the resulting fixed-size Uint8Array buffers.
