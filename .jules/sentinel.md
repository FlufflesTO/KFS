## 2025-06-08 - Refactoring the jobs POST API
**Vulnerability:** Complex routing structures can accidentally combine access boundaries.
**Learning:** Organizing route handling into separate functions ensures the exact required conditions can be met and reviewed more easily.
**Prevention:** Continuing to separate logical actions into bounded helper functions underneath standard access controls.
## 2026-10-06 - Fixing CI Action PowerShell Issues
**Vulnerability:** In Ubuntu CI runners, the `powershell` command may be missing or incompatible with scripts running as `pwsh` in `package.json`.
**Learning:** Ubuntu 24.04 and up have changes that might require mapping the `powershell` executable explicitly to `pwsh` using a symlink if `package.json` continues to use `powershell`.
**Prevention:** Symlinking `pwsh` to `powershell` (i.e. `sudo ln -sf /usr/bin/pwsh /usr/bin/powershell`) immediately after install in `.github/workflows/ci-cd.yml` avoids modifying every script in `package.json` and ensures compatibility.
## 2026-10-06 - Fixing CI Action tsx Issues
**Vulnerability:** In Ubuntu CI runners, the `tsx` command may be missing.
**Learning:** `tsx` should be installed globally or via npm before running `npx tsx scripts/audit-site.ts` in `.github/workflows/ci-cd.yml` or adding it as dev dependency in `package.json`.
**Prevention:** Installing `tsx` using `npm install tsx -D` avoids modifying every script in `package.json` and ensures compatibility.
