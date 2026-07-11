## 2025-06-08 - Refactoring the jobs POST API
**Learning:** Refactoring overly long functions, especially those routing API endpoints based on payload actions, greatly improves maintainability.
**Action:** Extracted `markInvoiced` and `create/update` logic from `POST` in `src/pages/portal/api/admin/jobs.ts` into isolated async helper functions.
## 2025-06-08 - Fixing N+1 Query in HR Admin
**Learning:** Sequential Cloudflare D1 database calls (like N+1 queries executing in `.map` with `Promise.all()`) drastically increase API latency due to the multiple HTTP roundtrips required for Serverless SQLite. Even when run in parallel, these roundtrips add significant overhead.
**Action:** When querying for relationships (like getting all files for a list of staff members), extract IDs, bundle them into a single `IN (...)` clause query using dynamic placeholders, chunk by 100 to avoid D1 limits, and use `db.batch()` to combine into a single request. Group the results in-memory.
## 2025-07-11 - PowerShell CI Execution Failure Fix
**Learning:** If a CI workflow executed in a Linux environment via GitHub Actions fails due to `powershell: not found` during the `npm run build:production` step (or similar command relying on pwsh), but `pwsh` is installed by the runner, it may just lack the `powershell` alias link.
**Action:** Do not modify `package.json` scripts if they violate constraints. Ensure a symlink is created mapping the actual PowerShell bin to the `powershell` alias by running: `sudo ln -sf /usr/bin/pwsh /usr/bin/powershell` (or `/opt/microsoft/powershell/7/pwsh`).
