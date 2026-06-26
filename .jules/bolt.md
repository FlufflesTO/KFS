## 2025-06-08 - Refactoring the jobs POST API
**Learning:** Refactoring overly long functions, especially those routing API endpoints based on payload actions, greatly improves maintainability.
**Action:** Extracted `markInvoiced` and `create/update` logic from `POST` in `src/pages/portal/api/admin/jobs.ts` into isolated async helper functions.
## 2024-05-17 - Optimize D1 Queries via Batching and In-Memory Grouping
**Learning:** Using `Promise.all` with individual `db.prepare(...).all()` calls results in multiple HTTP roundtrips to the Cloudflare D1 API, causing significant latency overhead. Furthermore, `Promise.all` inside `.map` loops for relational queries causes N+1 problems.
**Action:** Use `db.batch([db.prepare(...), ...])` for executing multiple independent D1 queries in a single HTTP roundtrip. For relational loops (N+1 queries), fetch all related records in a single batch query and group them in-memory to minimize round-trip latency.
## 2026-06-26 - GitHub Actions PowerShell Compatibility
**Learning:** In GitHub Actions Ubuntu environments, `pwsh` is installed as `/usr/bin/pwsh` rather than `powershell`. The `npm run build:production` scripts fail with exit code 127 because `powershell` is not found in the PATH.
**Action:** When fixing "powershell: not found" errors in Linux CI runners, create a symlink to `/usr/bin/pwsh` (e.g. `sudo ln -sf /usr/bin/pwsh /usr/bin/powershell`) in the workflow instead of modifying `package.json`, to comply with project constraints.
