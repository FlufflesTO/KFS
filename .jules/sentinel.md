## 2025-06-08 - Refactoring the jobs POST API
**Vulnerability:** Complex routing structures can accidentally combine access boundaries.
**Learning:** Organizing route handling into separate functions ensures the exact required conditions can be met and reviewed more easily.
**Prevention:** Continuing to separate logical actions into bounded helper functions underneath standard access controls.

## 2025-10-24 - String-based Cryptographic Comparison Vulnerability
**Vulnerability:** Comparing cryptographic tokens or secrets using string-based `charCodeAt` (like `constantTimeEqual(a: string, b: string)`) can leak string length and is prone to V8 optimizations that reintroduce early exits. This is not entirely timing-safe and leaves the system open to subtle side-channel timing attacks.
**Learning:** For true constant-time operations, inputs must first be converted to bytes (`Uint8Array`) using `TextEncoder` before iterating and performing XOR comparison. Byte lengths must be identical before accumulating XOR values to ensure no information about internal matches is leaked.
**Prevention:** Remove string-based comparison functions and always use `timingSafeEqual(a: Uint8Array, b: Uint8Array)`. Encode string secrets to byte arrays before comparison.
