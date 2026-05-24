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

---

## Audit Update — 2026-05-25

Scope of this update: SSR portal security state, contact form handler, session revocation, and current build posture.

### Architecture State

- Site is now Astro 6 SSR on the Cloudflare adapter. Public pages and portal routes share one Worker deployment.
- Public pages remain no-hydration where possible; portal pages use inline `<script>` blocks with no bundled client JavaScript.
- CSS budget: 46,000 bytes. Current output: 44,372 bytes. No public JS bundle is emitted.

### Portal Security Additions Since May 2026-05-18

- **Session token revocation (Phase 10):** Logout inserts a SHA-256 token fingerprint into `revoked_sessions` D1 table. Middleware checks revocation on every portal request. Migration `0009_revoked_sessions.sql` applied to staging.
- **CSRF protection:** User-bound HMAC tokens delivered via meta tag, validated in middleware for all authenticated portal write POSTs. Login is intentionally exempt.
- **Rate limiting:** Per-endpoint limits on all portal write APIs. Public contact endpoint rate-limited at 5 per 15-minute window per IP.
- **TOTP MFA:** Admin and finance users can enrol an authenticator app. MFA-required flag enforced in middleware.
- **Password reset:** Single-use token hashes stored in D1; admin-issued reset links are copy-to-clipboard only; no plain-text URL persists in the DOM.
- **CSV formula injection:** Tab-prefix sanitization on all exported cells.
- **Document access logging:** Every jobcard PDF and evidence photo download is recorded in `document_access_logs` with actor, role, outcome and IP hash.
- **Audit log:** Auth, CSRF, rate-limit, data-change and document-access events recorded in `audit_events`.

### Contact Form

- Contact form no longer uses `action="mailto:..."`. Submissions POST to `/api/contact`, are validated server-side, and stored in D1 `contact_submissions`. Honeypot is checked server-side. No email-client dependency.

### CSP Note

- The `script-src 'unsafe-inline'` policy accommodates both the JSON-LD block in `BaseLayout.astro` and the portal inline script blocks. No eval, innerHTML or dynamic script creation is used in application code.
- Portal inline scripts use `window.kharonPortalFetch`, which injects the CSRF token on every request; this helper is also declared inline.

### Lighthouse

- Last recorded Lighthouse scores were 100 across all categories on the public shell before portal additions. Re-run Lighthouse against the current public homepage after Phase 7 imagery is added.

### Remaining Gaps

- No automated alerting or Logpush configured. See `docs/roadmap/ERROR_TELEMETRY_POLICY.md`.
- OG image is still SVG. Facebook, LinkedIn and WhatsApp will not render it. A PNG replacement is deferred to Phase 8 pending approved imagery.
- Analytics not yet integrated. Deferred to Phase 12 pending POPIA-compliant provider selection.
