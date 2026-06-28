const fs = require('fs');
let yml = fs.readFileSync('.github/workflows/ci-cd.yml', 'utf8');
yml = yml.replace('sudo apt-get install -y powershell', 'sudo apt-get install -y powershell\n          sudo ln -sf /usr/bin/pwsh /usr/bin/powershell');
fs.writeFileSync('.github/workflows/ci-cd.yml', yml);
