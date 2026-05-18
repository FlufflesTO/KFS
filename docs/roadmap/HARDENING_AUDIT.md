# Hardening Audit

Date: 2026-05-18

## Result

The public site is static-first, deployable on Cloudflare Pages, and hardened for the current Tequit staging domain and future Kharon production cutover.

## Pass 1: Build And Deployment

- Verified Astro static build emits 11 HTML pages.
- Verified no public app JavaScript bundle is emitted.
- Verified staging canonical output uses `https://www.tequit.co.za`.
- Verified production Kharon build output uses `https://www.kharon.co.za`.
- Corrected Pages redirect assumptions: Cloudflare Pages `_redirects` is not used for apex/www domain forwarding.

## Pass 2: Security

- CSP is delivered through `public/_headers`.
- Added `script-src-attr 'none'`, `object-src 'none'`, and `upgrade-insecure-requests`.
- Retained `script-src 'unsafe-inline'` only because `BaseLayout.astro` emits inline JSON-LD structured data. The public shell has no client application JavaScript and no user-rendered HTML sinks.
- Verified no repo usage of `innerHTML`, `insertAdjacentHTML`, `document.write`, `eval`, `new Function`, `postMessage`, `localStorage`, or `sessionStorage` in the application source.
- Verified dependency audit reports zero vulnerabilities.

## Pass 3: UX, Content, And Routing

- Homepage is compact and routing-focused: cinematic hero, compliance strip, operational route matrix, technical proof, footer.
- Removed stale fake-dashboard language and decorative “System Overview” output.
- Confirmed no “Coming Soon” portal language remains.
- Confirmed security remains subordinate to gas suppression, fire detection, compliance and lifecycle support.
- Added hardened contextual inquiry forms with explicit request types, bounded input lengths and email-client submission guidance.

## Cinematic Hero Rebuild

- Rebuilt the homepage hero around environmental 3D illusion rather than interface UI.
- Removed floating annotation cards and fake operational overlays from the hero.
- Replaced the inner-page framed architecture card with ambient Kharon mark, perspective floor and restrained linework.
- Preserved static-first performance: CSS/SVG only, no Three.js, no React island and no public app JavaScript bundle.
- Reduced hero height so the homepage works as an authority-and-routing entry point instead of a long cinematic sequence.

## Enterprise Hardening Pass

- Added `npm run validate:site`, which builds the tequit staging bundle and audits generated output for routes, metadata, contextual forms, internal links, security headers, CSS budget, JS-free output and forbidden pseudo-dashboard terms.
- Hardened deployment so `npm run deploy:cloudflare` rebuilds the tequit bundle before uploading to Cloudflare Pages.
- Removed hover-lift and glow effects from reusable cards, status markers and schematic visuals.
- Reworked shared navigation/footer assessment links to preserve request intent instead of dumping users into generic contact routing.
- Added favicon and expanded structured data for organization, website and commercial fire-protection service context.
- Verified Lighthouse mobile scores: Performance 100, Accessibility 100, Best Practices 100, SEO 100.

## Operational Notes

- Configure apex/www canonical forwarding in Cloudflare Redirect Rules or Bulk Redirects:
  - `tequit.co.za/*` -> `https://www.tequit.co.za/$1`
  - `kharon.co.za/*` -> `https://www.kharon.co.za/$1`
- Keep real project photography and case evidence as the next authority phase once approved assets are available.

## Residual External Control

- `https://tequit.co.za/` currently serves the same hardened site instead of redirecting to `https://www.tequit.co.za/`.
- The current Wrangler OAuth token can read the `tequit.co.za` zone but returned an authentication error for zone Rulesets API access.
- This cannot be resolved inside the Pages bundle because Cloudflare Pages `_redirects` does not support domain-level redirects. Add the Redirect Rule in the Cloudflare dashboard or with a token that has Dynamic URL Redirects Write / Zone Rulesets permissions.
