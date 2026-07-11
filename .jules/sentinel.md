## 2026-07-11 - [Fix webhook secret timing vulnerability]
**Vulnerability:** The webhook secret verification endpoint used `constantTimeEqual` string comparison which contained an early return leaking string length. It could be used to perform timing attacks on webhook secrets.
**Learning:** Webhook secret validation and other cryptographic comparisons must use byte-level timing safe comparisons.
**Prevention:** Always export and utilize `timingSafeEqual` from `src/lib/server/auth.ts` which correctly encodes via `TextEncoder` for cryptographic equality checks, rather than standard string equality or unsafe string utility functions.
