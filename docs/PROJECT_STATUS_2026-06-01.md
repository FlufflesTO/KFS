# Project Status - 2026-06-01

## Current Status

The project is a strong staging-ready Kharon website and portal candidate. The public site, compliance surface, PAIA manual asset, portal shell, role dashboards, D1/R2-backed workflows, security middleware and Cloudflare Worker configuration are all implemented in the repository and pass local verification.

The project is not yet production-authoritative for real client operations until the remaining operational gates are closed: Cloudflare deploy authentication or CI deploy confirmation, remote D1 migration verification, credential rotation, credential-backed role QA, Admin/Finance MFA policy confirmation, responsive screenshot QA, analytics/POPIA sign-off, and final Kharon domain cutover.

## Verified This Run

| Area | Status | Evidence |
|---|---|---|
| Git baseline | Local `main` was synced with `origin/main` before this update | `git status -sb`, `git rev-parse HEAD` |
| Public PAIA manual | Real PAIA manual assets are present under `public/legal/` and the local build includes them | `public/legal/paia-manual.html`, `public/legal/paia-manual.pdf`, successful build |
| Dependency security | Clean | `npm audit` and `npm audit --omit=dev` both report `0 vulnerabilities` after removing unused `codex` and overriding nested `yaml` to patched `2.9.x` |
| Static analysis | Passing | `npm run lint`, `npm run check` |
| Production build | Passing | `NODE_OPTIONS=--max-old-space-size=4096 npm run build` |
| Site audit | Passing with one warning | `npm run audit:site`; CSS output is 98,361 bytes, above the 95,000-byte review threshold |
| Browser regression tests | Passing | `npm run test`; 17 passed, 1 skipped |
| Cloudflare tooling | Installed | `npx wrangler --version` returns `4.93.0` |
| Cloudflare local deploy auth | Blocked | `npm run cloudflare:whoami` reports unauthenticated; `npm run auth:cloudflare` timed out waiting for OAuth completion |

## Progress

- Public website: core public routes, service pages, emergency support, compliance hub, SEO metadata, sitemap/robots generation, footer/header routing and contact submission handling are implemented.
- Compliance: public trust signals, SANS coverage summaries, POPIA/PAIA references and the real PAIA manual asset are present. PAIA links are consistent across footer, compliance section and generated HTML/PDF variants.
- Portal foundation: login, logout, password reset, MFA path, session revocation, CSRF protection, rate limiting, audit logging and role-based routing are implemented.
- Role workflows: admin, technician, client and finance dashboards exist with staging-ready foundations for dispatch, jobcards, evidence, maintenance requests, certificates, defects, finance tasks and Sage reference tracking.
- Cloudflare platform: repository includes Wrangler configuration for the `kharon-website` Worker/Pages app, D1 binding `DB`, R2 binding `STORAGE`, routes for Tequit staging domains and CI deploy workflow on push to `main`.
- Quality gates: lint, Astro check, full build, site audit, dependency audit and Playwright regression tests pass locally.

## Snags

- Local Cloudflare deployment cannot complete until Wrangler is authenticated. The OAuth login command opened or waited for interactive approval and timed out.
- GitHub CLI is not installed locally, so GitHub PR/merge operations should use the connected GitHub connector or normal `git` push plus repository automation.
- Astro build/check should be run with `NODE_OPTIONS=--max-old-space-size=4096` on this machine to avoid memory pressure seen in earlier runs.
- CSS remains above the strict 95 KB review threshold at 98,361 bytes. The audit treats this as a warning, not a failure.
- Remote D1 migration state cannot be locally verified without Cloudflare auth. The local migration inventory now extends through `0034_fix_sage_real_columns.sql`.
- Production role QA still depends on real external credentials and representative staging data.
- Final Kharon production domains are still a cutover task; Tequit remains the current staging/test domain family.

## Outstanding

- Complete Cloudflare authentication or confirm the GitHub Actions deploy run after merge.
- Verify remote D1 migrations through the latest repository migration on the intended Cloudflare D1 database.
- Rotate all shared or temporary staging credentials and disable any default credentials before broader operational use.
- Complete credential-backed QA for Admin, Technician, Client and Finance.
- Confirm and enforce Admin/Finance MFA policy before loading real client or finance records.
- Run full responsive screenshot QA across public pages and portal role views.
- Confirm backup/restore evidence for D1 and R2 after the latest migration set.
- Select and configure POPIA-aware analytics, with no analytics loading on `/portal/*`.
- Prepare and execute final Kharon DNS/domain migration for `www.kharon.co.za`, `kharon.co.za` and `portal.kharon.co.za`.
- Finish operational sign-off for Sage-first finance workflows and client-facing language.

## To Have

- Bring compiled CSS back under the 95 KB review threshold without weakening the design system.
- Add approved real imagery, case evidence and document examples to strengthen public authority proof.
- Add richer compliance hub downloads and FAQ schema after legal/content approval.
- Add clearer finance exception workspaces for missing Sage references, on-hold jobs and no-charge approvals.
- Add operational monitoring, alerting and Logpush/observability coverage for Worker, D1 and portal errors.

## To Hope

- Add Sage API synchronization after the manual Sage control register is stable.
- Add route optimization and technician workload planning based on real travel and SLA data.
- Add automated client compliance packs with certificate/evidence bundling.
- Add client self-service requests that can be triaged into approved dispatch workflows with minimal admin re-entry.

## To Dream

- Predictive maintenance and defect-risk scoring from service history.
- AI-assisted SOP guidance for technicians based on asset type, defect class and SANS context.
- Digital twin style asset graph for sites, systems, defects, certificates, photos and service history.
- Multi-tenant operations layer for future managed-service or partner expansion.

## Deployment Position

The repository is locally verified and ready to push through the GitHub `main` workflow. That workflow includes build, audit, D1 preflight/migration steps and `npx wrangler deploy` when the repository Cloudflare secrets are valid.

Direct local Cloudflare deployment is blocked until Wrangler OAuth or a valid `CLOUDFLARE_API_TOKEN` is available in the local environment.
