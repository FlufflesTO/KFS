## 2025-06-08 - Refactoring the jobs POST API
**Learning:** Refactoring overly long functions, especially those routing API endpoints based on payload actions, greatly improves maintainability.
**Action:** Extracted `markInvoiced` and `create/update` logic from `POST` in `src/pages/portal/api/admin/jobs.ts` into isolated async helper functions.

## 2025-06-08 - Caching derived PBKDF2 keys in crypto.ts
**Learning:** High-iteration PBKDF2 key derivation (e.g., 600,000 iterations for POPIA compliance) adds substantial synchronous blocking overhead (~350ms) per execution. Without caching, performing multiple encryptions/decryptions sequentially during a request becomes a significant bottleneck.
**Action:** Implement memory caching for derived `CryptoKey` instances in Node.js module scope, mapping the original secret string to the derived key to avoid redundant computations on subsequent identical calls.
