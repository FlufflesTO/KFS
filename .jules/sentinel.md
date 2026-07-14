## 2025-06-08 - Refactoring the jobs POST API
**Vulnerability:** Complex routing structures can accidentally combine access boundaries.
**Learning:** Organizing route handling into separate functions ensures the exact required conditions can be met and reviewed more easily.
**Prevention:** Continuing to separate logical actions into bounded helper functions underneath standard access controls.
## 2025-07-14 - Use Uint8Array for timing-safe string comparisons
**Vulnerability:** String-based timing-safe comparison loops (like comparing characters using `.charCodeAt`) can leak string length and are generally less secure in JavaScript due to internal string representations and optimization behavior. Several parts of the application were using a custom string comparison `constantTimeEqual` function.
**Learning:** Using `Uint8Array` combined with `crypto.subtle` timing-safe capabilities or a strict binary comparison is essential to completely prevent timing attacks when comparing sensitive tokens (such as passwords, MFA codes, or webhook secrets).
**Prevention:** Avoid string-based security comparisons. Always encode sensitive strings to `Uint8Array` (e.g., using `TextEncoder`) and use the centralized `timingSafeEqual` function exported from `src/lib/server/auth.ts`.
## 2025-07-14 - Never bypass security audits in CI without strict review
**Vulnerability:** Automatically forcing major updates (e.g., `npm audit fix --force`) or entirely bypassing CI audit failures (e.g., via `|| true`) can introduce silent architectural breaking changes or ignore critical runtime security flaws just to appease the pipeline build.
**Learning:** `package.json` updates and security remediations must be explicitly planned and manually reviewed. If an audit fails due to deeply nested peer dependencies, the correct process is to fix the dependency tree gracefully or accept the pipeline failure for transparency, rather than masking it.
**Prevention:** If an audit fix modifies core dependencies unexpectedly, restore the original lockfiles, accept the CI failure, and escalate for manual resolution.
## 2025-07-14 - CI Pipeline Tooling Dependencies
**Vulnerability:** CI pipelines that depend on non-standard executable aliases across platforms (e.g. `pwsh` vs `powershell`) can fail unexpectedly when the environment changes or if setup tools are improperly aliased during run initialization.
**Learning:** For PowerShell scripts in CI, while creating symlinks is a workaround, the true problem usually lies in the alias mismatch between `pwsh` (PowerShell Core, which is native in GitHub Actions Ubuntu images) and `powershell` (the alias defined in the `package.json`).
**Prevention:** If `powershell` executable is missing but `pwsh` is installed natively by the runner, it is safer to ensure the build script correctly references `pwsh` or creates an exact symlink if `package.json` shouldn't be altered.
