## 2025-06-08 - Refactoring the jobs POST API
**Vulnerability:** Complex routing structures can accidentally combine access boundaries.
**Learning:** Organizing route handling into separate functions ensures the exact required conditions can be met and reviewed more easily.
**Prevention:** Continuing to separate logical actions into bounded helper functions underneath standard access controls.

## 2024-06-12 - Timing side-channel attack in constantTimeEqual
**Vulnerability:** The `constantTimeEqual` function in `src/lib/server/crypto-utils.ts` returned early if string lengths didn't match and used `charCodeAt` for bitwise operations. This leaks the secret length and isn't fully safe against JS engine timing variations.
**Learning:** Even custom implementations of constant-time equality can be vulnerable if they check lengths first, allowing attackers to iterate and guess token lengths. `charCodeAt` is also problematic for string-based cryptographic comparisons in JavaScript.
**Prevention:** Always convert strings to `Uint8Array` via `TextEncoder().encode()` before comparison. Accumulate bitwise XORs over the entire array length without early returns in the loop, similar to the standard `timingSafeEqual` pattern.
