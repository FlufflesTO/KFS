## 2025-06-08 - Refactoring the jobs POST API
**Learning:** Refactoring overly long functions, especially those routing API endpoints based on payload actions, greatly improves maintainability.
**Action:** Extracted `markInvoiced` and `create/update` logic from `POST` in `src/pages/portal/api/admin/jobs.ts` into isolated async helper functions.
## 2025-07-26 - Resolving N+1 querying in Cloudflare D1
**Learning:** Performing database queries within `Promise.all` and `.map()` iterations leads to severe N+1 latency problems. Cloudflare D1 has a hard parameter limit of 100 per query, making straightforward `IN (...)` queries with large arrays prone to failure.
**Action:** Resolved N+1 latency in HR portal by batching associated record fetches (staff files). Used array chunking (chunks of 100) mapped to `db.prepare(...).bind(...)` calls inside a single concurrent `db.batch()` execution, then grouped the flattened results in-memory.
