import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const dist = path.join(root, "dist");
const src = path.join(root, "src");
const publicDir = path.join(root, "public");
const clientDist = path.join(dist, "client");
const serverDist = path.join(dist, "server");
const assetRoot = fs.existsSync(clientDist) ? clientDist : dist;

const failures = [];
const warnings = [];

function walk(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const file = path.join(dir, entry.name);
    return entry.isDirectory() ? walk(file) : [file];
  });
}

function read(file) {
  return fs.readFileSync(file, "utf8");
}

function rel(file) {
  return path.relative(root, file).replaceAll("\\", "/");
}

function fail(message) {
  failures.push(message);
}

if (!fs.existsSync(dist)) {
  fail("dist directory is missing. Run npm run build:staging first.");
}

const sourceFiles = walk(src).filter((file) => /\.(astro|js|css)$/.test(file));
const distFiles = walk(dist);
const textDistFiles = distFiles.filter((file) => /\.(html|mjs|js|css|txt|xml|json)$/.test(file));
const repoTextFiles = walk(root).filter((file) => {
  const relative = rel(file);
  if (
    relative.startsWith("node_modules/") ||
    relative.startsWith("dist/") ||
    relative.startsWith(".wrangler/") ||
    relative.startsWith(".git/") ||
    relative.startsWith("backups/") ||
    relative.startsWith("monitor-results/")
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
}

const forbiddenSourcePatterns = [
  { pattern: /hover:-translate/i, label: "hover lift animation" },
  { pattern: /shadow-\[0_0/i, label: "glow shadow utility" },
  { pattern: /font-size:[^;]*vw/i, label: "viewport-scaled font sizing" },
  { pattern: /@react-three|from ["']three|TechnicalScene|technical-scene/i, label: "heavy 3D dependency" },
  { pattern: /security guards?|home alarms?/i, label: "forbidden imagery positioning" }
];

for (const file of sourceFiles) {
  const text = read(file);
  for (const check of forbiddenSourcePatterns) {
    if (check.pattern.test(text)) {
      fail(`${check.label} found in ${rel(file)}`);
    }
  }
}

if (!fs.existsSync(clientDist) || !fs.existsSync(serverDist)) {
  fail("Cloudflare SSR build should emit dist/client and dist/server.");
}

if (!fs.existsSync(path.join(serverDist, "entry.mjs"))) {
  fail("Cloudflare SSR server entry is missing.");
}

const serverWrangler = path.join(serverDist, "wrangler.json");
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

const assetsDir = path.join(assetRoot, "_astro");
const assets = fs.existsSync(assetsDir) ? fs.readdirSync(assetsDir) : [];
const jsAssets = assets.filter((file) => file.endsWith(".js"));
if (jsAssets.length > 0) {
  fail(`unexpected public JavaScript assets: ${jsAssets.join(", ")}`);
}

const cssAssets = assets.filter((file) => file.endsWith(".css"));
const cssBytes = cssAssets.reduce((total, file) => total + fs.statSync(path.join(assetsDir, file)).size, 0);
if (cssBytes > 42_000) {
  fail(`CSS asset budget exceeded: ${cssBytes} bytes`);
}

for (const asset of ["favicon.svg", "og/kharon-og.svg", "_headers", "_redirects"]) {
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
  "portal/admin/dashboard.astro",
  "portal/client/dashboard.astro",
  "portal/finance/dashboard.astro",
  "portal/api/auth.js",
  "portal/api/admin/export.js",
  "portal/api/admin/import.js",
  "portal/account/mfa.astro",
  "portal/api/mfa.js",
  "portal/reset.astro",
  "portal/api/reset-password.js",
  "portal/api/submit-jobcard.js",
  "portal/api/approve-quote.js",
  "portal/api/finance/payments.js",
  "portal/api/finance/export.js",
  "portal/api/file/[...key].js"
];

for (const route of expectedSourceRoutes) {
  if (!fs.existsSync(path.join(src, "pages", route))) {
    fail(`missing source route: ${route}`);
  }
}

const requiredSourceTerms = new Map([
  ["src/middleware.js", ["sessionCookieName", "/portal/tech/", "/portal/finance/", "/portal/client/", "context.locals.user"]],
  ["src/pages/portal/api/auth.js", ["verifyPassword", "verifyTotpCode", "Set-Cookie", "redirectTo"]],
  ["src/pages/portal/api/admin/users.js", ["reset-link", "password_reset_tokens", "resetUrl", "mfa_required"]],
  ["src/pages/portal/api/admin/export.js", ["admin.export", "text/csv", "content-disposition"]],
  ["src/pages/portal/api/admin/import.js", ["admin.import", "csvObjects", "250 rows"]],
  ["src/pages/portal/account/mfa.astro", ["/portal/api/mfa", "Multi-factor authentication", "Generate authenticator setup"]],
  ["src/pages/portal/api/mfa.js", ["auth.mfa_enable", "encryptMfaSecret", "verifyTotpCode"]],
  ["src/pages/portal/api/reset-password.js", ["auth.password_reset", "password_reset_tokens", "hashPassword"]],
  ["src/pages/portal/reset.astro", ["/portal/api/reset-password", "Reset portal password"]],
  ["src/pages/portal/api/submit-jobcard.js", ["db.batch", "jobcards/job-", "status = 'Completed'", "next_due_date", "financial_records"]],
  ["src/pages/portal/api/file/[...key].js", ["job-evidence/", "job_evidence_files", "documentAccessLog"]],
  ["src/pages/portal/tech/dashboard.astro", ["assigned_technician_id", "/portal/api/submit-jobcard", "evidencePhotos"]],
  ["src/pages/portal/client/dashboard.astro", ["/portal/api/file/", "/portal/api/approve-quote"]],
  ["src/pages/portal/finance/dashboard.astro", ["financial_records", "payment_status", "/portal/api/finance/export", "/portal/api/finance/payments"]],
  ["src/pages/portal/api/finance/payments.js", ["finance.payment", "Payment", "Settled"]],
  ["src/pages/portal/api/finance/export.js", ["finance.export", "text/csv", "content-disposition"]],
  ["src/layouts/portal/PortalLayout.astro", ["Astro.locals.user", "Portal navigation"]]
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
  for (const term of ["Monitoring Check", "D1 Backup", "R2 Evidence Backup", "Retention Review", "Document Access Review", "portal:monitor", "portal:backup:d1", "portal:retention:report"]) {
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

for (const script of ["scripts/portal-monitor.ps1", "scripts/portal-backup.ps1", "scripts/portal-retention-report.ps1"]) {
  if (!fs.existsSync(path.join(root, script))) fail(`missing operational script: ${script}`);
}

const packageJson = fs.existsSync(path.join(root, "package.json")) ? read(path.join(root, "package.json")) : "";
for (const term of ["portal:monitor", "portal:backup:d1", "portal:retention:report"]) {
  if (!packageJson.includes(term)) fail(`package.json missing operational script: ${term}`);
}

const gitignore = fs.existsSync(path.join(root, ".gitignore")) ? read(path.join(root, ".gitignore")) : "";
for (const term of ["backups/", "monitor-results/", "retention-reports/"]) {
  if (!gitignore.includes(term)) fail(`.gitignore missing local operational export path: ${term}`);
}

const csrfPath = path.join(root, "src", "lib", "server", "csrf.js");
if (!fs.existsSync(csrfPath)) {
  fail("src/lib/server/csrf.js is missing.");
} else {
  const text = read(csrfPath);
  for (const term of ["createCsrfToken", "verifyCsrfRequest", "csrfHiddenInput", "csrfMetaTag", "Security token is missing or invalid."]) {
    if (!text.includes(term)) fail(`csrf.js missing required marker: ${term}`);
  }
}

const middlewareText = fs.existsSync(path.join(root, "src", "middleware.js")) ? read(path.join(root, "src", "middleware.js")) : "";
for (const term of ["verifyCsrfRequest", "portal.maintenance_request", "portal.admin.users", "portal.admin.import", "security.rate_limit"]) {
  if (!middlewareText.includes(term)) fail(`middleware missing portal write hardening marker: ${term}`);
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
const siteDataText = fs.existsSync(path.join(root, "src", "data", "site.js")) ? read(path.join(root, "src", "data", "site.js")) : "";
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

for (const term of ["CREATE TABLE IF NOT EXISTS job_evidence_files", "storage_path TEXT NOT NULL UNIQUE", "idx_job_evidence_job"]) {
  if (!schema.includes(term)) fail(`schema.sql missing evidence marker: ${term}`);
}

for (const term of ["CREATE TABLE IF NOT EXISTS document_access_logs", "idx_document_access_actor_created", "idx_document_access_path_created"]) {
  if (!schema.includes(term)) fail(`schema.sql missing document access marker: ${term}`);
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
  jsAssets,
  cssAssets,
  cssBytes
};

console.log(JSON.stringify(result, null, 2));
if (failures.length) process.exit(1);
