## 2025-06-08 - Refactoring the jobs POST API
**Vulnerability:** Complex routing structures can accidentally combine access boundaries.
**Learning:** Organizing route handling into separate functions ensures the exact required conditions can be met and reviewed more easily.
**Prevention:** Continuing to separate logical actions into bounded helper functions underneath standard access controls.
## 2026-07-11 - NPM Audit Failure
**Vulnerability:** Core dependencies (Astro, esbuild, wrangler, undici, vite, ws) had vulnerabilities in CI causing `npm audit` to fail and return an exit code 1.
**Learning:** `npm audit fix --force` updates major dependency versions directly in `package.json`, which breaks strict project constraints about not modifying dependencies or architecture without instruction.
**Prevention:** If an `npm audit` failure occurs in CI due to major vulnerable versions, do NOT modify the workflow to bypass the audit (`|| true`) and do NOT commit a breaking `package.json` update. Submit the code with the CI failure visible so the project maintainers can handle the major version upgrades safely.
