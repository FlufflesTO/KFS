import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const dist = path.join(root, "dist");
const src = path.join(root, "src");
const publicDir = path.join(root, "public");
const clientDist = path.join(dist, "client");
const serverDist = path.join(dist, "server");
const assetRoot = fs.existsSync(clientDist) ? clientDist : dist;

const failures: string[] = [];
const warnings: string[] = [];

function walk(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const file = path.join(dir, entry.name);
    return entry.isDirectory() ? walk(file) : [file];
  });
}

function read(file: string): string {
  return fs.readFileSync(file, "utf8");
}

function rel(file: string): string {
  return path.relative(root, file).replaceAll("\\", "/");
}

function fail(message: string): void {
  failures.push(message);
}

if (!fs.existsSync(dist)) {
  fail("dist directory is missing. Run npm run build:staging first.");
}

// Cloudflare SSR build output structure varies by adapter version. 
// If dist/client and dist/server are missing, but dist/_worker.js and dist/wrangler.json exist,
// it is likely a flat output structure.
const isFlatOutput = !fs.existsSync(clientDist) && !fs.existsSync(serverDist) && fs.existsSync(path.join(dist, "_worker.js"));

if (!isFlatOutput && (!fs.existsSync(clientDist) || !fs.existsSync(serverDist))) {
  fail("Cloudflare SSR build should emit dist/client and dist/server.");
}

if (!isFlatOutput && !fs.existsSync(path.join(serverDist, "entry.mjs"))) {
  fail("Cloudflare SSR server entry is missing.");
}

const serverWrangler = isFlatOutput ? path.join(dist, "wrangler.json") : path.join(serverDist, "wrangler.json");
if (!fs.existsSync(serverWrangler)) {
  fail("Generated server wrangler.json is missing.");
} else {
  const wrangler = read(serverWrangler);
  for (const binding of ['"binding":"DB"', '"binding":"STORAGE"']) {
    if (!wrangler.replace(/\s/g, "").includes(binding)) {
      fail(`Generated wrangler config missing ${binding}`);
    }
  }
}


const sourceFiles = walk(src).filter((file) => /\.(astro|js|ts|css)$/.test(file));
const publicSourceFiles = walk(publicDir).filter((file) => /\.(html|js|css)$/.test(file));
const distFiles = walk(dist);
const textDistFiles = distFiles.filter((file) => /\.(html|mjs|js|css|txt|xml|json)$/.test(file));
const repoTextFiles = walk(root).filter((file) => {
  const relative = rel(file);
  if (relative === "test-auth.js") return false;
  if (
    relative.startsWith("node_modules/") ||
    relative.startsWith("dist/") ||
    relative.startsWith(".wrangler/") ||
    relative.startsWith(".git/") ||
    relative.startsWith(".claude/") ||
    relative.startsWith(".qoder/") ||
    relative.startsWith(".qwen/") ||
    relative.startsWith(".vscode/") ||
    relative.startsWith("antigravity_env/") ||
    relative.startsWith("backups/") ||
    relative.startsWith("conductor/") ||
    relative.startsWith("monitor-results/") ||
    relative.startsWith("playwright-report/") ||
    relative.startsWith("retention-reports/") ||
    relative.startsWith("scratch/") ||
    relative.startsWith("test-results/")
  ) return false;
  return /\.(astro|js|mjs|css|md|sql|json|jsonc|ps1|txt)$/.test(file);
});

const forbiddenOutput = [
  "System Overview",
  "Coming Soon",
  "TechnicalScene",
  "technical-scene",
  "@react-three",
  "three.module",
  "SUPPRESSION RELEASE LOGIC",
  "DETECTION TOPOLOGY",
  "Protection Architecture",
  "critical path",
  "fake telemetry",
  "dashboard widget"
];

for (const file of textDistFiles) {
  const text = read(file);
  for (const term of forbiddenOutput) {
    if (text.toLowerCase().includes(term.toLowerCase())) {
      fail(`forbidden output term "${term}" in ${path.relative(dist, file).replaceAll("\\", "/")}`);
    }
  }

  // Enforce company branding in built HTML titles
  if (file.endsWith(".html")) {
    const titleMatch = text.match(/<title>([^<]+)<\/title>/i);
    if (!titleMatch) {
      fail(`missing <title> tag in built file ${rel(file)}`);
    } else {
      const title = titleMatch[1].trim();
      if (!title.toLowerCase().includes("kharon")) {
        fail(`unbranded page title "${title}" in built file ${rel(file)}`);
      }
    }
  }
}

const forbiddenSourcePatterns = [
  { pattern: /\.(innerHTML|outerHTML)\s*=/i, label: "HTML string injection sink" },
  { pattern: /\.insertAdjacentHTML\s*\(/i, label: "HTML string insertion sink" },
  { pattern: /document\.write(?:ln)?\s*\(/i, label: "document.write sink" },
  { pattern: /\beval\s*\(|new Function\s*\(/i, label: "dynamic code execution sink" },
  { pattern: /hover:-translate/i, label: "hover lift animation" },
  { pattern: /shadow-\[0_0/i, label: "glow shadow utility" },
  { pattern: /font-size:[^;]*vw/i, label: "viewport-scaled font sizing" },
  { pattern: /@react-three|from ["']three|TechnicalScene|technical-scene/i, label: "heavy 3D dependency" },
  { pattern: /security guards?|home alarms?/i, label: "forbidden imagery positioning" },
  { pattern: /favicon\.png|apple-touch-icon\.png|og-image\.jpg|og-twitter\.jpg|kharon-portal-fetch\.js/i, label: "missing public asset reference" },
  { pattern: /href=["']\/src\/|src=["']\/src\//i, label: "source path asset reference" },
  { pattern: /placehold\.it|placehold\.co|via\.placeholder|placeholder\.com|unsplash\.com\/photo/i, label: "unapproved placeholder asset reference" },
  { pattern: /logo-placeholder|dummy-logo|generic-logo|company-logo/i, label: "generic or template brand logo reference" }
];

for (const file of [...sourceFiles, ...publicSourceFiles]) {
  const text = read(file);
  for (const check of forbiddenSourcePatterns) {
    if (check.pattern.test(text)) {
      fail(`${check.label} found in ${rel(file)}`);
    }
  }
}

const assetsDir = path.join(assetRoot, "_astro");
const assets = fs.existsSync(assetsDir) ? fs.readdirSync(assetsDir) : [];
const jsAssets = assets.filter((file) => file.endsWith(".js"));
const allowedPortalJsPatterns = [
  /^dashboard\.astro_astro_type_script_index_0_lang\.[A-Za-z0-9_-]+\.js$/,
  /^dashboard\.astro_astro_type_script_index_1_lang\.[A-Za-z0-9_-]+\.js$/,
  /^FinanceCreateForm\.astro_astro_type_script_index_0_lang\.[A-Za-z0-9_-]+\.js$/,
  /^FinanceLedgerTable\.astro_astro_type_script_index_0_lang\.[A-Za-z0-9_-]+\.js$/,
  /^FinanceSagePanel\.astro_astro_type_script_index_0_lang\.[A-Za-z0-9_-]+\.js$/,
  /^maintenance-request\.astro_astro_type_script_index_0_lang\.[A-Za-z0-9_-]+\.js$/,
  /^log-visit\.astro_astro_type_script_index_0_lang\.[A-Za-z0-9_-]+\.js$/,
  /^operations\.astro_astro_type_script_index_0_lang\.[A-Za-z0-9_-]+\.js$/,
  /^exports\.astro_astro_type_script_index_0_lang\.[A-Za-z0-9_-]+\.js$/,
  /^jobs\.astro_astro_type_script_index_0_lang\.[A-Za-z0-9_-]+\.js$/,
  /^dispatch\.astro_astro_type_script_index_0_lang\.[A-Za-z0-9_-]+\.js$/,
  /^sites\.astro_astro_type_script_index_0_lang\.[A-Za-z0-9_-]+\.js$/,
  /^systems\.astro_astro_type_script_index_0_lang\.[A-Za-z0-9_-]+\.js$/,
  /^users\.astro_astro_type_script_index_0_lang\.[A-Za-z0-9_-]+\.js$/,
  /^schedule\.astro_astro_type_script_index_0_lang\.[A-Za-z0-9_-]+\.js$/,
  /^multi-client\.astro_astro_type_script_index_0_lang\.[A-Za-z0-9_-]+\.js$/,
  /^dom\.[A-Za-z0-9_-]+\.js$/,
  /^portalApi\.[A-Za-z0-9_-]+\.js$/,
  /^_id_\.astro_astro_type_script_index_0_lang\.[A-Za-z0-9_-]+\.js$/,
  /^job-detail\.astro_astro_type_script_index_0_lang\.[A-Za-z0-9_-]+\.js$/,
  /^preload-helper\.[A-Za-z0-9_-]+\.js$/,
  /^multi-client\.astro_astro_type_script_index_0_lang\.[A-Za-z0-9_-]+\.js$/,
  /^page\.[A-Za-z0-9_-]+\.js$/,
  /^hr\.astro_astro_type_script_index_0_lang\.[A-Za-z0-9_-]+\.js$/
];
const unexpectedJsAssets = jsAssets.filter((file) => !allowedPortalJsPatterns.some((pattern) => pattern.test(file)));
const jsBytes = jsAssets.reduce((total, file) => total + fs.statSync(path.join(assetsDir, file)).size, 0);
if (unexpectedJsAssets.length > 0) {
  fail(`unexpected public JavaScript assets: ${unexpectedJsAssets.join(", ")}`);
}
if (jsBytes > 30_000) {
  fail(`portal JavaScript asset budget exceeded: ${jsBytes} bytes`);
}

const cssAssets = assets.filter((file) => file.endsWith(".css"));
const cssBytes = cssAssets.reduce((total, file) => total + fs.statSync(path.join(assetsDir, file)).size, 0);
// Budget revised 2026-06-01 from 100KB → 120KB. The previous 100KB limit was only
// achievable with a structurally-corrupt purge-css.ts that split CSS on '}', destroying
// Tailwind v4's nested @layer cascade. With correct output the @layer utilities alone
// is ~92.5KB (all legitimately used utilities from 103 .astro files). A 115KB review
// threshold is set to flag regressions while leaving headroom for the correct build.
if (cssBytes > 120_000) {
  fail(`CSS asset budget exceeded: ${cssBytes} bytes`);
}
if (cssBytes > 115_000) {
  warnings.push(`CSS asset budget warning: ${cssBytes} bytes is above the 115000-byte review threshold.`);
}


const portalLayout = path.join(root, "src", "layouts", "portal", "PortalLayout.astro");
if (fs.existsSync(portalLayout)) {
  const text = read(portalLayout);
  for (const term of ["plausible.io", "cloudflareinsights.com", "data-domain="]) {
    if (text.includes(term)) fail(`portal layout leaks public analytics marker: ${term}`);
  }
}

const baseLayout = path.join(root, "src", "layouts", "BaseLayout.astro");
if (fs.existsSync(baseLayout)) {
  const text = read(baseLayout);
  for (const term of ["Portal navigation", "kharonPortalFetch", "kharon-csrf-token"]) {
    if (text.includes(term)) fail(`public base layout leaks portal shell marker: ${term}`);
  }
}

for (const asset of ["favicon.svg", "brand/kharon-mark.svg", "brand/kharon-full-logo.svg", "og/kharon-og.png", "_headers", "_redirects"]) {
  if (!fs.existsSync(path.join(assetRoot, asset))) {
    fail(`missing client asset: ${asset}`);
  }
}

const expectedSourceRoutes = [
  "index.astro",
  "gas-suppression.astro",
  "fire-detection.astro",
  "compliance-maintenance.astro",
  "critical-infrastructure.astro",
  "emergency-support.astro",
  "security-systems.astro",
  "industries.astro",
  "about.astro",
  "contact.astro",
  "404.astro",
  "portal/login.astro",
  "portal/tech/dashboard.astro",
  "portal/tech/jobs/[id].astro",
  "portal/admin/dashboard.astro",
  "portal/admin/planning.astro",
  "portal/client/dashboard.astro",
  "portal/client/quotes.astro",
  "portal/finance/dashboard.astro",
  "portal/api/auth.ts",
  "portal/api/admin/export.ts",
  "portal/api/admin/import.ts",
  "portal/api/admin/client-site-access.ts",
  "portal/account/mfa.astro",
  "portal/api/mfa.ts",
  "portal/reset.astro",
  "portal/api/reset-password.ts",
  "portal/api/submit-jobcard.ts",
  "portal/api/offline-sync.ts",
  "portal/api/approve-quote.ts",
  "portal/api/finance/payments.ts",
  "portal/api/finance/export.ts",
  "portal/api/file/[...key].ts",
  "portal/admin/hr.astro",
  "portal/api/staff/upload-file.ts",
  "portal/api/staff/delete-file.ts"
];

for (const route of expectedSourceRoutes) {
  if (!fs.existsSync(path.join(src, "pages", route))) {
    fail(`missing source route: ${route}`);
  }
}

const requiredSourceTerms = new Map<string, string[]>([
  ["src/middleware.ts", ["sessionCookieName", "/portal/tech/", "/portal/finance/", "/portal/client/", "context.locals.user"]],     
  ["src/pages/portal/api/auth.ts", ["verifyPassword", "verifyTotpCode", "Set-Cookie", "redirectTo"]],
  ["src/pages/portal/api/admin/users.ts", ["reset-link", "password_reset_tokens", "resetUrl", "mfa_required"]],
  ["src/pages/portal/api/admin/export.ts", ["admin.export", "text/csv", "content-disposition"]],
  ["src/pages/portal/api/admin/import.ts", ["admin.import", "csvObjects", "250 rows"]],
  ["src/pages/portal/api/admin/client-site-access.ts", ["admin.client_site_access", "client_site_access", "grant", "revoke"]],     
  ["src/pages/portal/account/mfa.astro", ["/portal/api/mfa", "Multi-factor authentication", "Generate Authenticator Setup"]],      
  ["src/pages/portal/api/mfa.ts", ["auth.mfa_enable", "encryptMfaSecret", "verifyTotpCode"]],
  ["src/pages/portal/api/reset-password.ts", ["auth.password_reset", "password_reset_tokens", "hashPassword"]],
  ["src/pages/portal/reset.astro", ["/portal/api/reset-password", "Reset Portal Password"]],
  ["src/pages/portal/api/submit-jobcard.ts", ["db.batch", "jobcards/job-", "status = 'Completed'", "next_due_date", "financial_records"]],
  ["src/pages/portal/api/offline-sync.ts", ["startIdempotentMutation", "offline.draft_sync", "jobcard_draft"]],
  ["src/pages/portal/api/file/[...key].ts", ["job-evidence/", "job_evidence_files", "documentAccessLog"]],
  ["src/pages/portal/tech/dashboard.astro", ["assigned_technician_id", "/portal/tech/jobs/"]],
  ["src/pages/portal/tech/jobs/[id]/jobcard.astro", ["/portal/api/submit-jobcard", "evidencePhotos", "/portal/api/job-visits", "Unable To Complete"]],
  ["src/pages/portal/client/dashboard.astro", ["/portal/api/file/", "/portal/api/approve-quote", "Mapped client sites"]],
  ["src/pages/portal/client/quotes.astro", ["Quote, invoice and payment history", "Commercial ledger", "/portal/api/approve-quote"]],
  ["src/pages/portal/finance/dashboard.astro", ["financial_records", "payment_status", "FinanceCreateForm", "FinanceLedgerTable"]],
  ["src/components/portal/finance/FinanceLedgerTable.astro", ["/portal/api/finance/export"]],
  ["src/lib/forms/unifiedSubmit.ts", ["/portal/api/finance/payments"]],
  ["src/pages/portal/admin/planning.astro", ["Dispatch planner", "Lifecycle due calendar", "Technician load", "riskForDueDate"]],  
  ["src/pages/portal/api/finance/payments.ts", ["finance.payment", "Payment", "Settled"]],
  ["src/pages/portal/api/finance/export.ts", ["finance.export", "text/csv", "content-disposition"]],
  ["src/layouts/portal/PortalLayout.astro", ["Astro.locals.user", "Portal navigation"]],
  ["src/pages/portal/admin/hr.astro", ["staff_members", "staff-files/", "/portal/api/staff/"]]
]);

for (const [file, terms] of requiredSourceTerms) {
  const fullPath = path.join(root, file);
  if (!fs.existsSync(fullPath)) {
    fail(`missing required file: ${file}`);
    continue;
  }
  const text = read(fullPath);
  for (const term of terms) {
    if (!text.includes(term)) fail(`${file} missing required implementation marker: ${term}`);
  }
}

const roadmap = path.join(root, "docs", "roadmap", "MASTER_ROADMAP.md");
if (!fs.existsSync(roadmap)) {
  fail("MASTER_ROADMAP.md is missing.");
} else {
  const text = read(roadmap);
  for (const term of [
    "Review Update - 2026-05-21 Portal Security And Production Hardening",
    "Review Update - 2026-05-21 Monitoring And Backup SOP Pass",
    "Review Update - 2026-05-24 Data Retention Governance Pass",
    "CSRF",
    "Production Gate Checklist"
  ]) {
    if (!text.includes(term)) fail(`MASTER_ROADMAP.md missing production hardening marker: ${term}`);
  }
}

const operationsSop = path.join(root, "docs", "roadmap", "OPERATIONS_SOP.md");
if (!fs.existsSync(operationsSop)) {
  fail("OPERATIONS_SOP.md is missing.");
} else {
  const text = read(operationsSop);
  for (const term of ["Monitoring Check", "D1 Backup", "R2 Evidence Backup", "Retention Review", "Document Access Review", "User Onboarding SOP", "Dispatch And Jobcard SOP", "Portal Access Incident Response", "Production Cutover Checklist", "portal:monitor", "portal:backup:d1", "portal:retention:report"]) {
    if (!text.includes(term)) fail(`OPERATIONS_SOP.md missing operational marker: ${term}`);
  }
}

const retentionPolicy = path.join(root, "docs", "roadmap", "DATA_RETENTION_POLICY.md");
if (!fs.existsSync(retentionPolicy)) {
  fail("DATA_RETENTION_POLICY.md is missing.");
} else {
  const text = read(retentionPolicy);
  for (const term of ["Retention Matrix", "Legal Hold", "portal:retention:report", "Jobcard PDFs"]) {
    if (!text.includes(term)) fail(`DATA_RETENTION_POLICY.md missing retention marker: ${term}`);
  }
}

const controlledSeedProcess = path.join(root, "docs", "roadmap", "CONTROLLED_SEED_PROCESS.md");
if (!fs.existsSync(controlledSeedProcess)) {
  fail("CONTROLLED_SEED_PROCESS.md is missing.");
} else {
  const text = read(controlledSeedProcess);
  for (const term of ["Forbidden In Committed Seed Files", "password hashes", "Recommended Seed Order", "Pre-Seed Checklist", "Post-Seed Checklist"]) {
    if (!text.includes(term)) fail(`CONTROLLED_SEED_PROCESS.md missing seed-control marker: ${term}`);
  }
}

for (const script of ["scripts/portal-monitor.ps1", "scripts/portal-backup.ps1", "scripts/portal-retention-report.ps1", "scripts/portal-role-qa.ps1"]) {
  if (!fs.existsSync(path.join(root, script))) fail(`missing operational script: ${script}`);
}

const packageJson = fs.existsSync(path.join(root, "package.json")) ? read(path.join(root, "package.json")) : "";
for (const term of ["portal:monitor", "portal:backup:d1", "portal:retention:report", "portal:qa:roles"]) {
  if (!packageJson.includes(term)) fail(`package.json missing operational script: ${term}`);
}

const portalRoleQa = path.join(root, "scripts", "portal-role-qa.ps1");
if (fs.existsSync(portalRoleQa)) {
  const text = read(portalRoleQa);
  for (const term of ["KHARON_QA_ADMIN_EMAIL", "SkipCredentialTests", "missing CSRF blocked", "/portal/tech/dashboard"]) {
    if (!text.includes(term)) fail(`portal-role-qa.ps1 missing role QA marker: ${term}`);
  }
}

const gitignore = fs.existsSync(path.join(root, ".gitignore")) ? read(path.join(root, ".gitignore")) : "";
for (const term of ["backups/", "monitor-results/", "retention-reports/"]) {
  if (!gitignore.includes(term)) fail(`.gitignore missing local operational export path: ${term}`);
}

const csrfPath = path.join(root, "src", "lib", "server", "csrf.ts");
if (!fs.existsSync(csrfPath)) {
  fail("src/lib/server/csrf.ts is missing.");
} else {
  const text = read(csrfPath);
  for (const term of ["createCsrfToken", "verifyCsrfRequest", "csrfHiddenInput", "csrfMetaTag", "Security token is missing or invalid."]) {
    if (!text.includes(term)) fail(`csrf.ts missing required marker: ${term}`);
  }
}

const middlewareText = fs.existsSync(path.join(root, "src", "middleware.ts")) ? read(path.join(root, "src", "middleware.ts")) : "";
for (const term of ["verifyCsrfRequest", "portal.maintenance_request", "portal.admin.users", "portal.admin.import", "security.rate_limit"]) {
  if (!middlewareText.includes(term)) fail(`middleware missing portal write hardening marker: ${term}`);
}

for (const term of ["withSecurityHeaders", "Content-Security-Policy", "Strict-Transport-Security", "X-Frame-Options", "Permissions-Policy"]) {
  if (!middlewareText.includes(term)) fail(`middleware missing runtime security header marker: ${term}`);
}

const portalSourceText = sourceFiles.map((file) => read(file)).join("\n");
if (!portalSourceText.includes("x-csrf-token") && !portalSourceText.includes("csrfToken")) {
  fail("portal source missing CSRF token submission marker.");
}

const footerText = fs.existsSync(path.join(root, "src", "components", "layout", "Footer.astro"))
  ? read(path.join(root, "src", "components", "layout", "Footer.astro"))
  : "";
const headerText = fs.existsSync(path.join(root, "src", "components", "layout", "Header.astro"))
  ? read(path.join(root, "src", "components", "layout", "Header.astro"))
  : "";
const siteDataText = fs.existsSync(path.join(root, "src", "data", "site.ts")) ? read(path.join(root, "src", "data", "site.ts")) : "";
if (!footerText.includes('href="/about"') && !headerText.includes('href="/about"') && !siteDataText.includes('href: "/about"')) {  
  fail("About link is not visible in footer/header source.");
}

const emergencyText = fs.existsSync(path.join(root, "src", "pages", "emergency-support.astro"))
  ? read(path.join(root, "src", "pages", "emergency-support.astro"))
  : "";
for (const term of ["Critical system fault", "Access Records", "Urgent technical request", "Compliance intervention"]) {
  if (!emergencyText.includes(term)) fail(`emergency-support page missing decision CTA language: ${term}`);
}

const forbiddenSecretLikeStrings = [
  ["your", "secure", "password"].join("-"),
  ["replace", "with", "current", "test", "password"].join("-"),
  `password${123}`,
  `P@ssw${0}rd`,
  `admin${123}`,
  `tech${123}`
];
for (const file of repoTextFiles) {
  const text = read(file);
  for (const term of forbiddenSecretLikeStrings) {
    if (text.includes(term)) fail(`forbidden temporary password marker "${term}" found in ${rel(file)}`);
  }
}

const headers = fs.existsSync(path.join(publicDir, "_headers")) ? read(path.join(publicDir, "_headers")) : "";
for (const header of [
  "Content-Security-Policy",
  "X-Content-Type-Options",
  "Strict-Transport-Security",
  "Permissions-Policy",
  "Cross-Origin-Opener-Policy"
]) {
  if (!headers.includes(header)) fail(`_headers missing ${header}`);
}

const schema = fs.existsSync(path.join(root, "schema.sql")) ? read(path.join(root, "schema.sql")) : "";
for (const term of ["CREATE TABLE IF NOT EXISTS users", "CHECK (role IN ('tech', 'admin', 'client', 'finance'))", "CREATE TABLE IF NOT EXISTS jobs", "CREATE TABLE IF NOT EXISTS financial_records"]) {
  if (!schema.includes(term)) fail(`schema.sql missing ${term}`);
}

for (const term of ["CREATE TABLE IF NOT EXISTS offline_mutations", "idempotency_key TEXT NOT NULL UNIQUE", "idx_offline_mutations_actor_created"]) {
  if (!schema.includes(term)) fail(`schema.sql missing offline mutation marker: ${term}`);
}

for (const term of ["CREATE TABLE IF NOT EXISTS job_evidence_files", "storage_path TEXT NOT NULL UNIQUE", "idx_job_evidence_job"]) 
{
  if (!schema.includes(term)) fail(`schema.sql missing evidence marker: ${term}`);
}

for (const term of ["CREATE TABLE IF NOT EXISTS document_access_logs", "idx_document_access_actor_created", "idx_document_access_path_created"]) {
  if (!schema.includes(term)) fail(`schema.sql missing document access marker: ${term}`);
}

for (const term of ["CREATE TABLE IF NOT EXISTS client_site_access", "PRIMARY KEY (user_id, site_id)", "idx_client_site_access_site"]) {
  if (!schema.includes(term)) fail(`schema.sql missing client site access marker: ${term}`);
}

for (const term of ["CREATE TABLE IF NOT EXISTS password_reset_tokens", "token_hash TEXT NOT NULL UNIQUE", "idx_password_reset_tokens_expiry"]) {
  if (!schema.includes(term)) fail(`schema.sql missing password reset marker: ${term}`);
}

for (const term of ["mfa_required INTEGER NOT NULL DEFAULT 0", "mfa_secret_encrypted TEXT", "idx_users_mfa_required"]) {
  if (!schema.includes(term)) fail(`schema.sql missing MFA marker: ${term}`);
}

const result = {
  ok: failures.length === 0,
  failures,
  warnings,
  mode: fs.existsSync(serverDist) ? "server" : "static",
  jsAssets: assets.filter((file) => file.endsWith(".js")),
  jsBytes: assets.filter((file) => file.endsWith(".js")).reduce((total, file) => total + fs.statSync(path.join(assetsDir, file)).size, 0),
  cssAssets: assets.filter((file) => file.endsWith(".css")),
  cssBytes: assets.filter((file) => file.endsWith(".css")).reduce((total, file) => total + fs.statSync(path.join(assetsDir, file)).size, 0)
};

console.log(JSON.stringify(result, null, 2));
if (failures.length) process.exit(1);
