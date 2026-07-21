## 2025-06-08 - Refactoring the jobs POST API
**Vulnerability:** Complex routing structures can accidentally combine access boundaries.
**Learning:** Organizing route handling into separate functions ensures the exact required conditions can be met and reviewed more easily.
**Prevention:** Continuing to separate logical actions into bounded helper functions underneath standard access controls.
## 2024-05-24 - Timing Attack Vulnerability in Webhook Validation
**Vulnerability:** The Sage webhook validation endpoint used a string-based comparison (`constantTimeEqual` iterating over `charCodeAt()`) to verify the `Authorization: Bearer` token. String operations in V8/JavaScript can leak timing information due to internal representations, leaving the webhook vulnerable to timing attacks.
**Learning:** For secure cryptographic comparisons, especially on Edge/Worker environments where native `crypto.timingSafeEqual` might not be synchronously available, strings must be encoded to `Uint8Array` using `TextEncoder` and compared at the byte level. The `auth.ts` module already contained a secure byte-level `timingSafeEqual` function, while `crypto-utils.ts` contained the vulnerable string-based version.
**Prevention:** Always use `TextEncoder` to convert sensitive strings (like tokens and secrets) to `Uint8Array` before comparison. Consolidate cryptographic utilities to avoid maintaining redundant and potentially insecure versions (e.g., removing the vulnerable `constantTimeEqual` in favor of the secure `timingSafeEqual`).
