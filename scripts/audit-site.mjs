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
  if (relative.startsWith("node_modules/") || relative.startsWith("dist/") || relative.startsWith(".wrangler/") || relative.startsWith(".git/")) return false;
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
  "portal/api/submit-jobcard.js",
  "portal/api/approve-quote.js",
  "portal/api/file/[...key].js"
];

for (const route of expectedSourceRoutes) {
  if (!fs.existsSync(path.join(src, "pages", route))) {
    fail(`missing source route: ${route}`);
  }
}

const requiredSourceTerms = new Map([
  ["src/middleware.js", ["sessionCookieName", "/portal/tech/", "/portal/finance/", "/portal/client/", "context.locals.user"]],
  ["src/pages/portal/api/auth.js", ["verifyPassword", "Set-Cookie", "redirectTo"]],
  ["src/pages/portal/api/submit-jobcard.js", ["db.batch", "jobcards/job-", "status = 'Completed'", "next_due_date", "financial_records"]],
  ["src/pages/portal/tech/dashboard.astro", ["assigned_technician_id", "/portal/api/submit-jobcard"]],
  ["src/pages/portal/client/dashboard.astro", ["/portal/api/file/", "/portal/api/approve-quote"]],
  ["src/pages/portal/finance/dashboard.astro", ["financial_records", "payment_status"]],
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
    "CSRF",
    "Production Gate Checklist"
  ]) {
    if (!text.includes(term)) fail(`MASTER_ROADMAP.md missing production hardening marker: ${term}`);
  }
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
for (const term of ["verifyCsrfRequest", "portal.maintenance_request", "portal.admin.users", "security.rate_limit"]) {
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
