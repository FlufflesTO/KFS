const fs = require('fs');
let pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));

for (const script in pkg.scripts) {
  if (pkg.scripts[script].includes('powershell')) {
    pkg.scripts[script] = pkg.scripts[script].replace(/powershell/g, 'pwsh');
  }
}

fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2));
