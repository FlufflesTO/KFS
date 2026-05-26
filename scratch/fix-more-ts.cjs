const fs = require('fs');

// 1. tsconfig.json
let tsPath = 'tsconfig.json';
let tsContent = fs.readFileSync(tsPath, 'utf8');
if (!tsContent.includes('"WebWorker"')) {
  tsContent = tsContent.replace(/"lib": \[\s*"DOM",\s*"DOM\.Iterable",\s*"ESNext"\s*\],/, '"lib": ["DOM", "DOM.Iterable", "ESNext", "WebWorker"],');
  // fallback if the regex fails
  if (!tsContent.includes('WebWorker')) {
     tsContent = tsContent.replace(/"compilerOptions": \{/, '"compilerOptions": {\n    "lib": ["DOM", "DOM.Iterable", "ESNext", "WebWorker"],');
  }
  fs.writeFileSync(tsPath, tsContent);
}

// 2. optimize.ts
let optPath = 'src/pages/api/routes/optimize.ts';
if (fs.existsSync(optPath)) {
  let optContent = fs.readFileSync(optPath, 'utf8');
  optContent = optContent.replace(/import { getDatabase } from "..\/..\/lib\/server\/bindings";/g, '');
  optContent = optContent.replace(/const index = route.indexOf\(job.id\);/g, 'route.indexOf(job.id);');
  optContent = optContent.replace(/lat: any; lng: any/g, 'lat: number; lng: number');
  optContent = optContent.replace(/lat: any, lng: any/g, 'lat: number, lng: number');
  optContent = optContent.replace(/address: any/g, 'address: string');
  fs.writeFileSync(optPath, optContent);
}

// 3. dispatch.ts
let dispPath = 'src/pages/portal/api/admin/dispatch.ts';
if (fs.existsSync(dispPath)) {
  let dispContent = fs.readFileSync(dispPath, 'utf8');
  dispContent = dispContent.replace(/tech!\./g, 'tech?.');
  dispContent = dispContent.replace(/job!\./g, 'job?.');
  fs.writeFileSync(dispPath, dispContent);
}

console.log("Fixed files.");
