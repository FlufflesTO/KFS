## 2025-06-08 - Refactoring the jobs POST API
**Vulnerability:** Complex routing structures can accidentally combine access boundaries.
**Learning:** Organizing route handling into separate functions ensures the exact required conditions can be met and reviewed more easily.
**Prevention:** Continuing to separate logical actions into bounded helper functions underneath standard access controls.
## 2025-07-20 - Ensure vulnerabilities remain visible
**Vulnerability:** Adding `|| true` to `npm audit` bypasses security checks and hides vulnerabilities.
**Learning:** CI failures for security audits should not be bypassed with `|| true`. Instead, the code should be submitted with the CI failure to ensure vulnerabilities remain visible, or the packages should be updated.
**Prevention:** Never use `|| true` on security audit steps in CI pipelines.
