## 2026-06-08 - Prevent Timing Attacks in Webhook Secret Validation
**Vulnerability:** Webhook signature validation used standard string equality (`!==`), which leaks information about the secret via timing side-channels.
**Learning:** Standard string comparison operators terminate early on the first mismatched character. Attackers can measure the response time of multiple requests to progressively guess the correct secret character by character.
**Prevention:** Always use a constant-time comparison function (like the existing `timingSafeEqual` utility) to compare cryptographic secrets, signatures, or authentication tokens. Convert strings to `Uint8Array` using `TextEncoder` before comparison.
