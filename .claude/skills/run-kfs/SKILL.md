---
name: run-kfs
description: Build, launch, and drive the KFS (Kharon Fire & Security) Astro app locally — run the dev server, screenshot the public website, and drive the portal through a real authenticated login. Use when asked to run, start, build, serve, screenshot, smoke-test, or log into the KFS site/portal.
---

# Run KFS (Kharon Fire & Security)

Astro v6 SSR app on the Cloudflare adapter (Workers/D1/R2 via Miniflare in dev).
Two surfaces share one dev server on **http://localhost:4321**:

- **Public website** — `/`, `/services`, `/about`, `/contact` (no auth, no DB).
- **Operations portal** — `/portal/*`, role-gated (admin/tech/client/finance/manager), backed by local D1.

You drive it with **`.claude/skills/run-kfs/driver.mjs`**, a headless-Chromium
script built on the browser that ships with `@playwright/test` (no `chromium-cli`
needed). All paths below are relative to the repo root.

> **Run the driver with PowerShell / `node`, never Git Bash.** Git Bash (MSYS)
> rewrites a `/` argument into a Windows path, so `driver.mjs shot /` breaks.
> `node .claude/skills/run-kfs/driver.mjs ...` from PowerShell works.

## Prerequisites

- Node `>=22.12` (verified on v22.22.1), npm `>=9.6`.
- `npm install` once (Playwright's Chromium is already vendored under
  `~/AppData/Local/ms-playwright`; if missing, `npx playwright install chromium`).
- **`.dev.vars`** at the repo root with all four secrets — missing `MFA_SECRET`
  silently breaks portal login at session-token creation:
  ```
  SESSION_SECRET=<32+ chars>
  ENCRYPTION_SECRET=<32+ chars>
  MFA_SECRET=<32+ chars, different from SESSION_SECRET>
  ENVIRONMENT=local
  ```

## Run — agent path (this is the one you use)

### 1. Start the dev server (background) and wait for the URL

```powershell
npm run dev
```

First boot is slow — Vite re-optimizes deps and the banner
`astro v6.3.3 ready ... Local http://localhost:4321/` can take **~45s** to appear.
Wait for that line before driving. `Using secrets defined in .dev.vars` confirms
`.dev.vars` was loaded.

### 2. Screenshot the public site

```powershell
node .claude/skills/run-kfs/driver.mjs shot / home.png
node .claude/skills/run-kfs/driver.mjs flow
```

`flow` walks `/`, `/services`, `/about`, `/contact`, `/portal/login` and writes a
PNG per page. All screenshots land in `.claude/skills/run-kfs/shots/`. Each command
prints HTTP status + `<title>`; a clean run is all `HTTP 200`.

### 3. Drive the portal through a real login

The portal needs local D1 seeded with a user whose password you know (the
committed `seed-users.sql` hash has **no** known plaintext). One-time setup:

```powershell
# Apply migrations + seed (idempotent). Note: --config is REQUIRED — there is no
# default wrangler.toml; the D1 binding lives in wrangler.portal.jsonc.
npx wrangler d1 migrations apply kharon-portal --local --config wrangler.portal.jsonc
npx wrangler d1 execute kharon-portal --local --config wrangler.portal.jsonc --file seed-users.sql

# Set a known LOCAL password on the client user (>=12 chars). Throwaway only.
$hash = npx tsx scripts/hash-password.ts "LocalDevPass123!" 2>$null | Select-Object -Last 1
npx wrangler d1 execute kharon-portal --local --config wrangler.portal.jsonc --command "UPDATE users SET password_hash='$hash', force_password_change=0, mfa_required=0, mfa_enabled=0 WHERE email='client@example.com'"
```

Then log in and capture the authenticated dashboard:

```powershell
node .claude/skills/run-kfs/driver.mjs login "client@example.com" "LocalDevPass123!" client
```

Expected output ends with `OK -> http://localhost:4321/portal/client/dashboard`
and writes `portal-login.png`, `portal-after-login.png`, `portal-dashboard.png`.
The `login` command takes an optional 3rd arg (role: `admin`/`tech`/`client`/
`finance`/`manager`) that selects which `/portal/<role>/dashboard` to open.

## Gotchas (battle scars from this container)

- **Login is AJAX, not a form POST.** The submit button flips to `CHECKING…`,
  posts via `portalApi`, then redirects with JS. Don't screenshot right after the
  click — the driver waits for `/portal/<role>/dashboard` (15s) before shooting.
- **Admin/finance/tech are MFA-gated before the dashboard.** Logging in as
  `admin@kharon.co.za` authenticates fine but the rbac middleware redirects to
  `/portal/account/mfa` ("Generate Authenticator Setup") and `/portal/admin/dashboard`
  keeps redirecting there until you enrol a TOTP authenticator. The **`client`**
  role has no MFA gate — use it for a clean dashboard screenshot without doing the
  TOTP dance.
- **`wrangler ... --local` with no `--config` fails** with "No configuration file
  found." Always pass `--config wrangler.portal.jsonc` for any D1 command.
- **The dev server and `wrangler d1 execute --local` share `.wrangler/state`**, so
  seeding while the server is running is picked up on the next request — no restart.
- **"Dashboard summary could not be loaded"** on the client dashboard is expected
  with only seed data (no sites/jobs/certs seeded). The page chrome still renders.
- **Staging warning banner** ("WARNING: STAGING ENVIRONMENT … LOCALHOST") shows on
  every page when `ENVIRONMENT` is not production — normal locally.

## Run — human path

`npm run dev`, then open http://localhost:4321 in a real browser. Useless for an
agent (no programmatic handle) — use the driver above instead.

## Build / test (verified commands)

```powershell
npm run build         # SW compile -> astro build -> CSS purge (ordering matters)
npx playwright test   # E2E suite (tests/*.spec.ts)
npm run lint          # ESLint
```

## Troubleshooting

| Symptom | Fix |
|---|---|
| `Cannot navigate to invalid URL ...C:/Program Files/Git/...` | You ran the driver from Git Bash. Use PowerShell / `node`. |
| `No configuration file found` from wrangler | Add `--config wrangler.portal.jsonc`. |
| Login stays on `/portal/login`, button stuck on `CHECKING…` | Bad credentials, or `MFA_SECRET` missing from `.dev.vars`. Re-seed the password hash and confirm all four secrets are set. |
| Login lands on `/portal/account/mfa` and won't reach the dashboard | Expected for admin/finance/tech. Use the `client` role, or enrol TOTP. |
| `users` table empty / `SELECT` returns `[]` | Run the migrate + seed commands in step 3. |

## The driver

`.claude/skills/run-kfs/driver.mjs` — commands: `shot <path> <out.png>`,
`flow`, `login <email> <password> [role]`. Env: `BASE_URL` (default
`http://localhost:4321`), `HEADED=1` to show the window. Edit it to add flows;
if it grows into something the test suite reuses, graduate it to `e2e/`.
