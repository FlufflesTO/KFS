## 2025-06-08 - Refactoring the jobs POST API
**Learning:** Refactoring overly long functions, especially those routing API endpoints based on payload actions, greatly improves maintainability.
**Action:** Extracted `markInvoiced` and `create/update` logic from `POST` in `src/pages/portal/api/admin/jobs.ts` into isolated async helper functions.
## 2026-09-23 - GitHub Actions pwsh alias
**Learning:** Ubuntu runner installs PowerShell as `pwsh`, which causes scripts trying to execute `powershell` to fail.
**Action:** Add a symlink from `pwsh` to `powershell` before running scripts.
