🔧 [CI] fix powershell not found in ubuntu-latest runners

🎯 **What:** The GitHub actions CI failed with exit code 127 because `powershell` command was not found on `ubuntu-latest`. It attempts to use powershell to build the deployment artifact. We updated the package.json to use `node scripts/run-ps1.mjs` which attempts to use `pwsh` (powershell core) first, and falls back to `powershell`, making it cross platform. We also explicitly configured the `.github/workflows/ci-cd.yml` file to use bash shell for the `npm run build:production` to avoid any issues with the runner using its default.
