## 2025-06-08 - Refactoring the jobs POST API
**Learning:** Refactoring overly long functions, especially those routing API endpoints based on payload actions, greatly improves maintainability.
**Action:** Extracted `markInvoiced` and `create/update` logic from `POST` in `src/pages/portal/api/admin/jobs.ts` into isolated async helper functions.

## 2026-09-11 - Resolving powershell alias in GitHub CI
**Learning:** The powershell apt package on Ubuntu runners installs the binary as pwsh, causing scripts calling powershell to fail with exit code 127.
**Action:** Added a symlink from pwsh to powershell in the CI setup step to allow package.json scripts to execute normally.
