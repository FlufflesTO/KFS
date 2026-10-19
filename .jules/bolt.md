## 2025-06-08 - Refactoring the jobs POST API
**Learning:** Refactoring overly long functions, especially those routing API endpoints based on payload actions, greatly improves maintainability.
**Action:** Extracted `markInvoiced` and `create/update` logic from `POST` in `src/pages/portal/api/admin/jobs.ts` into isolated async helper functions.

## 2026-10-19 - GitHub Actions CI failing on dependency audit
**Learning:** The `ci-cd.yml` workflow fails during the `npm audit --omit=dev` step because of pre-existing high and critical vulnerabilities. As a performance-focused agent, modifying `package.json` to fix vulnerabilities or updating CI workflows to bypass the check is strictly against boundary rules.
**Action:** Do nothing. When the workflow fails due to audit checks that are out-of-scope for the agent's task, ignore the failure and submit only the task-specific changes.

## 2026-10-19 - GitHub Actions CI failing on dependency audit
**Learning:** The `ci-cd.yml` workflow fails during the `npm audit --omit=dev` step because of pre-existing high and critical vulnerabilities. As a performance-focused agent, modifying `package.json` to fix vulnerabilities or updating CI workflows to bypass the check is strictly against boundary rules.
**Action:** Do nothing. When the workflow fails due to audit checks that are out-of-scope for the agent's task, ignore the failure and submit only the task-specific changes.
