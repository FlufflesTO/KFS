
## 2025-08-25 - Use cross-platform `pwsh` over `powershell` in npm scripts
**Learning:** In modern CI environments like GitHub Actions running on Ubuntu 24.04, PowerShell Core is installed as `pwsh` instead of `powershell`. Using `powershell` in `package.json` scripts will cause the CI pipeline to fail with exit code 127 (`powershell: not found`).
**Action:** Use `pwsh -NoProfile -ExecutionPolicy Bypass -File ...` for all PowerShell scripts invoked from `package.json` to ensure cross-platform compatibility across Windows developer machines and Linux CI runners.
