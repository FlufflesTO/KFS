# Kharon Fire and Security Solutions Website

Astro + TailwindCSS website for Kharon commercial and industrial fire detection, gas suppression, compliance maintenance and integrated infrastructure security support.

## Deployment Targets

- Host: Cloudflare Pages
- Project: `kharon-website`
- Staging/test canonical domain: `https://www.tequit.co.za`
- Staging/test apex alias: `https://tequit.co.za`
- Final production canonical domain: `https://www.kharon.co.za`
- Final redirect domain: `https://kharon.co.za`
- Staging portal host: `https://portal.tequit.co.za`
- Final portal host: `https://portal.kharon.co.za`
- Portal CTA: routed to `/contact#portal-access` until the separate portal app is ready
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

The current test canonical domain is `https://www.tequit.co.za`; the intended production canonical domain is `https://www.kharon.co.za`. Portal CTAs route to contact until the separate portal app is ready. Domain-level apex/www forwarding must be configured in Cloudflare Redirect Rules or Bulk Redirects, not in Pages `_redirects`.

Use `npm run build:production:kharon` only when preparing the final Kharon production cutover.

## Roadmap

The master delivery plan is in `docs/roadmap/MASTER_ROADMAP.md`.
