## 2025-06-08 - Refactoring the jobs POST API
**Learning:** Refactoring overly long functions, especially those routing API endpoints based on payload actions, greatly improves maintainability.
**Action:** Extracted `markInvoiced` and `create/update` logic from `POST` in `src/pages/portal/api/admin/jobs.ts` into isolated async helper functions.

## 2026-08-10 - Batched Database Queries
**Learning:** Unoptimized, sequential database queries inside Astro page components significantly slow down initial render times, especially when querying multiple disconnected operational signals.
**Action:** Replaced sequential DB calls with existing batched query abstractions (like ReportService) using db.batch which executes multiple queries in a single database round-trip, significantly lowering D1 connection latency.
