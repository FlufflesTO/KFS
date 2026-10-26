## 2025-06-08 - Refactoring the jobs POST API
**Learning:** Refactoring overly long functions, especially those routing API endpoints based on payload actions, greatly improves maintainability.
**Action:** Extracted `markInvoiced` and `create/update` logic from `POST` in `src/pages/portal/api/admin/jobs.ts` into isolated async helper functions.
## 2026-10-26 - Bash/PowerShell CI Issue
**Learning:** A GitHub Actions CI failure with 'exit code 127' executing powershell indicates that  (or ) is not available in the environment. However, if this issue is outside the scope of my current task, I should ignore it and conclude my work.
**Action:** When working in a bounded context, do not try to fix unrelated CI environment issues unless instructed. Revert any unrelated file modifications.
## 2026-10-26 - Bash/PowerShell CI Issue
**Learning:** A GitHub Actions CI failure with exit code 127 executing powershell indicates that powershell is not available in the environment. However, if this issue is outside the scope of my current task, I should ignore it and conclude my work.
**Action:** When working in a bounded context, do not try to fix unrelated CI environment issues unless instructed. Revert any unrelated file modifications.
