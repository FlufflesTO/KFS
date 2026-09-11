## 2025-06-08 - Refactoring the jobs POST API
**Learning:** Refactoring overly long functions, especially those routing API endpoints based on payload actions, greatly improves maintainability.
**Action:** Extracted `markInvoiced` and `create/update` logic from `POST` in `src/pages/portal/api/admin/jobs.ts` into isolated async helper functions.
## 2026-09-11 - JSON Aggregation for N+1 Queries
**Learning:** Resolving N+1 queries in Cloudflare D1 (SQLite) backend logic by replacing `Promise.all()` loops with `json_group_array` and `json_object` in SQL drastically reduces round-trip latency to the database.
**Action:** Always prefer fetching related one-to-many child records using SQLite's JSON aggregation instead of awaiting multiple individual queries inside map loops.
