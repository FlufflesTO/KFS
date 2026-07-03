## 2025-06-08 - Refactoring the jobs POST API
**Vulnerability:** Complex routing structures can accidentally combine access boundaries.
**Learning:** Organizing route handling into separate functions ensures the exact required conditions can be met and reviewed more easily.
**Prevention:** Continuing to separate logical actions into bounded helper functions underneath standard access controls.
## 2025-07-03 - Timing attacks on OAuth State parameter
**Vulnerability:** Comparing sensitive tokens like OAuth `state` parameters using standard string equality (`!==`) is susceptible to timing attacks, where an attacker can infer the expected state byte-by-byte based on response times.
**Learning:** Even low-value short-lived tokens like `state` parameters should be compared securely using constant-time comparison functions to maintain defense in depth.
**Prevention:** Always use `timingSafeEqual` or equivalent functions (e.g., converting strings to `Uint8Array` via `TextEncoder`) for comparing sensitive authentication or authorization tokens, secrets, or signatures.
