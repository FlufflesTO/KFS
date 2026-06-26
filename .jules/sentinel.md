## 2025-06-08 - Refactoring the jobs POST API
**Vulnerability:** Complex routing structures can accidentally combine access boundaries.
**Learning:** Organizing route handling into separate functions ensures the exact required conditions can be met and reviewed more easily.
**Prevention:** Continuing to separate logical actions into bounded helper functions underneath standard access controls.

## 2026-06-26 - Timing Attack in Webhook Verification
**Vulnerability:** The `constantTimeEqual` function in `src/lib/server/crypto-utils.ts` and the inline comparison in `src/pages/api/finance/sage-webhook.ts` were susceptible to timing attacks due to early exit on string length mismatch, or standard string comparisons. Since strings are represented in multiple bytes, standard comparisons might leak information. And although the old `constantTimeEqual` looped, it used string char codes and short-circuited on length difference.
**Learning:** String representations can be problematic for constant-time comparisons because character encodings can vary in byte length and length mismatch short-circuits leak token lengths. It's safer to compare raw bytes (Uint8Array) using XOR across the entire length of the arrays, ensuring length mismatches also result in constant-time (relative to array size) failures, or simply padding or hashing beforehand. Here we leveraged a true byte-level `timingSafeEqual`.
**Prevention:** Always convert incoming strings (like tokens and signatures) to `Uint8Array` via `TextEncoder` and use a dedicated, byte-level constant-time comparison function (like `timingSafeEqual`) rather than string-based loops or standard equality operators.
