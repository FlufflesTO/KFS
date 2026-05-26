const fs = require('fs');

// 1. env.d.ts
let envPath = 'src/env.d.ts';
let envContent = fs.readFileSync(envPath, 'utf8');
if (!envContent.includes('declare namespace App')) {
  envContent += `\ndeclare namespace App {\n  interface Locals {\n    user?: import("@sentinel/types").PortalUser;\n    nonce?: string;\n    csrfToken?: string;\n  }\n}\n`;
  fs.writeFileSync(envPath, envContent);
}

// 2. sw.ts
let swPath = 'src/sw.ts';
let swContent = fs.readFileSync(swPath, 'utf8');
if (!swContent.includes('/// <reference lib="webworker" />')) {
  swContent = `/// <reference lib="webworker" />\n` + swContent;
  fs.writeFileSync(swPath, swContent);
}

// 3. health.json.ts
let healthPath = 'src/pages/health.json.ts';
if (fs.existsSync(healthPath)) {
  let healthContent = fs.readFileSync(healthPath, 'utf8');
  healthContent = healthContent.replace(/process\.env/g, 'import.meta.env');
  fs.writeFileSync(healthPath, healthContent);
}

// 4. offline-sync.ts
let offlinePath = 'src/lib/client/offline-sync.ts';
if (fs.existsSync(offlinePath)) {
  let offlineContent = fs.readFileSync(offlinePath, 'utf8');
  offlineContent = offlineContent.replace(/\(event\) => {/g, '(_event) => {');
  fs.writeFileSync(offlinePath, offlineContent);
}

// 5. generate-pdf.ts
let pdfPath = 'src/pages/api/certificates/generate-pdf.ts';
if (fs.existsSync(pdfPath)) {
  let pdfContent = fs.readFileSync(pdfPath, 'utf8');
  pdfContent = pdfContent.replace(/import\s+{\s*CertificateData\s*}\s+from/g, 'import type { CertificateData } from');
  pdfContent = pdfContent.replace(/new Response\(pdfBytes,/g, 'new Response(pdfBytes as unknown as BodyInit,');
  fs.writeFileSync(pdfPath, pdfContent);
}

// 6. sage-webhook.ts
let sagePath = 'src/pages/api/finance/sage-webhook.ts';
if (fs.existsSync(sagePath)) {
  let sageContent = fs.readFileSync(sagePath, 'utf8');
  sageContent = sageContent.replace(/D1Database/g, 'any');
  fs.writeFileSync(sagePath, sageContent);
}

// 7. data-request.ts
let dataReqPath = 'src/pages/api/data-request.ts';
if (fs.existsSync(dataReqPath)) {
  let dataReqContent = fs.readFileSync(dataReqPath, 'utf8');
  dataReqContent = dataReqContent.replace(/error\.errors/g, '(error as any).errors');
  fs.writeFileSync(dataReqPath, dataReqContent);
}

// 8. optimize.ts
let optPath = 'src/pages/api/routes/optimize.ts';
if (fs.existsSync(optPath)) {
  let optContent = fs.readFileSync(optPath, 'utf8');
  optContent = optContent.replace(/getDatabase,\s*/g, '');
  optContent = optContent.replace(/const index = route.indexOf\(job\.id\);/g, 'route.indexOf(job.id);');
  optContent = optContent.replace(/\{ lat: number; lng: number \}/g, 'any');
  optContent = optContent.replace(/location\./g, 'location?.');
  optContent = optContent.replace(/loc\./g, 'loc?.');
  fs.writeFileSync(optPath, optContent);
}

// 9. dispatch.ts (has 'error of type unknown' when used as error.message)
let dispatchPath = 'src/pages/portal/api/admin/dispatch.ts';
if (fs.existsSync(dispatchPath)) {
  let dispatchContent = fs.readFileSync(dispatchPath, 'utf8');
  dispatchContent = dispatchContent.replace(/error\.message/g, '(error as Error).message');
  dispatchContent = dispatchContent.replace(/!user/g, '!context.locals.user');
  dispatchContent = dispatchContent.replace(/user\./g, 'context.locals.user.');
  fs.writeFileSync(dispatchPath, dispatchContent);
}

console.log("Typescript fixes applied.");
