## 2025-06-08 - Refactoring the jobs POST API
**Learning:** Refactoring overly long functions, especially those routing API endpoints based on payload actions, greatly improves maintainability.
**Action:** Extracted `markInvoiced` and `create/update` logic from `POST` in `src/pages/portal/api/admin/jobs.ts` into isolated async helper functions.

## 2026-08-18 - Added indexes for dashboard queries
**Learning:** Missing indexes on 'deleted_at' and 'status' across multiple domain tables (systems, sites, jobs, defects, certificates) caused sequential unindexed scans during analytical dashboard queries.
**Action:** Added composite and single-column indexes on these fields in schema.sql.


## 2026-08-18 - Added symlink for pwsh in CI pipeline
**Learning:** If cross-platform PowerShell execution fails in Linux-based CI environments (like GitHub Actions) with 'powershell: not found' due to the binary being named 'pwsh', resolve it by adding a symlink ('sudo ln -sf /usr/bin/pwsh /usr/bin/powershell') in the workflow file rather than modifying restricted 'package.json' scripts.
**Action:** Modified '.github/workflows/ci-cd.yml' to create a symlink from 'pwsh' to 'powershell' during the setup step.
