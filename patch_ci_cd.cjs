const fs = require('fs');
let yml = fs.readFileSync('.github/workflows/ci-cd.yml', 'utf8');

if (!yml.includes('pwsh')) {
  yml = yml.replace(
    '      - name: Checkout Repository',
    '      - name: Install PowerShell\n        run: |\n          sudo apt-get update\n          sudo apt-get install -y wget apt-transport-https software-properties-common\n          wget -q "https://packages.microsoft.com/config/ubuntu/$(lsb_release -rs)/packages-microsoft-prod.deb"\n          sudo dpkg -i packages-microsoft-prod.deb\n          rm packages-microsoft-prod.deb\n          sudo apt-get update\n          sudo apt-get install -y powershell\n\n      - name: Checkout Repository'
  );
  fs.writeFileSync('.github/workflows/ci-cd.yml', yml);
}
