1. **Understand the problem**:
   - The CI is failing at the `Build Deployment Artifacts` step with the error `sh: 1: powershell: not found` and exit code `127`.
   - The workflow `.github/workflows/ci-cd.yml` installed PowerShell using `sudo apt-get install -y powershell`.
   - The journal `.jules/memory` states: "If a GitHub Actions workflow on an Ubuntu runner fails with `powershell: not found` (exit code 127) when executing `package.json` scripts, it is because the `powershell` apt package installs the binary as `pwsh`. Resolve this by adding `sudo ln -s /usr/bin/pwsh /usr/bin/powershell || true` to the workflow file after installation, rather than modifying `package.json`."

2. **Formulate a fix**:
   - Use `replace_with_git_merge_diff` on `.github/workflows/ci-cd.yml` to add the required symlink after PowerShell installation.

   ```
   <<<<<<< SEARCH
         - name: Setup PowerShell
           run: |
             sudo apt-get update
             sudo apt-get install -y wget apt-transport-https software-properties-common
             wget -q "https://packages.microsoft.com/config/ubuntu/$(lsb_release -rs)/packages-microsoft-prod.deb"
             sudo dpkg -i packages-microsoft-prod.deb
             sudo apt-get update
             sudo apt-get install -y powershell
   =======
         - name: Setup PowerShell
           run: |
             sudo apt-get update
             sudo apt-get install -y wget apt-transport-https software-properties-common
             wget -q "https://packages.microsoft.com/config/ubuntu/$(lsb_release -rs)/packages-microsoft-prod.deb"
             sudo dpkg -i packages-microsoft-prod.deb
             sudo apt-get update
             sudo apt-get install -y powershell
             sudo ln -s /usr/bin/pwsh /usr/bin/powershell || true
   >>>>>>> REPLACE
   ```

3. **Verify functionality**:
   - The fix handles the GitHub Action CI configuration. We can check if `npm run lint` and `npm run check` still pass locally.
   - We will complete the pre-commit steps to ensure verification.
   - Use the `submit` tool to update the `perf-db-stats` branch with this fix.
