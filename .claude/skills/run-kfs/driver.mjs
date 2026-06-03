#!/usr/bin/env node
/* global process, console */
// driver.mjs — headless browser driver for the KFS Astro app.
//
// Drives the running `astro dev` server (default http://localhost:4321) with
// the Chromium that ships with @playwright/test. No chromium-cli needed.
//
// Usage (run from repo root, dev server already running):
//   node .claude/skills/run-kfs/driver.mjs shot <path> <out.png>
//   node .claude/skills/run-kfs/driver.mjs login <email> <password>
//   node .claude/skills/run-kfs/driver.mjs flow            # homepage + a few site pages
//
// Env:
//   BASE_URL   override base (default http://localhost:4321)
//   HEADED=1   show the browser window (default headless)
//
// Screenshots land in .claude/skills/run-kfs/shots/ unless an absolute/explicit
// out path is given.

import { chromium } from "@playwright/test";
import { fileURLToPath } from "node:url";
import { dirname, join, isAbsolute } from "node:path";
import { mkdirSync } from "node:fs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const SHOTS = join(__dirname, "shots");
mkdirSync(SHOTS, { recursive: true });

const BASE = process.env.BASE_URL || "http://localhost:4321";
const HEADED = process.env.HEADED === "1";

function outPath(name) {
  return isAbsolute(name) || name.includes("/") || name.includes("\\")
    ? name
    : join(SHOTS, name);
}

async function withPage(fn) {
  const browser = await chromium.launch({ headless: !HEADED });
  const ctx = await browser.newContext({ viewport: { width: 1366, height: 900 } });
  const page = await ctx.newPage();
  const errors = [];
  page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
  page.on("pageerror", (e) => errors.push(String(e)));
  try {
    return await fn(page, errors);
  } finally {
    await browser.close();
  }
}

async function goto(page, path) {
  const url = path.startsWith("http") ? path : BASE + path;
  const res = await page.goto(url, { waitUntil: "networkidle", timeout: 30000 });
  return res ? res.status() : 0;
}

const [, , cmd, ...rest] = process.argv;

if (cmd === "shot") {
  const [path = "/", out = "shot.png"] = rest;
  await withPage(async (page, errors) => {
    const status = await goto(page, path);
    const file = outPath(out);
    await page.screenshot({ path: file, fullPage: true });
    console.log(`[shot] ${path} -> HTTP ${status} -> ${file}`);
    console.log(`[title] ${await page.title()}`);
    if (errors.length) console.log(`[console errors] ${errors.length}\n  ${errors.slice(0, 5).join("\n  ")}`);
  });
} else if (cmd === "login") {
  const [email, password, role = "admin"] = rest;
  if (!email || !password) { console.error("usage: login <email> <password> [role]"); process.exit(2); }
  await withPage(async (page, errors) => {
    let status = await goto(page, "/portal/login");
    console.log(`[login] GET /portal/login -> HTTP ${status} -> ${await page.title()}`);
    await page.screenshot({ path: outPath("portal-login.png"), fullPage: true });
    // Fill whatever email/password fields exist.
    const emailSel = 'input[type="email"], input[name="email"], #email';
    const passSel = 'input[type="password"], input[name="password"], #password';
    await page.fill(emailSel, email);
    await page.fill(passSel, password);
    await page.click('button[type="submit"], input[type="submit"]');
    // Login posts via fetch (portalApi) then redirects with JS on success.
    // Wait for the dashboard URL; fall back to whatever renders on failure.
    try {
      await page.waitForURL(/\/portal\/(admin|tech|client|finance|manager)\/dashboard/, { timeout: 15000 });
      console.log(`[login] OK -> ${page.url()} title=${await page.title()}`);
    } catch {
      await page.waitForTimeout(1500);
      const msg = await page.locator('[role="alert"], .result, .error, [data-result]').first().textContent().catch(() => null);
      console.log(`[login] no dashboard redirect. URL=${page.url()} resultText=${(msg || "").trim().slice(0, 200)}`);
    }
    await page.screenshot({ path: outPath("portal-after-login.png"), fullPage: true });
    // Session cookie is set; reach the role dashboard directly (MFA is optional
    // for seeded local users). Adjust the role segment for non-admin logins.
    const dashPath = `/portal/${role}/dashboard`;
    const dash = await goto(page, dashPath).catch((e) => `ERR ${e.message}`);
    console.log(`[login] ${dashPath} -> ${dash} -> ${page.url()} title=${await page.title()}`);
    await page.screenshot({ path: outPath("portal-dashboard.png"), fullPage: true });
    if (errors.length) console.log(`[console errors]\n  ${errors.slice(0, 5).join("\n  ")}`);
  });
} else if (cmd === "flow") {
  const pages = ["/", "/services", "/about", "/contact", "/portal/login"];
  await withPage(async (page) => {
    for (const p of pages) {
      const status = await goto(page, p).catch((e) => `ERR ${e.message}`);
      const name = "site-" + (p === "/" ? "home" : p.replace(/\W+/g, "-").replace(/^-/, "")) + ".png";
      await page.screenshot({ path: outPath(name), fullPage: true });
      console.log(`[flow] ${p} -> ${status} -> ${name} (${await page.title()})`);
    }
  });
} else {
  console.error("commands: shot <path> <out.png> | login <email> <pass> | flow");
  process.exit(2);
}
