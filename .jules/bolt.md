## 2025-06-08 - Refactoring the jobs POST API
**Learning:** Refactoring overly long functions, especially those routing API endpoints based on payload actions, greatly improves maintainability.
**Action:** Extracted `markInvoiced` and `create/update` logic from `POST` in `src/pages/portal/api/admin/jobs.ts` into isolated async helper functions.

## 2026-10-19 - GitHub Actions CI failing on powershell exit code 127
**Learning:** The `ci-cd.yml` workflow installs powershell on the ubuntu runner, but the `package.json` scripts execute using `powershell` which isn't mapped properly or not found, causing a 127 exit code. The modern cross-platform executable is `pwsh`.
**Action:** Adding a symlink `sudo ln -sf /usr/bin/pwsh /usr/bin/powershell` during the CI Setup PowerShell step fixes the issue without modifying the underlying `package.json` scripts (which are out of scope unless instructed).
