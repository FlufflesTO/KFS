## 2025-06-08 - Refactoring the jobs POST API
**Learning:** Refactoring overly long functions, especially those routing API endpoints based on payload actions, greatly improves maintainability.
**Action:** Extracted `markInvoiced` and `create/update` logic from `POST` in `src/pages/portal/api/admin/jobs.ts` into isolated async helper functions.
## 2026-07-02 - Resolve N+1 query in HR Admin Dashboard
**Learning:** Executing D1 database queries sequentially using `.map()` and `Promise.all()` triggers N+1 API roundtrips causing severe latency.
**Action:** Use a single batched query with an `IN (...)` clause using `.bind(...params)` to fetch related records in one go, then group them in-memory.
