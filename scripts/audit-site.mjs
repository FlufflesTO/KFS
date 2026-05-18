import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const dist = path.join(root, "dist");
const src = path.join(root, "src");
const publicDir = path.join(root, "public");

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

function warn(message) {
  warnings.push(message);
}

if (!fs.existsSync(dist)) {
  fail("dist directory is missing. Run npm run build:staging first.");
}

const sourceFiles = walk(src).filter((file) => /\.(astro|js|css)$/.test(file));
const distFiles = walk(dist);
const textDistFiles = distFiles.filter((file) => /\.(html|js|css|txt|xml)$/.test(file));

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

const assetsDir = path.join(dist, "_astro");
const assets = fs.existsSync(assetsDir) ? fs.readdirSync(assetsDir) : [];
const jsAssets = assets.filter((file) => file.endsWith(".js"));
if (jsAssets.length > 0) {
  fail(`unexpected public JavaScript assets: ${jsAssets.join(", ")}`);
}

const cssAssets = assets.filter((file) => file.endsWith(".css"));
const cssBytes = cssAssets.reduce((total, file) => total + fs.statSync(path.join(assetsDir, file)).size, 0);
if (cssBytes > 36_000) {
  fail(`CSS asset budget exceeded: ${cssBytes} bytes`);
}

const expectedRoutes = [
  "index.html",
  "gas-suppression/index.html",
  "fire-detection/index.html",
  "compliance-maintenance/index.html",
  "critical-infrastructure/index.html",
  "emergency-support/index.html",
  "security-systems/index.html",
  "industries/index.html",
  "about/index.html",
  "contact/index.html",
  "404.html",
  "robots.txt",
  "sitemap.xml"
];

for (const route of expectedRoutes) {
  if (!fs.existsSync(path.join(dist, route))) {
    fail(`missing route output: ${route}`);
  }
}

const htmlFiles = distFiles.filter((file) => file.endsWith(".html"));
for (const file of htmlFiles) {
  const html = read(file);
  const route = path.relative(dist, file).replaceAll("\\", "/");
  const h1Count = (html.match(/<h1\b/gi) || []).length;
  if (h1Count !== 1) fail(`${route} should have exactly one h1, found ${h1Count}`);
  for (const tag of ["<title>", 'name="description"', 'rel="canonical"', 'property="og:title"', 'application/ld+json']) {
    if (!html.includes(tag)) fail(`${route} missing metadata marker ${tag}`);
  }
  if (/href="https:\/\/tequit\.co\.za/i.test(html)) fail(`${route} contains apex canonical/link`);
  if (/href="\/contact"/.test(html) && route !== "contact/index.html") {
    warn(`${route} links to generic contact without intent query or contextual section`);
  }
}

const home = fs.existsSync(path.join(dist, "index.html")) ? read(path.join(dist, "index.html")) : "";
for (const term of [
  "Engineering-led fire detection and gaseous suppression",
  "SAQCC",
  "SANS 10139",
  "SANS 14520",
  "Commercial &amp; Industrial Only",
  "Operational Routing"
]) {
  if (!home.includes(term)) fail(`homepage missing required authority signal: ${term}`);
}

const contextualRoutes = new Map([
  ["gas-suppression/index.html", "Gas suppression assessment"],
  ["fire-detection/index.html", "Fire detection review"],
  ["compliance-maintenance/index.html", "Compliance assessment"],
  ["critical-infrastructure/index.html", "Critical infrastructure protection discussion"],
  ["emergency-support/index.html", "Emergency / SLA support"],
  ["security-systems/index.html", "Integrated infrastructure security review"]
]);

for (const [route, requestType] of contextualRoutes) {
  const file = path.join(dist, route);
  if (!fs.existsSync(file)) continue;
  const html = read(file);
  if (!html.includes(requestType)) fail(`${route} missing contextual request type: ${requestType}`);
}

const routeSet = new Set(
  expectedRoutes
    .filter((route) => route.endsWith(".html"))
    .map((route) => {
      if (route === "index.html") return "/";
      if (route === "404.html") return "/404";
      return `/${route.replace(/\/index\.html$/, "")}`;
    })
);

for (const file of htmlFiles) {
  const html = read(file);
  const route = path.relative(dist, file).replaceAll("\\", "/");
  const hrefs = [...html.matchAll(/\shref="([^"]+)"/g)].map((match) => match[1]);
  for (const href of hrefs) {
    if (!href.startsWith("/") || href.startsWith("//")) continue;
    const [rawPath] = href.split(/[?#]/);
    if (rawPath.startsWith("/_astro") || rawPath.startsWith("/og/") || rawPath === "/favicon.svg") continue;
    const normalized = rawPath === "/" ? "/" : rawPath.replace(/\/$/, "");
    if (!routeSet.has(normalized)) {
      fail(`${route} links to missing internal route: ${href}`);
    }
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

const sitemap = fs.existsSync(path.join(dist, "sitemap.xml")) ? read(path.join(dist, "sitemap.xml")) : "";
if (sitemap.includes("https://tequit.co.za")) fail("sitemap contains apex tequit URL");
if (!sitemap.includes("https://www.tequit.co.za/gas-suppression")) fail("sitemap missing www gas suppression route");

const result = {
  ok: failures.length === 0,
  failures,
  warnings,
  routes: htmlFiles.length,
  jsAssets,
  cssAssets,
  cssBytes
};

console.log(JSON.stringify(result, null, 2));
if (failures.length) process.exit(1);
