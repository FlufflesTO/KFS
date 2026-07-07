## 2025-06-08 - Refactoring the jobs POST API
**Learning:** Refactoring overly long functions, especially those routing API endpoints based on payload actions, greatly improves maintainability.
**Action:** Extracted `markInvoiced` and `create/update` logic from `POST` in `src/pages/portal/api/admin/jobs.ts` into isolated async helper functions.

## 2025-06-08 - Fixing D1 N+1 Query in HR Dashboard
**Learning:** Executing D1 queries within an asynchronous `Promise.all(array.map(...))` loop is an anti-pattern that creates multiple network requests back to Cloudflare D1. This leads to substantial latency overhead and degrades backend performance significantly as data sets grow.
**Action:** Consolidate related lookups by substituting loop-based queries with a single query using `IN (...)` with dynamically bound array parameters, then perform memory-based grouping to link the requested entities back to the source objects.
