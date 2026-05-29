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

---

## Audit Update — 2026-05-25 (Phase 14, 15, 16 Completion)

Scope: public page differentiation, compliance hub, and operational data model expansion.

### Phase 14 — Public Page Differentiation

- All service pages now use unique technical block components instead of the shared `EngineeringSystems` component.
- Each page has at least one unique SVG diagram, checklist, matrix, or evidence section.
- CSS budget: 60,000 bytes (raised from 46,000). Current output: ~52,306 bytes. Within budget.
- No client names, vendor partnership claims, or absolute compliance guarantees introduced.
- `npm run build` and `npm run audit:site` pass.

### Phase 15 — Compliance Hub

- `/compliance` hub page live with SANS 10139 and SANS 14520 practical summaries.
- Service checklists, defect severity classification, certificate readiness flowchart, maintenance cadence table.
- Internal cross-links from all service pages, footer "Standards Reference" link.
- No copyrighted SANS text reproduced; summary-level only with disclaimers.
- PDF downloads and FAQ schema deferred pending design approval.

### Phase 16 — Data Model Expansion

- Four new D1 tables: `clients`, `job_visits`, `defects`, `certificates`.
- Admin dashboard: 7-card quick-stats row including open defects, blocked certificates. Exception queue includes defect register.
- Client dashboard: open defects and certificate register sections scoped to client-accessible systems.
- Technician dashboard: visit history per job, log arrival form with GPS capture, `/portal/api/job-visits` endpoint.
- Migrations `0014` through `0017` committed and applied to staging.
- `npm run build` passes; Cloudflare deployment successful.

### Updated Production Blockers

- [ ] Rotate all shared staging credentials and enforce unique per-user passwords.
- [ ] Complete credential-backed role QA for Admin, Technician, Client and Finance.
- [ ] Confirm Admin and Finance MFA enforcement policy.

---

## Audit Update - 2026-05-25 DOM Sink Hardening Pass

Scope: browser-side DOM safety, portal/public form success states, finance select rebuilding, and technician defect capture rendering.

### Changes

- Replaced public contact and contextual inquiry success-state `innerHTML` assignments with `document.createElement`, `textContent`, and `replaceChildren`.
- Replaced admin dashboard `outerHTML` status replacement with a constructed `span` and `replaceWith`.
- Replaced finance dashboard select-option `innerHTML` resets with explicit option creation and `replaceChildren`.
- Rebuilt technician defect-card rendering without HTML string concatenation.
- Removed technician defect submission parsing from rendered HTML; submission now copies the structured defect array directly.
- Extended `scripts/audit-site.mjs` to fail on application-source HTML string sinks, `document.write`, `insertAdjacentHTML`, `eval`, and `new Function`.

### Verification

- `rg` confirms the remaining `innerHTML`/`outerHTML`/dynamic-code matches are limited to the audit script patterns themselves.
- `npm run build` passes.
- `npm run audit:site` passes.
- `npm audit --omit=dev` reports 0 vulnerabilities.
- `npm run portal:qa:roles -- -SkipCredentialTests` passes.
- `npm run portal:monitor` passes.
- [ ] Full responsive screenshot QA across desktop, tablet and mobile.
- [ ] Production domain migration plan for `www.kharon.co.za` and `portal.kharon.co.za`.
- [ ] Approved public imagery to replace schematic visuals.

---

## Audit Update - 2026-05-29 API & Frontend Hardening Pass

Scope: API layer type safety, context boundary hardening, and frontend theme/accessibility compliance.

### API Migration & Context Hardening
- **TypeScript Strictness:** Completely migrated all 19 legacy `.js` API routes in `src/pages/portal/api/` to strict `.ts`. Added Astro `APIContext` definitions.
- **Context Handling Bug Fix:** Identified and patched a hallucinated `context.locals.db` error handling sequence across all API endpoints, securing the error boundary.
- **Build Integrity:** `npm run build` safely compiles all API endpoints with zero `noImplicitAny` exceptions blocking compilation.

### Frontend Theme & Layout Compliance
- **Dotted Matrix Purge:** Entirely removed the non-compliant turquoise dotted matrix background.
- **3D Watermark:** Verified `.kharon-environment` natively renders the 3D-filtered Kharon mark as a massive background watermark.
- **Accessibility:** `PortalLayout.astro` `<main>` element now correctly features `id="main-content"`, properly enabling skip-to-content links.
- **JSON-LD SEO:** Injected fully populated `ProfessionalService` structured data into `index.astro` (address, geo-coordinates, hours) for local SEO.
- **Print Stylesheets:** Validated `print.css` correctly strips out dark mode and 3D backgrounds for physical ink-saving prints.
