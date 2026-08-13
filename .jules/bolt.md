## 2025-06-08 - Refactoring the jobs POST API
**Learning:** Refactoring overly long functions, especially those routing API endpoints based on payload actions, greatly improves maintainability.
**Action:** Extracted `markInvoiced` and `create/update` logic from `POST` in `src/pages/portal/api/admin/jobs.ts` into isolated async helper functions.

## 2026-08-13 - Batch Database Queries
**Learning:** Batched queries using Cloudflare D1 (via `db.batch()`) reduce database roundtrip latency compared to executing multiple sequential `db.prepare(...).all()` queries, which can be critical for reporting pages that load a lot of stats.
**Action:** Use `db.batch()` inside service layers to fetch multiple distinct queries in one round trip.
