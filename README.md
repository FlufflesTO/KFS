# Kharon Fire and Security Solutions Website

Astro + TailwindCSS website for Kharon commercial and industrial fire detection, gas suppression, compliance maintenance and integrated infrastructure security support.

## Deployment Targets

- Host: Cloudflare Workers/Pages on Cloudflare's Astro SSR adapter output
- Project: `kharon-website`
- Staging/test canonical domain: `https://www.tequit.co.za`
- Staging/test apex alias: `https://tequit.co.za`
- Final production canonical domain: `https://www.kharon.co.za`
- Final redirect domain: `https://kharon.co.za`
- Staging portal host: `https://portal.tequit.co.za`
- Final portal host: `https://portal.kharon.co.za`
- Portal CTA: routed to `https://portal.tequit.co.za/portal/login` for the live SSR portal
- Contact email: `admin@kharon.co.za` by default
- Build command: `npm run build`
- Output directory: `dist`
- Node: `>=22.12.0`

Domain-specific values are controlled by public build variables:

```powershell
$env:PUBLIC_SITE_URL="https://www.tequit.co.za"
$env:PUBLIC_PORTAL_URL="https://portal.tequit.co.za"
$env:PUBLIC_CONTACT_EMAIL="admin@kharon.co.za"
```

## Windows Workflow

Run Bash scripts only for file-generation helper tasks. Run Node/npm commands from PowerShell.

```powershell
cd C:\Users\User\Desktop\Astro\kharon-website
npm install
npm run build:staging
npm audit --omit=dev
npm run auth:cloudflare
npm run deploy:cloudflare:preview
npm run deploy:cloudflare
npm run dev
```

The current test canonical domain is `https://www.tequit.co.za`; the intended production canonical domain is `https://www.kharon.co.za`. Portal access is live on `https://portal.tequit.co.za/portal/login`. Domain-level apex/www forwarding must be configured in Cloudflare Redirect Rules or Bulk Redirects, not in Pages `_redirects`.

Use `npm run build:production:kharon` only when preparing the final Kharon production cutover.

## Roadmap

The master delivery plan is in `docs/roadmap/MASTER_ROADMAP.md`.

### Current Status (2026-05-25)

**Completed phases:**

| Phase | Title | Status |
|-------|-------|--------|
| 1–13 | Foundation through security hardening | ✅ Complete |
| 14 | Public Page Differentiation | ✅ Complete — each service page has unique technical blocks |
| 15 | Compliance Hub and SANS Operationalisation | ✅ Complete — `/compliance` hub live with SANS summaries, checklists, defect/certificate guidance |
| 16 | Portal Operational Data Model Expansion | ✅ Complete — clients, job_visits, defects, certificates tables + dashboard updates |
| 21 | Sage Manual Finance Control Register | ✅ Complete — finance dashboard reframed as Sage control register |

**Active development:** Phases 17 (Technician Field Workflow Maturity), 18 (Client Compliance Command Centre), 19 (Finance Accounting and VAT Hardening).

**Production blockers:** Credential rotation, role QA with external credentials, Admin/Finance MFA enforcement, production domain migration, responsive screenshot QA. See `docs/roadmap/MASTER_ROADMAP.md` for the full list.
