# Kharon Website Master Roadmap

## Purpose

Build and maintain a production-ready enterprise website for Kharon Fire and Security Solutions.

The site must position Kharon as a commercial fire detection and gas suppression specialist for critical environments, with integrated security systems as a secondary capability.

## Strategic Positioning

Primary position:

Commercial Fire Detection & Gas Suppression Specialists

Secondary position:

Integrated infrastructure security support for critical environments

Capability hierarchy:

1. Gas Suppression
2. Fire Detection
3. Compliance & Maintenance
4. Integrated infrastructure security support

Design principle:

Clarity over cleverness. Structure over decoration. Trust over marketing. Reliability over trends.

## Current Baseline

Implemented:

- Astro 6 SSR site on the Cloudflare adapter, serving the public website and the portal from one codebase.
- Public shell remains lightweight and mostly server-rendered with code-native SVG/HTML technical visuals.
- Required pages: `/`, `/gas-suppression`, `/fire-detection`, `/compliance-maintenance`, `/critical-infrastructure`, `/emergency-support`, `/security-systems`, `/industries`, `/about`, `/contact`.
- Portal routes: `/portal/login`, `/portal/reset`, `/portal/account/password`, `/portal/account/mfa`, `/portal/tech/dashboard`, `/portal/tech/history`, `/portal/admin/dashboard`, `/portal/admin/planning`, `/portal/admin/operations`, `/portal/client/dashboard`, `/portal/client/quotes`, `/portal/finance/dashboard`.
- Portal APIs: `/portal/api/auth`, `/portal/api/logout`, `/portal/api/reset-password`, `/portal/api/change-password`, `/portal/api/mfa`, `/portal/api/job-status`, `/portal/api/submit-jobcard`, `/portal/api/maintenance-request`, `/portal/api/admin/users`, `/portal/api/admin/sites`, `/portal/api/admin/systems`, `/portal/api/admin/jobs`, `/portal/api/admin/import`, `/portal/api/admin/export`, `/portal/api/admin/client-site-access`, `/portal/api/admin/maintenance-requests`, `/portal/api/approve-quote`, `/portal/api/finance/payments`, `/portal/api/finance/export`, `/portal/api/file/[...key]`, `/api/contact`.
- Core components: `BaseLayout`, `Header`, `Footer`, `CinematicHero`, `RouteMatrix`, `Hero`, `ContextualInquiry`, `ComplianceStrip`, `SectorRiskGrid`, `EngineeringSystems`, `AuthorityEvidence`, `EmergencyResponse`, `SectionHeading`, `Button`.
- SEO basics: canonical URLs, OpenGraph tags, `robots.txt`, `sitemap.xml`, LocalBusiness JSON-LD.
- Accessibility basics: skip link, visible focus state, semantic sections, labelled contact form, reduced-motion CSS.
- Secure dependency baseline with current installed stack.
- Cloudflare resources: D1 binding `DB`, R2 binding `STORAGE`, `SESSION_SECRET`, and `kharon_session_token` session cookie.
- Live staging hosts verified on 2026-05-20:
  - `https://www.tequit.co.za/`
  - `https://portal.tequit.co.za/portal/login`

Open constraints:

- Original roadmap specified Astro 4. Current dependency audit required a secure upgrade path beyond Astro 4. Treat exact Astro version as a compatibility constraint to revisit only if the deployment target strictly requires Astro 4.
- The previous React/Three.js hero chunk has been removed to preserve static-first performance. The homepage now uses a CSS/SVG fake-3D cinematic Kharon mark instead of live WebGL.
- Industrial imagery is currently represented by code-native schematic visuals, not final photographic or optimized image assets.
- Portal data is seeded only for staging. Production credential rotation, representative role QA data, final onboarding approval, manual QA evidence and operational cutover sign-off still require dedicated workflows.

## Current Review And Recommendations

Review date: 2026-05-20.

Verified live status:

- Public homepage: `200 OK` on `https://www.tequit.co.za/`.
- Contact page: `200 OK`.
- Sitemap: `200 OK` with XML content type.
- Portal login: `200 OK` on `https://portal.tequit.co.za/portal/login`.
- Protected portal dashboard: unauthenticated `/portal/tech/dashboard` returns `302` to login.
- Authenticated technician dashboard smoke check returns `200` with a valid session cookie.
- Public `Access Records` links now route to the portal login instead of the contact flow.

Immediate refinements recommended:

- Replace shared temporary staging passwords with per-user credentials and document a controlled reset process.
- Add password reset before broader internal use; logout and first-login password rotation are now implemented.
- Admin CRUD foundations for sites, systems, users and jobs are now implemented in `/portal/admin/operations`; continue hardening with richer validation, imports and reporting.
- Add audit logging before sensitive client records and financial approvals become operationally authoritative.
- Add rate limiting for login and write APIs before production cutover.
- Technician job closure now has a touchscreen signature pad, start-job transition and richer generated jobcard PDF evidence; continue hardening with photos, offline expectations and field exception handling.
- Client maintenance requests and admin exception queues are now D1-backed; continue hardening with request status management, scheduling conversion and notification workflows.
- Admins can now update client request status and convert requests into scheduled dispatches linked back to the client request.
- Authenticated portal write APIs now require a signed CSRF token and inherit central write-rate limiting from middleware.
- Seed realistic staging sites, systems, jobs and finance records so each role dashboard can be reviewed with representative data.
- Update `PUBLIC_SITE_URL` and `PUBLIC_PORTAL_URL` only at Kharon cutover; keep Tequit clearly treated as staging/test.

## Review Update - 2026-05-25 Verified Kharon Branding Integration

Verified brand source assets are available in `docs/roadmap/KHARON_BRANDING`:

- `kharon_full_logo_verified.svg` for the formal full brand lockup.
- `Kharon_Logo_transparent_bevel_fixed.svg` for the standalone Kharon mark.
- `kharon_letterhead_verified.svg` for formal report, jobcard and document styling.
- `kharon_qr_letterhead_verified.svg` for QR-enabled client-facing document templates.

Branding pass scope:

- [x] Publish canonical copies under `public/brand`.
- [x] Replace ad hoc public header, footer and portal marks with the verified standalone mark.
- [x] Rebuild the cinematic hero Titan mark around the verified standalone logo asset instead of text-only `K`.
- [x] Align login and reset screens with the verified portal brand mark.
- [x] Replace the SVG-only OpenGraph image with a PNG/JPEG preview generated from the verified brand system.
- [x] Update OpenGraph metadata type after the raster preview is generated.
- [x] Align generated jobcard PDF branding with the verified letterhead direction where feasible inside the lightweight PDF generator.
- [x] Run `npm run build`, `npm run audit:site` and `npm audit --omit=dev`.

Production branding constraints:

- Do not use the dark full logo directly on black navigation unless it sits on a light panel; maintain accessible contrast.
- Preserve Century Gothic brand continuity.
- Keep the public shell performance-first: no live 3D branding payload, no heavy client-side logo rendering.
- Keep QR-enabled letterhead for document templates only unless a public QR destination is approved.


## Review Update - 2026-05-25 Full Website And Portal Audit Integration

Scope:

Granular public website and portal review covering live staging behaviour, repository implementation, role-specific portal architecture, public content quality, UI/UX, security posture, SEO, data model maturity, operational readiness and production cutover risks.

Audit sources:

- Public website staging domain: `https://www.tequit.co.za/`.
- Portal staging domain: `https://portal.tequit.co.za/portal/login`.
- Repository implementation: `FlufflesTO/KFS`.
- Role set reviewed: Admin, Finance, Technician and Client.
- Review limitation: unauthenticated live fetch and repository-level implementation review were completed. Full browser credential-backed role QA still requires manual execution with externally supplied staging credentials and must not rely on shared passwords after this review.

Executive assessment:

| Area | Status | Notes |
|---|---|---|
| Brand positioning | Strong | Public site clearly frames Kharon as commercial and industrial fire detection and gas suppression specialists, with security as secondary support. |
| Public UX | Good but repetitive | Structure is clean and disciplined, but several pages reuse the same section rhythm and proof-card style. |
| Conversion reliability | Partially hardened | Main contact form is server-side and D1-backed; contextual inquiry forms still need to be converted away from `mailto:` patterns where they remain. |
| Portal architecture | Strong staging foundation | D1, R2, signed sessions, CSRF, rate limits, RBAC, audit logging and document access logging are in place. |
| Portal UX | Functional but not yet production-scale | Role dashboards work conceptually, but admin density, technician field workflow and client compliance visibility require deeper workflow maturity. |
| Security posture | Good pre-production baseline | Core protections exist, but credential rotation, MFA enforcement, security headers, manual role QA and production monitoring remain critical. |
| Compliance depth | Insufficient for final authority positioning | SANS references exist, but practical checklists, service evidence examples, defect/certificate logic and compliance hub content need expansion. |
| Production readiness | Not yet authoritative | Suitable for staging and internal review; not ready for live client records until hardening gates and manual QA are completed. |

Public website strengths confirmed:

- Gas suppression and fire detection are correctly primary, with security positioned as an integrated secondary capability.
- Commercial and industrial-only positioning is visible and strategically aligned.
- Navigation routes users into solution, sector, compliance, emergency, contact and records paths.
- SEO metadata, canonical URLs, OpenGraph tags and JSON-LD foundations are present.
- Accessibility basics exist: skip link, semantic navigation, visible focus styles and reduced-motion CSS.
- The fake-3D CSS/SVG cinematic system preserves the desired Kharon titan impression without reintroducing heavy WebGL payload.

Public website weaknesses requiring roadmap action:

- Page structures are too similar across Gas Suppression, Fire Detection, Compliance, Critical Infrastructure and Industries.
- Several proof sections remain conceptually strong but too abstract; they need real evidence, examples, diagrams, documents or approved project proof.
- Contextual inquiry forms must be standardised on server-side submission rather than any remaining email-client-dependent `mailto:` flow.
- Emergency support needs more explicit operational triage, existing-client routing, call/phone route and after-hours/SLA framing.
- Contact and emergency pages need a visible phone route once the approved number and response rules are confirmed.
- Supported ecosystem references need careful wording so they imply service familiarity, not unapproved vendor partnership.
- Public site lacks analytics and CTA conversion tracking.
- Real industrial photography and document evidence examples remain outstanding.

Public website recommendations added to build phases:

- Add unique proof sections per major service page.
- Build a compliance hub with SANS 10139 and SANS 14520 practical summaries, service-report checklists, defect examples and certificate-readiness guidance.
- Add technical diagrams for protected-room gas suppression, fire detection cause-and-effect, maintenance cadence and emergency triage.
- Replace broad CTA reuse with page-specific CTAs:
  - Gas Suppression: `Request Protected Room Review`.
  - Fire Detection: `Request Fire Detection System Review`.
  - Compliance: `Request Maintenance / Compliance Audit`.
  - Emergency: `Log Urgent System Fault`.
  - Critical Infrastructure: `Request Critical Environment Assessment`.
  - Client records: `Request Records Access`.
- Add approved field imagery and anonymised evidence examples where commercially safe.

Portal implementation strengths confirmed:

- Authentication endpoint validates credentials, applies login rate limiting, supports MFA, updates last-login timestamp, logs audit events and redirects by role.
- Session cookies are signed, `HttpOnly`, `Secure` outside local mode and `SameSite=Strict`.
- Middleware protects portal routes, enforces RBAC, redirects unauthenticated users, handles forced password change and MFA setup, verifies CSRF for state-changing APIs and applies endpoint-specific write-rate limits.
- Role dashboards exist for Admin, Technician, Client and Finance.
- Document retrieval is permission checked against role, assignment or mapped client site and logs document access outcomes.
- Technician jobcard closure validates assignment, writes PDF/evidence to R2, updates D1 job/system/finance records and audit logs the action.
- Client maintenance request and quote approval flows check mapped site access.
- Finance ledger has ageing, export and payment capture foundations.
- QA harness exists for role route smoke tests, CSRF checks and post-logout replay behaviour.

Portal weaknesses requiring roadmap action:

- Manual credential-backed QA remains required for Admin, Finance, Technician and Client.
- Shared temporary staging credentials must be rotated and removed from operational use immediately.
- Admin dashboard mixes strategic overview and action queues on one dense screen.
- Admin operations still needs production-scale search, filtering, pagination and audit-friendly change review beyond current collapsible overflow improvements.
- Technician workflow remains too thin for real SANS-aligned field service: no GPS check-in/out, visit timing, defect capture, certificate blocking, panel readings, gas pressure/agent mass, customer role capture or offline draft workflow.
- Client portal is currently more of a records gateway than a compliance command centre.
- Finance model is useful for staging but not yet a full accounting workflow: VAT, invoice PDFs, debtor statements, credit notes and proof-of-payment attachments remain outstanding.
- Portal data model is simpler than the intended Kharon operations architecture and needs explicit Client → Site → System → Job → Visit → Defect → Certificate relationships before replacing manual back-office processes.

Security and governance recommendations added to build phases:

- Rotate all staging credentials and force unique passwords before any broader testing.
- Require MFA for Admin and Finance in production.
- Add strict security headers: CSP, `frame-ancestors`, `object-src 'none'`, `base-uri 'self'`, `Referrer-Policy`, `Permissions-Policy` and `X-Content-Type-Options`.
- Add session/device review UI in a later phase.
- Add admin-visible failed-login, CSRF block and rate-limit review reports.
- Run D1/R2 backup and restore drill before production cutover.
- Complete POPIA review for analytics, contact storage, document access logs and retention policy.
- Keep all seed data, password material, reset links and production credentials out of the public repository.

Data-model maturity target added:

```text
Client
  → Site
    → System
      → Job
        → Visit
          → Defect
            → Quote
          → Certificate
Job / Quote
  → Invoice
User / Technician
  → Visit / Job / Audit
```

Immediate production blockers from this audit:

- [ ] Rotate and disable shared temporary role credentials.
- [ ] Complete credential-backed role QA for Admin, Finance, Technician and Client.
- [ ] Require MFA for Admin and Finance users before real finance/client records are loaded.
- [ ] Add and verify strict security headers.
- [ ] Confirm backup and restore process using real staging D1/R2 exports.
- [ ] Convert any remaining contextual `mailto:` forms to server-side submissions.
- [ ] Add visible phone/contact route for contact and emergency pages after approval.
- [ ] Seed representative staging data for each role and rerun manual portal QA.
- [ ] Confirm no analytics load on `/portal/*` once analytics is selected.
- [ ] Complete public content authority pass before kharon.co.za cutover.

Audit integration gate:

- [x] Roadmap updated with public website strengths, weaknesses and recommendations.
- [x] Roadmap updated with portal strengths, weaknesses and recommendations.
- [x] Roadmap updated with security, governance and production blockers.
- [x] New phases added for security headers, public authority proof, compliance hub, operational data model, technician field maturity, client compliance dashboard and finance/accounting maturity.
- [x] Stale roadmap items corrected where later implementation evidence already shows completion.
- [ ] Manual credential-backed QA remains outstanding.
- [ ] Director-approved production cutover remains outstanding.

Status:

Audit findings integrated into roadmap. This does not by itself approve production use. Tequit remains staging until all production blockers, manual QA records and cutover sign-off are complete.

## Review Update - 2026-05-21 Portal Security And Production Hardening

Current staging assessment:

- Public Tequit site is strategically aligned with Kharon's commercial and industrial gas suppression and fire detection positioning.
- Portal login route is live at `https://portal.tequit.co.za/portal/login`.
- Portal architecture is promising for staging: Astro SSR, Cloudflare D1, Cloudflare R2, role dashboards, admin CRUD, jobcard closure, client maintenance request flow and finance visibility.
- Portal is not yet production-authoritative. Tequit remains a staging and test domain until the Kharon cutover is deliberately approved.

Public-site refinements required:

- Replace repeated proof-card copy with unique, specific proof points.
- Ensure `/about` is visibly linked from the footer and preferably from header/company navigation.
- Strengthen `/emergency-support` with clearer emergency decision CTAs:
  - Critical fault or call route.
  - Existing client or Access Records route.
  - Urgent technical request route.
  - Compliance intervention route.
- Maintain capability hierarchy:
  1. Gas Suppression.
  2. Fire Detection.
  3. Compliance & Maintenance.
  4. Integrated Security support.

Portal production blockers:

- Add CSRF protection to every browser-submitted authenticated state-changing POST. Login remains intentionally exempt because it has no authenticated session before submission; login abuse control is handled by existing login rate limiting.
- Add rate limiting to write APIs beyond login.
- Replace shared staging credentials with unique per-user credentials.
- Keep first-login password rotation.
- Add password reset workflow.
- Add optional MFA path for admin and finance roles.
- Add backup/export SOP for D1 and R2.
- Add monitoring checks for login, dashboard redirects, D1 availability and R2 document retrieval.
- Add manual RBAC abuse-test checklist.

Portal workflow gaps:

- Technician workflow still requires photo evidence support and poor-signal/offline expectations.
- Finance workflow still requires invoice numbers, payment capture, reconciliation states and export path.
- Admin operations need richer validation and import/export paths.
- Public case evidence and approved industrial imagery remain outstanding.

Production Gate Checklist:

- [x] Roadmap updated before implementation.
- [x] CSRF token system implemented.
- [x] All portal POST endpoints enforce CSRF except intentionally documented exceptions.
- [x] Write endpoint rate limiting implemented.
- [x] Role abuse tests documented.
- [ ] Manual staging credential QA completed.
- [x] Public duplicate copy removed.
- [x] About link visible.
- [x] Emergency page decision CTAs improved.
- [x] Build passes.
- [x] Site audit script passes.
- [x] No secrets committed.

Pass intake status before implementation:

- CSRF protection: implemented for authenticated portal write APIs; login remains intentionally exempt before authentication.
- Rate limiting beyond login: implemented with endpoint-specific portal write limits.
- Password reset: incomplete.
- MFA: incomplete.
- Backup/export SOP: incomplete.
- Public proof-copy refinement: complete for current proof-card duplication pass.
- About visibility: complete in footer and primary navigation data.
- Emergency CTA refinement: complete for critical fault, existing client records, urgent technical request and compliance intervention routes.

## Review Update - 2026-05-21 Monitoring And Backup SOP Pass

Scope for this pass:

- Add an operator-run monitoring check for public site availability, portal login availability, protected dashboard redirect behavior, D1 availability and R2 availability.
- Add a D1/R2 backup/export SOP that keeps generated evidence outside git by default.
- Add npm scripts for repeatable local operations without embedding Cloudflare credentials or staging passwords.
- Keep password reset, MFA, technician photo/offline support and finance reconciliation out of scope for this pass.

Monitoring and backup production gate:

- [x] Roadmap updated before implementation.
- [x] Monitoring script added.
- [x] D1 availability check included.
- [x] R2 availability check included.
- [x] Public and portal HTTP checks included.
- [x] Backup/export SOP documented.
- [x] Generated backup output excluded from git.
- [x] Build passes.
- [x] Site audit script passes.
- [x] No secrets committed.

## Review Update - 2026-05-21 Finance Ledger Hardening Pass

Scope for this pass:

- Generate durable invoice references when client-approved quotes become invoices.
- Add finance-only payment capture for unpaid invoices without allowing clients or technicians to settle records.
- Add a finance CSV export endpoint for accounting handoff.
- Keep external accounting package integration out of scope until the target accounting workflow is confirmed.

Finance production gate:

- [x] Roadmap updated before implementation.
- [x] Invoice reference generation implemented.
- [x] Payment capture endpoint implemented.
- [x] Finance CSV export implemented.
- [x] Finance actions remain RBAC protected.
- [x] Finance actions remain CSRF protected by middleware.
- [x] Finance actions remain audit logged.
- [x] Build passes.
- [x] Site audit script passes.
- [x] No secrets committed.

## Review Update - 2026-05-21 Technician Evidence Hardening Pass

Scope for this pass:

- Add job evidence metadata for technician photo uploads.
- Store accepted technician evidence images in R2 under a controlled job evidence prefix.
- Link evidence images to the relevant job, system, technician and evidence type in D1.
- Add technician dashboard controls for limited photo evidence capture during jobcard closure.
- Document poor-signal field expectations without claiming full offline sync support.

Technician evidence production gate:

- [x] Roadmap updated before implementation.
- [x] D1 evidence metadata table added.
- [x] R2 photo evidence storage implemented.
- [x] Technician jobcard UI accepts photo evidence.
- [x] Evidence upload size and count limits implemented.
- [x] Evidence writes remain technician-assignment protected.
- [x] Evidence writes remain audit logged.
- [x] Poor-signal expectations documented.
- [x] Build passes.
- [x] Site audit script passes.
- [x] No secrets committed.

## Review Update - 2026-05-21 Password Reset Foundation Pass

Scope for this pass:

- Add a password reset token table that stores only token hashes.
- Allow admins to issue short-lived single-use password reset links from the portal operations screen.
- Add a public reset page that accepts a reset token and new password.
- Add a reset endpoint that consumes the token, rotates the password and forces first login password rotation.
- Keep outbound email delivery out of scope until a mail provider is selected; issued links must be delivered through an approved external channel.

Password reset production gate:

- [x] Roadmap updated before implementation.
- [x] Password reset token table added.
- [x] Admin reset-link action implemented.
- [x] Public reset page implemented.
- [x] Reset endpoint implemented.
- [x] Reset tokens stored as hashes only.
- [x] Reset tokens expire and are single-use.
- [x] Reset events are audit logged.
- [x] Build passes.
- [x] Site audit script passes.
- [x] No secrets committed.

## Review Update - 2026-05-21 Admin Finance MFA Foundation Pass

Scope for this pass:

- Add database fields for per-user MFA requirement, MFA enablement and encrypted TOTP secret storage.
- Add a repo-native TOTP utility for setup and verification without adding a third-party authentication dependency.
- Add account MFA setup, verification and disable endpoints protected by authenticated session, CSRF and rate limiting.
- Add a portal account MFA page so admin and finance users can enrol authenticator apps.
- Update login so accounts with enabled MFA must provide a valid one-time code before receiving a session.
- Allow admins to mark admin and finance accounts as MFA-required from portal operations.
- Keep SMS, email OTP and hardware security-key support out of scope for this foundation pass.

MFA production gate:

- [x] Roadmap updated before implementation.
- [x] MFA database fields added.
- [x] TOTP setup and verification utility implemented.
- [x] Account MFA setup page implemented.
- [x] Login enforces MFA when enabled.
- [x] Admin MFA-required control implemented for admin and finance users.
- [x] MFA events audit logged.
- [x] Build passes.
- [x] Site audit script passes.
- [x] No secrets committed.

## Review Update - 2026-05-24 Admin Bulk Import Export Pass

Scope for this pass:

- Add admin-only CSV export endpoints for users, sites and systems.
- Add admin-only CSV import endpoints for sites and systems with strict headers, validation and row-level failure reporting.
- Keep user bulk import out of scope until an approved onboarding control is chosen for temporary passwords and reset-link delivery.
- Add operations screen links and paste-based CSV import panels for controlled staging and production administration.
- Keep all import/export actions behind existing RBAC, CSRF protection, write rate limiting and audit logging.

Admin import/export production gate:

- [x] Roadmap updated before implementation.
- [x] User CSV export implemented.
- [x] Site CSV export implemented.
- [x] System CSV export implemented.
- [x] Site CSV import implemented.
- [x] System CSV import implemented.
- [x] Operations UI exposes import/export controls.
- [x] Import actions are audit logged.
- [x] Build passes.
- [x] Site audit script passes.
- [x] No secrets committed.

## Review Update - 2026-05-24 Data Retention Governance Pass

Scope for this pass:

- Add a written data retention policy for portal jobcards, technician evidence, financial records, maintenance requests, audit events and account security records.
- Add a non-destructive retention report script that counts records older than policy review thresholds without deleting or modifying D1/R2 data.
- Add an npm command for operators to run the retention report before production cutover and during recurring governance reviews.
- Update the operations SOP with review cadence, legal-hold handling and deletion approval rules.
- Keep automated deletion/purge workflows out of scope until Kharon approves final retention periods and legal review.

Data retention production gate:

- [x] Roadmap updated before implementation.
- [x] Data retention policy added.
- [x] Non-destructive retention report script added.
- [x] Retention report npm script added.
- [x] Operations SOP updated with retention review workflow.
- [x] Site audit checks retention artifacts.
- [x] Build passes.
- [x] Site audit script passes.
- [x] No secrets committed.

## Review Update - 2026-05-24 Document Access Ledger Pass

Scope for this pass:

- Add a dedicated D1 document access log for jobcard PDF and technician evidence downloads.
- Record actor, role, site, storage key, document type, outcome, IP hash and user-agent metadata for each document access attempt.
- Keep existing `audit_events` writes for general security history while adding a queryable document-specific ledger.
- Update QA and audit checks so sensitive document access logging remains enforced.
- Keep user-facing access reports out of scope until reporting requirements are approved.

Document access production gate:

- [x] Roadmap updated before implementation.
- [x] Document access D1 table added.
- [x] File endpoint writes document access records.
- [x] Success, blocked and failure outcomes are logged.
- [x] QA checklist updated.
- [x] Site audit checks document access logging.
- [x] Build passes.
- [x] Site audit script passes.
- [x] No secrets committed.

## Review Update - 2026-05-24 Full Site And Portal Code Review

Scope:

Full code review of the public website and portal as deployed on tequit.co.za staging. All findings are distributed into the outstanding build phases below and into new phases added by this review.

Note on staging domain:

`tequit.co.za` is the deliberate staging and build domain. The `site.js` default URL fallback to `https://www.tequit.co.za` is intentional during this period. `PUBLIC_SITE_URL`, `PUBLIC_PORTAL_URL` and `PUBLIC_CONTACT_EMAIL` must be updated only at director-approved production cutover to `kharon.co.za`. No code changes are required for the domain switch; only environment variable updates are needed. Google Workspace `kharon.co.za` email addresses will be available for Phase 9 (email delivery) once the cutover is approved.

Public website findings:

- Contact form uses `action="mailto:..."` with no server-side handler. The honeypot field has no backend check and is inert. No submission confirmation is shown if the user's email client is unconfigured. This is the primary conversion risk for an enterprise B2B site.
- No phone number appears on the contact page or emergency support page. For a fire and security business this is a meaningful content gap, particularly for emergency scenarios.
- OG image was previously declared as `image/svg+xml`. Resolved in the 2026-05-25 verified branding pass by generating `/og/kharon-og.png` and updating `og:image:type` to `image/png`.
- Mobile navigation has a duplicate Compliance entry: `solutionLinks` includes Compliance & Maintenance (`/compliance-maintenance`) and `mainLinks.slice(1)` includes a second Compliance link resolving to the same route.
- The Solutions dropdown uses `<details>/<summary>` with `role="menu"` on the inner container. Arrow-key navigation expected of a `role="menu"` landmark is not implemented, creating a keyboard accessibility gap.
- `format-detection` meta is set to `telephone=no, address=no, email=no` globally. If a phone number is added to the site, iOS and Android auto-linking will be blocked unless this tag is updated.
- No web analytics are present on any public page. There is no visibility into traffic sources, page engagement or contact form conversion.

Portal findings:

- Session tokens are stateless HMAC tokens with a 12-hour expiry. Logout clears the browser cookie but does not invalidate the token server-side. A captured token remains usable for up to 12 hours after the legitimate user logs out.
- The `next_due_date` after jobcard closure is hardcoded to six months for all system types. SANS 10139 (fire detection) and SANS 14520 (gas suppression) specify different service cadences and some clients may require quarterly or annual intervals.
- Admin-issued password reset links are rendered as plain text into the portal operations page DOM. The full URL persists in the rendered page until the admin navigates away. A copy-to-clipboard control should replace plain-text rendering so the URL is not stored in the page or browser history.
- No portal list view has pagination. The admin dashboard caps sections at 12 records, planning views at 60 to 80 records and the finance ledger at 80. Historical records beyond these caps are not accessible.
- The admin operations page renders all users, sites, systems and jobs as inline edit forms on one page. This becomes unusable at production record volumes.
- CSV import failure details are not surfaced on the page. Users are directed to open browser network tools to review which rows failed and why.
- Technicians cannot view their completed job history from the technician dashboard. There is no way to reference past submissions or confirm an earlier jobcard.
- CSV exports do not sanitize formula-injection prefixes. Cells starting with `=`, `+`, `-` or `@` will be interpreted as formulas when the exported file is opened in Excel or Google Sheets.
- The finance ledger "Mark settled" action applies immediately on submit with no confirmation step. A misclick or accidental form submission permanently settles the record.

## Outstanding Build Phases - 2026-05-24

These phases control the remaining work after the portal security, evidence, retention and document-access hardening passes.

### Phase 1 - Responsive Retune And Visual QA

Goal: ensure the public site and portal work appropriately across desktop, laptop, tablet and mobile viewports.

Tasks:

- Retune public homepage first viewport across desktop wide, laptop, tablet portrait/landscape and mobile.
- Verify hero text, CTAs, trust strips and cinematic visuals do not crowd, overflow or obscure content.
- Retune public page headers, section spacing and CTA wrapping.
- Retune portal dashboards for technician jobcard closure, admin operations, finance ledger and client records.
- Reduce table/card density issues on small screens.
- Confirm nav/header behaviour across breakpoints.
- Tune form controls, touch targets, signature pad and file inputs for mobile use.
- Confirm no horizontal overflow on any public or portal route.
- Run responsive screenshots or equivalent browser QA across key viewport sizes.
- Run Lighthouse or equivalent after changes.
- Fix duplicate Compliance link in mobile navigation: `solutionLinks` and `mainLinks.slice(1)` both resolve to `/compliance-maintenance`; remove the redundant entry from the mobile menu build.
- Add mobile menu auto-close behavior so the `<details>` element closes after a nav link is tapped.
- Fix Solutions dropdown keyboard navigation: either replace `role="menu"` on the container with a plain `role="navigation"` group, or add arrow-key and Escape handlers to match the ARIA menu pattern.
- Remove or scope the `format-detection` meta tag so iOS and Android can auto-link phone numbers once a phone number is added to the site.

Deployable gate:

- Public pages remain readable without horizontal scrolling at mobile, tablet and desktop widths.
- Portal dashboards remain usable on mobile and tablet.
- Header and portal navigation wrap or scroll intentionally without covering content.
- Mobile navigation shows no duplicate route labels.
- Mobile menu closes automatically after a nav link tap.
- Solutions dropdown keyboard navigation matches its declared ARIA role.
- `npm run build` and `npm run audit:site` pass.

Status:

Implementation pass complete. Local build and site audit pass. Manual/browser screenshot QA across desktop, tablet and mobile remains required before closing the phase. Navigation fixes from the 2026-05-24 code review are added to this phase scope.

### Phase 2 - Portal QA And Role Hardening

Goal: prove the portal behaves correctly for every role and abuse case.

Tasks:

- Execute `docs/qa/PORTAL_ROLE_QA_CHECKLIST.md`.
- Test admin, technician, finance, client, disabled, MFA-enabled and force-password-change users.
- Confirm RBAC abuse cases block or redirect correctly.
- Confirm document access logs populate for allowed and blocked records.
- Confirm CSRF and rate limit failures behave correctly.
- Confirm that after logout the former session cookie no longer grants portal access (pre-condition for Phase 10 server-side revocation; document if only cookie-clear behaviour is present at time of QA).
- Confirm CSV exports open cleanly in Excel and Google Sheets without formula execution (pre-condition for Phase 11 injection sanitisation).
- Confirm the admin operations page "Mark settled" action requires an explicit confirmation before applying (pre-condition for Phase 11 confirmation gate).
- Record QA outcomes and remaining risks.

Status: in progress. Automated harness (`scripts/portal-role-qa.ps1`) covers login reachability, all four protected-route unauthenticated redirects, encoded path traversal, CSRF token presence, missing CSRF rejection, valid CSRF logout, and post-logout token replay (documents pre-Phase 10 / Phase 10 behaviour). All non-credential smoke checks pass against live staging (`npm run portal:qa:roles -- -SkipCredentialTests`). Post-logout cookie-clear behaviour is now server-side token revocation (Phase 10 implemented; former "cookie-clear only" behaviour resolved). Manual credential-backed QA against staging with externally supplied role credentials remains required.

### Phase 3 - Portal Operations SOP Completion

Goal: make the portal operationally usable by Kharon staff.

Tasks:

- Write onboarding SOP for creating users, assigning roles, setting MFA requirements, issuing reset links and mapping clients to sites.
- Write dispatch SOP for assigning jobs, technician closure, evidence capture and admin exception handling.
- Write incident response procedure for portal access issues.
- Finalize production cutover checklist for `portal.kharon.co.za`.

Status: implementation complete. `OPERATIONS_SOP.md` now covers onboarding, dispatch/jobcard closure, access incident response and production cutover gates. Staff dry-run and production sign-off remain required.

### Phase 4 - Admin Scheduling And Lifecycle Tools

Goal: move admin from CRUD to operational planning.

Tasks:

- Build dispatch planner for scheduling jobs and assigning technicians.
- Build lifecycle due calendar by site, system type and risk tier.
- Add operational reports for management review.
- Improve import path for existing client/site/system records if current CSV flow is insufficient.
- Add controlled seed process that avoids committed password hashes.

Status: implementation complete. Added `/portal/admin/planning` for dispatch load, lifecycle due calendar, risk bands and management reporting. Added controlled seed process documentation that keeps passwords, hashes, reset links and secrets out of committed seed material. Staff QA and real data import dry-runs remain required.

### Phase 5 - Client Account And Quote History

Goal: improve client-facing record visibility.

Tasks:

- Add client account-to-site management for multi-site customers.
- Add quote approval history.
- Add quote confirmation receipts.
- Improve client document access review/reporting if required.
- Confirm client users only see mapped sites and permitted records.

Status: implementation complete. Added client multi-site access mapping, admin grant/revoke controls, multi-site-aware client dashboard, client quote/invoice/payment history and multi-site authorization checks for client requests, quote approvals and document downloads. Credential-backed QA and representative client data review remain required.

### Phase 6 - Error Telemetry And Cloudflare Review

Goal: make production failures observable.

Tasks:

- Add structured error telemetry policy.
- Define Cloudflare log review process.
- Identify review events: auth failures, rate-limit blocks, CSRF blocks, document access failures and API/server errors.
- Add weekly/monthly review checklist.

Deployable gate:

- Error event categories and review thresholds are documented. ✓
- Cloudflare dashboard navigation and D1 query commands are documented. ✓
- Weekly and monthly review checklists are defined. ✓
- Incident escalation thresholds are defined. ✓
- Limitations and planned improvements are documented. ✓

Status: implementation complete. Policy at `docs/roadmap/ERROR_TELEMETRY_POLICY.md`. Automated alerting and Logpush integration remain deferred pending provider selection.

### Phase 7 - Public Authority Proof

Goal: replace placeholder authority with real approved proof.

Tasks:

- Collect 2-4 approved project examples.
- Confirm publishable client names, sectors, locations and system details.
- Add case-study summaries covering challenge, system scope and operational outcome.
- Add approved industrial photography or anonymised technical imagery.
- Add compliance and maintenance evidence examples where commercially safe.
- Replace schematic placeholders where real imagery is stronger.

Status: pending.

### Phase 8 - Image Optimization And Performance Governance

Goal: harden performance after real media is added and resolve known asset format gaps.

Tasks:

- Convert approved local imagery to Astro Image or equivalent optimized local asset handling.
- Add responsive image sizes.
- Re-run Lighthouse after image integration.
- Add bundle budget or build warning policy.
- Resolve practical chunk warnings.
- Replace `/og/kharon-og.svg` with a PNG or JPEG equivalent. Resolved in the 2026-05-25 verified branding pass with `/og/kharon-og.png` and matching `image/png` metadata.

Status: pending.

### Phase 9 - Provider-Backed Email Delivery

Goal: remove manual reset-link delivery.

Tasks:

- Select provider/workflow for email delivery.
- Add password reset email sending.
- Add secure reset email template.
- Log delivery attempts.
- Keep tokens hashed and single-use.
- Confirm no credentials enter the repository.

Status: pending.

### Phase 10 - Session Token Revocation

Goal: prevent captured or stolen tokens from remaining valid after logout.

Background:

Session tokens are stateless HMAC tokens with a 12-hour expiry. Logout previously only cleared the browser cookie; a captured token remained valid until HMAC expiry. For a portal handling financial records and client site data this was a meaningful risk.

Tasks:

- Add a `revoked_sessions` D1 table keyed on token fingerprint (SHA-256 of the full token) with an expiry timestamp column.
- Update the logout endpoint to insert the active token's fingerprint into the revocation table before clearing the cookie.
- Add `isTokenRevoked` and `revokeSessionToken` to `auth.js`; middleware checks revocation on every portal request.
- Expired revocation rows are pruned opportunistically on each `revokeSessionToken` call (batch DELETE on logout).
- Keep the stateless HMAC structure intact; only tokens explicitly added to the revocation table are rejected.
- QA harness updated with post-logout token replay test that reports PASS when Phase 10 is active.

Deployable gate:

- Logging out and immediately retrying with the former session cookie returns a `302` redirect to login. ✓ (implemented)
- A fresh login after logout issues a new token that is accepted normally. ✓
- Revocation table rows are pruned after their expiry column passes. ✓ (opportunistic cleanup on logout)
- Logout audit event is emitted as before. ✓
- `npm run build` and `npm run audit:site` pass. ✓

Status: implementation complete. Migrations `0009_revoked_sessions.sql` applied to staging D1 on 2026-05-25.

### Phase 11 - Portal Admin UX Hardening

Goal: make admin operations, planning views and portal workflows usable at production record volumes, and close security and UX gaps identified in the 2026-05-24 code review.

Tasks:

- Add pagination or load-more controls to admin dashboard sections (completed works, active dispatches, lifecycle due dates).
- Add pagination or search/filter to the admin operations page users, sites, systems and jobs inline tables to replace the current 40-record hard cap.
- Add collapsible or tabbed sections to the admin operations page to reduce page density.
- Surface CSV import failure row details directly on the page in a structured list; remove the instruction to inspect browser network tools.
- Replace the plain-text reset link DOM rendering in the admin operations page with a copy-to-clipboard control so the full URL is not stored persistently in the rendered page.
- Add an explicit confirmation dialog before the finance ledger "Mark settled" action is applied.
- Add a technician completed job history view showing jobs with status Completed or Invoiced assigned to the authenticated technician.
- Sanitize formula-injection prefixes (`=`, `+`, `-`, `@`) on all CSV export cells across users, sites, systems and finance exports to prevent formula execution in Excel and Google Sheets.
- Add a configurable service interval per system type to replace the hardcoded six-month `next_due_date` calculation in `submit-jobcard.js`. Store interval months on the `systems` table or as a site-level default; fall back to six months if not set.

Deployable gate:

- Admin can navigate beyond the first record cap in each list view. ✓ (collapsible overflow disclosure for users/sites/systems/jobs; limit raised to 80 jobs)
- Import failure details are visible on the page without opening network tools. ✓ (structured list with row numbers and messages)
- Reset link is shown in a copy-to-clipboard control; the raw URL is not exposed in persistent DOM markup. ✓
- Finance settlement requires an explicit confirmation step before the record is updated. ✓ (window.confirm gate)
- Technician can view their own completed job history. ✓ (`/portal/tech/history`)
- CSV exports opened in Excel and Google Sheets do not trigger formula execution on any cell. ✓ (tab-prefix sanitization in `csv.js`)
- System service intervals are configurable and the jobcard closure endpoint uses the stored interval. ✓ (migration `0010_system_service_interval.sql`; admin operations form; submit-jobcard reads interval)
- `npm run build` and `npm run audit:site` pass. ✓

Status: implementation complete. Migration `0010_system_service_interval.sql` applied to staging D1 on 2026-05-25. Staging QA of collapsible section behaviour and copy-to-clipboard with real credentials remains required.

### Phase 12 - Analytics And Conversion Tracking

Goal: add visibility into public site traffic, lead generation paths and CTA conversion so the site can be evaluated before and after the kharon.co.za cutover.

Background:

No analytics are present on any public page. There is no visibility into which traffic sources are reaching the site, which pages are being engaged with, or whether contact form submissions are completing. This gap means the director review and post-cutover period will have no baseline data.

Tasks:

- Select and integrate a privacy-aware analytics provider. Confirm data residency aligns with South African POPIA requirements before deploying any tracking.
- Track page views across all public routes.
- Track contact form submission attempts and completions.
- Track CTA clicks: Request Site Assessment, Emergency Support, Access Records.
- Track solution page and industry page engagement events.
- Confirm analytics do not fire on any `/portal/*` route.
- Update privacy notice or cookie disclosure if required by the chosen provider.
- [x] Replace the `mailto:` contact form with a server-side handler that stores submissions in D1 (`contact_submissions` table), validates inputs, checks the honeypot field server-side and applies IP rate limiting.

Contact form handler gate:

- Contact form submits to `/api/contact` via fetch; no email client dependency. ✓
- Honeypot field is validated server-side; bot submissions are silently discarded. ✓
- Name, email, request type and message are validated with minimum and maximum length rules. ✓
- IP rate limiting applies (5 submissions per 15-minute window per IP). ✓
- Submissions stored in `contact_submissions` D1 table; accessible via `wrangler d1 execute` queries. ✓
- Success confirmation replaces the form inline; error state is shown without page reload. ✓
- Migration `0011_contact_submissions.sql` applied to staging D1 on 2026-05-25. ✓
- `npm run build` and `npm run audit:site` pass. ✓

Pending:

- Analytics provider selection and integration remain deferred. Provider must meet POPIA data residency requirements before deployment.
- Contact form email notification delivery is deferred to Phase 9 (provider-backed email).
- Page-view and CTA click tracking require provider selection.

Status: contact form server-side handler implemented. Analytics provider integration pending director approval of a POPIA-compliant provider.


### Phase 13 - Security Headers And Browser Hardening

Goal: close browser-level hardening gaps before the staging portal or public site is treated as production authoritative.

Background:

Core server-side protections are present, including RBAC, CSRF, rate limiting, signed sessions, session revocation, audit events and document access logs. The remaining gap is explicit browser security policy and verifiable header posture across public and portal routes.

Tasks:

- Add or verify a strict `Content-Security-Policy`.
- Set `frame-ancestors 'none'` or equivalent clickjacking protection.
- Set `object-src 'none'`.
- Set `base-uri 'self'`.
- Set `X-Content-Type-Options: nosniff`.
- Set `Referrer-Policy: strict-origin-when-cross-origin`.
- Set a restricted `Permissions-Policy`.
- Confirm headers apply to public routes, portal routes, API JSON responses and protected file responses where appropriate.
- Confirm CSP does not break inline scripts required by portal forms, or replace inline scripts with nonce/hash-safe alternatives.
- Document approved external domains if analytics or email provider scripts are later added.
- Add header checks to the site audit script.

Deployable gate:

- Security headers are visible in staging responses.
- CSP has no blocking errors on key public and portal pages.
- Portal login, dashboard forms, jobcard submission, contact form and file downloads still work.
- `npm run build` and `npm run audit:site` pass.

Status: pending.

### Phase 14 - Public Page Differentiation And Authority Proof

Goal: reduce repetitive page structure and replace abstract proof with concrete, approved authority signals.

Background:

The public site positioning is strategically correct, but several solution pages still feel templated. Kharon needs page-specific proof that demonstrates real technical and operational competence without making unapproved client or vendor claims.

Tasks:

- Add unique proof blocks for Gas Suppression:
  - protected-room review flow,
  - agent/release infrastructure considerations,
  - room integrity and enclosure-readiness checklist,
  - discharge/release sequence diagram,
  - required pre-quote data capture.
- Add unique proof blocks for Fire Detection:
  - panel and loop review flow,
  - detector zoning and cause-and-effect explanation,
  - false-alarm diagnosis content,
  - service/commissioning evidence examples.
- Add unique proof blocks for Compliance & Maintenance:
  - maintenance evidence pack,
  - service report sample structure,
  - defect register model,
  - certificate-readiness logic.
- Add unique proof blocks for Critical Infrastructure:
  - uptime impact model,
  - escalation and response dependency map,
  - site risk-tier matrix.
- Add unique proof blocks for Security Systems:
  - access control, CCTV and monitoring as support systems around fire/gas priorities,
  - avoid generic guard/alarm positioning.
- Replace abstract proof wording with concrete but legally safe proof signals:
  - SAQCC capability statements where approved,
  - typical document outputs,
  - supported system familiarity wording,
  - commercial/industrial-only positioning,
  - Cape Town/Western Cape operational base if approved.

Deployable gate:

- No two major service pages rely on the same proof-card copy.
- Each major service page has at least one unique technical diagram, checklist or evidence-output section.
- No unapproved client names, vendor authorisation claims or absolute compliance guarantees are introduced.
- `npm run build` and `npm run audit:site` pass.

Status: pending.

### Phase 15 - Compliance Hub And SANS Operationalisation

Goal: turn SANS references into practical, accessible compliance resources that support credibility, SEO and client education.

Background:

The current site references SANS 10139 and SANS 14520, but it does not yet provide enough practical explanation, checklists or document evidence to establish Kharon as a compliance-first authority.

Tasks:

- Create a `/compliance` or `/resources/compliance` hub.
- Add practical SANS 10139 fire detection summary page.
- Add practical SANS 14520 gaseous suppression summary page.
- Add Fire Detection Service Report checklist.
- Add Gas Suppression Service Report checklist.
- Add defect severity and certificate-blocking explanation.
- Add maintenance cadence guidance with legal caution that final requirements depend on system, site, insurer and applicable standard.
- Add downloadable PDF versions after document design is approved.
- Add internal links from Gas Suppression, Fire Detection, Compliance & Maintenance, Emergency Support and Client Records.
- Add FAQ schema only after final content is approved.

Deployable gate:

- Compliance hub is live and linked from public navigation or footer.
- SANS summaries are practical, non-infringing and do not reproduce copyrighted standard text.
- Checklists are advisory and do not claim to replace professional assessment.
- PDF downloads use verified Kharon branding.
- `npm run build` and `npm run audit:site` pass.

Status: pending.

### Phase 16 - Portal Operational Data Model Expansion

Goal: align the portal data model with Kharon's intended field-service and compliance lifecycle rather than a simplified staging ledger.

Background:

The current D1 schema is suitable for staging, authentication, role dashboards, basic jobs, finance records and document access. It is not yet deep enough to replace Kharon's intended operational chain.

Target operational model:

```text
Client → Site → System → Job → Visit
                           ↘ Defect → Quote
                            ↘ Certificate
Job / Quote → Invoice
User / Technician → Visit / Job / Audit
```

Tasks:

- Add or evolve a dedicated `clients` table separate from `sites`.
- Add `job_visits` table so multiple visits can exist under one job.
- Add `defects` table with:
  - severity,
  - SANS clause reference,
  - certificate-blocking flag,
  - recommended action,
  - quote-required flag,
  - status,
  - rectification evidence.
- Add `certificates` table tied to service/job/system and blocked by unresolved certificate-blocking defects.
- Split quote and invoice concepts from generic `financial_records` when production accounting requirements are approved.
- Add technician profile fields for SAQCC/register/certification data where appropriate.
- Add site location/GPS fields for map and dispatch workflows.
- Preserve existing staging data through migration scripts.
- Update role dashboards to read from expanded entities without breaking existing portal flows.

Deployable gate:

- Migrations apply cleanly to staging.
- Existing seeded data remains accessible.
- Admin can view Client, Site, System, Job, Visit, Defect and Certificate relationships.
- Client users cannot access unmapped client/site records.
- Technician users cannot access unassigned jobs/visits.
- `npm run build` and `npm run audit:site` pass.

Status: pending.

### Phase 17 - Technician Field Workflow Maturity

Goal: make the technician portal fit real mobile field-service work, including poor-signal conditions and SANS-aligned evidence capture.

Background:

The current technician workflow supports assigned jobs, start-job action, comments, parts used, follow-up actions, photos, signature and generated jobcard evidence. It does not yet capture enough structured field telemetry for Kharon's intended compliance and service-report model.

Tasks:

- Add visit start and visit end timestamps.
- Add GPS check-in and check-out capture where browser permissions allow.
- Add customer/responsible-person name, role and contact field beside signature.
- Add system-specific inspection sections:
  - fire detection panel status,
  - loop/device status,
  - battery voltage/load,
  - earth fault status,
  - gas cylinder pressure/agent mass,
  - release panel status,
  - room condition observations.
- Add defect capture from within jobcard closure.
- Add "unable to complete" and "follow-up required" status outcomes.
- Add offline draft expectations:
  - local unsent draft warning,
  - clear no-sync-risk messaging,
  - retry/resubmit guidance.
- Add evidence review before final submission.
- Add technician history filters by date, site, system and status.

Deployable gate:

- Technician can complete a realistic service visit from mobile without desktop-only controls.
- Required fields are system-type aware.
- Defects can be captured without leaving the job workflow.
- Signature includes responsible person's identity.
- Evidence photos and jobcard PDF remain access-controlled.
- `npm run build` and `npm run audit:site` pass.

Status: pending.

### Phase 18 - Client Compliance Command Centre

Goal: evolve the client portal from record access into a compliance and lifecycle status dashboard.

Background:

The client dashboard currently shows mapped sites, systems, latest jobcard download, quote approvals, maintenance requests and recent request status. Clients still need a clearer compliance summary and document pack view.

Tasks:

- Add site-level compliance summary:
  - next service due,
  - overdue systems,
  - open defects,
  - certificate status,
  - pending quotes,
  - recent completed visits.
- Add system-level status cards with risk bands.
- Add defect list visible to mapped client users where commercially appropriate.
- Add certificate and service-report download sections.
- Add "download evidence pack" for a selected site/system/date range.
- Add emergency or urgent request route from client dashboard.
- Add client-facing explanation of document status:
  - draft,
  - completed,
  - blocked by defect,
  - awaiting quote,
  - closed.
- Add account/site switching for multi-site clients.

Deployable gate:

- Client can understand compliance status without reading raw job records.
- Client can download authorised records only.
- Client can identify pending actions and quote approvals.
- Client cannot access another client's site, documents, defects or finance records.
- `npm run build` and `npm run audit:site` pass.

Status: pending.

### Phase 19 - Finance Accounting And VAT Hardening

Goal: mature the finance workspace beyond a staging ledger into a reliable accounting handoff layer.

Background:

The finance dashboard provides useful visibility into financial records, ageing and settlement, but production accounting needs VAT, invoice identifiers, debtor statements, approval controls and immutable evidence.

Tasks:

- Add VAT-exclusive, VAT amount and VAT-inclusive values.
- Add invoice number sequence rules.
- Add quote number sequence rules.
- Add debtor ageing by client/site.
- Add invoice PDF generation or export-ready invoice data.
- Add proof-of-payment attachment or reference capture.
- Add credit note or reversal workflow instead of destructive settlement edits.
- Add immutable payment event log.
- Add finance export mapping for the selected accounting workflow.
- Add finance role QA for exports, settlement, failed updates and unauthorized access.

Deployable gate:

- Finance records are exportable without formula-injection risk.
- VAT totals are correct and visible.
- Settlement and reversal actions are audited.
- Client and technician roles cannot perform finance-only actions.
- `npm run build` and `npm run audit:site` pass.

Status: pending.

### Phase 20 - Portal UX Scale And Role Dashboard Refinement

Goal: refine each portal role into a focused operational workspace rather than generic data panels.

Tasks:

- Redesign Admin landing view around:
  - exceptions,
  - SLA breaches,
  - unassigned jobs,
  - overdue systems,
  - urgent client requests,
  - missing documentation.
- Redesign Technician landing view around:
  - today's jobs,
  - start route,
  - site notes,
  - checklist,
  - submit jobcard.
- Redesign Client landing view around:
  - compliance status,
  - documents,
  - open requests,
  - quote approvals.
- Redesign Finance landing view around:
  - overdue invoices,
  - pending quotes,
  - payment capture,
  - exports.
- Add empty states, loading states and error states for every portal dashboard.
- Add search/filter patterns consistently across admin, finance and history pages.
- Add status badges and risk indicators with consistent visual language.
- Run mobile/tablet QA for all portal flows.

Deployable gate:

- Each role dashboard has one primary job to do.
- Common actions are visible without scrolling through unrelated data.
- Portal pages are usable on mobile and tablet.
- Empty/error states are informative and safe.
- `npm run build` and `npm run audit:site` pass.

Status: pending.


## Master Feature List

### Foundation

- Astro SSR architecture using the Cloudflare adapter.
- Public shell should remain no-hydration unless a visible feature requires client JavaScript.
- Portal pages use SSR and Cloudflare bindings for D1/R2 operations.
- Shared site data module for navigation, SEO, sitemap, industries, and contact details.
- Stable project structure:
  - `src/layouts`
  - `src/components/layout`
  - `src/components/sections`
  - `src/components/ui`
  - `src/pages`
  - `src/styles`
  - `src/assets`
  - `src/content`
  - `src/lib/server`
  - `src/middleware.js`
  - `schema.sql`
  - `migrations`

### Brand And Trust

- Clear Kharon identity in header, footer, page titles, metadata, and schema.
- Fire and suppression-first copy hierarchy.
- Security positioned as secondary integrated capability.
- Enterprise tone: operational maturity, engineering discipline, reliability, compliance, industrial familiarity.
- Avoid residential alarm, generic installer, startup, cyberpunk, and agency-portfolio cues.

### Navigation

- Desktop header with logo left, navigation center, CTA right.
- Solutions dropdown:
  - Gas Suppression
  - Fire Detection
  - Compliance & Maintenance
  - Security Systems
- Mobile slide-over menu with dark background and large tap targets.
- Persistent CTA: `Request Site Assessment`.
- `Access Records` link in header, mobile menu, footer and contact page routes to the live portal login.
- Keyboard-accessible dropdown and menu escape behavior.

### Pages

- Homepage with compact routing flow:
  - Cinematic hero
  - Compliance strip
  - Operational route matrix
  - Technical proof modules
  - Footer
- Gas Suppression page with clean-agent, cylinder bank, release infrastructure and lifecycle support content.
- Fire Detection page with addressable systems, control infrastructure and response logic content.
- Compliance & Maintenance page with inspection, servicing, reporting and lifecycle content.
- Critical Infrastructure page with uptime-sensitive environments and continuity-risk routing.
- Emergency Support page with severity-led operational support pathways.
- Security Systems page with access control, CCTV, monitoring and integration content.
- Industries page with commercial and industrial environment coverage.
- About page with Kharon positioning, engineering discipline, operating model and trust signals.
- Contact page with server-side accessible enquiry form and direct contact routes.
- Portal login page with role-directed authentication.
- Technician dashboard for assigned dispatches and jobcard closure.
- Admin dashboard for completed works, active dispatches and lifecycle exposure.
- Admin exception queues for client requests, overdue lifecycle items, missing documentation and finance follow-up.
- Admin operations page for user, site, system and job administration.
- Client dashboard for system status, maintenance dates, jobcard downloads and quote approval.
- Client maintenance request submission and recent request tracking.
- Finance dashboard for pending invoices, receipts and balance summaries.

### Component System

- `BaseLayout`: global styles, metadata, schema, canonical URL, header slot.
- `Header`: desktop nav, dropdown, mobile menu, portal link, CTA.
- `Footer`: brand summary, solution links, contact, portal link.
- `CinematicHero`: compact homepage first viewport with fake-3D titan Kharon mark, topology SVG, compliance tags and three CTAs.
- `Hero`: inner-page dark first viewport with meaningful protection-architecture SVG.
- `ContextualInquiry`: page-specific inquiry forms that preserve request context.
- `RouteMatrix`: homepage routing into dedicated system, sector, compliance and emergency paths.
- `ServiceGrid`: capability cards with restrained hover behavior.
- `SplitFeature`: text plus technical visual or optimized industrial image.
- `Industries`: compact industry matrix.
- `CTA`: dark final conversion band.
- `SectionHeading`: reusable heading block.
- `Button`: primary, secondary, dark variants.
- `Cards`: reusable card shell for capability/proof modules.
- `Status indicators`: small visual indicators for system, compliance, lifecycle and risk states.

### Visual System

- Exact CSS variables:
  - `--kharon-purple: #4B2E83`
  - `--kharon-blue: #1F4E79`
  - `--kharon-black: #0B0D0F`
  - `--kharon-charcoal: #15191D`
  - `--kharon-grey: #2B3138`
  - `--surface-light: #F3F5F7`
  - `--border-grey: #D6D9DD`
  - `--white: #FFFFFF`
  - `--accent-amber: #F59E0B`
  - `--accent-cyan: #00C2FF`
- Hybrid contrast rhythm:
  - Dark hero
  - Light informational content
  - Dark CTA
  - Light detail sections
- Typography:
  - `"Century Gothic", "Avenir Next", "Segoe UI", sans-serif`
- H1 roadmap target: `clamp(3rem, 6vw, 5rem)`, `700`, `1.05`, `0` letter spacing
  - H2 roadmap target: `clamp(2rem, 4vw, 3.2rem)`
- Container width: `1280px`.
- Reading width: `760px`.
- Section spacing: `6rem`, mobile `4rem`.
- Hero spacing: `10rem` top, `8rem` bottom.

### Cinematic System

- No live Three.js or R3F on the public shell.
- Use CSS perspective, layered opacity, restrained shadows and inline SVG topology for the illusion of 3D.
- Keep motion subtle, CSS-only and reduced-motion aware.
- Use meaningful visual logic: detection, confirmation, release, lifecycle evidence and escalation paths.
- Avoid fake HUDs, dashboard widgets, particle systems, gaming scenes and decorative telemetry.

### Image System

- Industrial realism.
- Low saturation.
- Cinematic contrast.
- Structured compositions.
- Preferred asset subjects:
  - Gas suppression cylinder banks.
  - Clean-agent release infrastructure.
  - Fire detection control panels.
  - Industrial detectors.
  - Access control and enterprise CCTV.
  - Control-room or infrastructure environments.
- Apply visual treatment:
  - `contrast(1.05)`
  - `brightness(0.95)`
  - `saturate(0.9)`
- Replace ordinary `<img>` use with Astro Image where local image assets are added.

### SEO

- Unique page titles.
- Unique page descriptions.
- Canonical URLs.
- OpenGraph tags.
- Twitter card metadata.
- `robots.txt`.
- `sitemap.xml`.
- LocalBusiness JSON-LD.
- Staging/test canonical domain: `https://www.tequit.co.za`.
- Final production canonical domain: `https://www.kharon.co.za`.

### Accessibility

- Semantic landmarks.
- Proper heading hierarchy.
- Skip link.
- Keyboard navigation.
- Visible focus states.
- Accessible menu buttons.
- Labelled form fields.
- Reduced-motion handling.
- Color contrast review against WCAG AA.

### Performance

- Server rendering by default for Cloudflare deployment.
- Minimal hydration.
- No live 3D runtime in the public shell.
- CSS/SVG cinematic visuals only.
- Responsive images.
- Compressed local assets.
- No unnecessary global JavaScript.
- Lighthouse target: 95+ for performance, accessibility, best practices and SEO.

### Portal Operations

Purpose:

Provide a secure operational portal for Kharon staff, clients and finance users while keeping the public website and portal in one maintainable Astro codebase.

Current implementation:

- RBAC roles: `tech`, `admin`, `client`, `finance`.
- Session cookie: `kharon_session_token`, HttpOnly, Secure, SameSite=Strict, 12-hour expiry.
- Password storage: PBKDF2 SHA-256 hashes generated by `npm run portal:hash-password`.
- Middleware protects `/portal/*`, bypassing login and auth API only.
- D1 tables: `users`, `sites`, `systems`, `jobs`, `financial_records`, `maintenance_requests`, `client_site_access`, `audit_events`, `job_evidence_files`, `document_access_logs`, `portal_rate_limits`, `password_reset_tokens`, `revoked_sessions`, `contact_submissions`.
- R2 stores generated jobcard PDFs under `jobcards/job-[jobId]-completed.pdf`.
- Technician job closure updates job status, lifecycle dates, R2 documentation and finance records.
- Client file downloads are permission-checked against site ownership.

Operational gaps to resolve before replacing manual back-office processes:

- User lifecycle:
  - [x] Admin UI for creating, disabling and role-changing users.
  - [x] Forced temporary-password rotation on first login.
  - [x] Password reset workflow through admin-issued reset links; provider-backed email delivery still pending.
  - [x] Session revocation or logout endpoint.
  - [x] Optional MFA for admin and finance roles.
- Data administration:
  - [x] Admin CRUD foundations for sites, systems and technician assignments.
  - [x] Bulk import/export paths for sites, systems and users.
  - [ ] Import path for existing client/site/system records.
  - [x] Controlled seed process that does not store hashes in committed files.
  - [x] Data retention policy for jobcards, quotes, invoices and audit evidence.
- Technician workflow:
  - [x] Replace pasted signature data URL with a proper touchscreen signature pad.
  - [x] Add job status transition from Scheduled to In Progress.
  - [x] Add offline/poor-signal handling expectations for field work.
  - [x] Capture parts used, fault categories, photos and follow-up actions.
  - [x] Improve generated jobcard PDF to include visual signature and richer site/system evidence.
  - [x] Add completed job history view for technicians (Phase 11).
- Admin workflow:
  - [x] Dispatch planner for scheduling jobs and assigning technicians.
  - [x] Lifecycle due calendar by site, system type and risk tier.
  - [x] Exception queues for overdue systems, missing documentation and finance follow-up.
  - [x] Export operational reports for management review.
  - [x] Pagination and search controls on admin operations list views (Phase 11).
  - [x] Collapsible or tabbed sections on admin operations page (Phase 11).
  - [x] Import failure row details surfaced on page (Phase 11).
  - [x] Configurable service interval per system type replacing hardcoded six months (Phase 11).
- Client workflow:
  - [x] Client account-to-site management for multi-site customers.
  - [x] Quote approval history and confirmation receipts.
  - [x] Maintenance request submission from the client dashboard.
  - [x] Client-visible request status and linked scheduled dispatch reference.
  - [x] Per-document access logs for sensitive records.
- Finance workflow:
  - [x] Invoice number generation and immutable ledger references.
  - [x] Payment capture and reconciliation states.
  - [x] Export to accounting workflow or CSV.
  - [x] Approval controls before invoices are marked settled.
- Security and audit:
  - [x] Audit table for auth, record access, status changes and financial changes.
  - [x] Rate limiting for login endpoint.
  - [x] Rate limiting for write endpoints beyond login.
  - [x] CSRF protection for browser-submitted state-changing requests.
  - [x] Server-side session token revocation on logout (Phase 10).
  - [x] CSV export formula-injection sanitisation (Phase 11).
  - [x] Finance settlement confirmation gate (Phase 11).
  - [x] Copy-to-clipboard reset link control replacing plain-text DOM rendering (Phase 11).
  - [x] Structured error telemetry and Cloudflare log review process (Phase 6).
  - [ ] Per-role authorization tests.
- Operations and support:
  - [x] Written SOP for onboarding users, assigning jobs and closing jobcards.
  - [x] Incident response procedure for portal access issues.
  - [x] Backup/export process for D1 and R2 evidence.
  - [x] Production cutover checklist for `portal.kharon.co.za`.
  - [x] Monitoring checks for login, dashboard redirect and D1/R2 availability.


### Public Authority And Compliance Hub

- Page-specific technical proof sections must replace generic repeated proof-card patterns.
- Gas Suppression proof must include protected-room, release-infrastructure, room-integrity and agent/readiness considerations.
- Fire Detection proof must include panel, loop, detector, zone, cause-and-effect and false-alarm diagnosis considerations.
- Compliance content must become a practical hub, not only a service page.
- SANS content must be advisory, summary-level and non-infringing; do not reproduce protected standard text.
- Approved evidence examples should include service report structures, jobcard examples, defect registers, certificate-readiness explanations and anonymised project proof.
- Public proof must avoid unapproved client names, vendor partnership claims or absolute compliance guarantees.

### Security Headers And Privacy Governance

- Add strict browser security headers before production cutover.
- Keep analytics off all `/portal/*` routes.
- Confirm POPIA implications for:
  - public contact submissions,
  - analytics,
  - portal audit logs,
  - document access logs,
  - technician evidence photos,
  - finance exports,
  - client records.
- Keep contact submissions and portal records subject to documented retention review.
- Keep all production secrets, seed credentials, reset links and password hashes outside git.

### Portal Maturity Target

Target entity model:

```text
Client → Site → System → Job → Visit
                           ↘ Defect → Quote
                            ↘ Certificate
Job / Quote → Invoice
User / Technician → Visit / Job / Audit
```

Target role experience:

- Admin: exceptions, dispatch, lifecycle, users, sites, systems, defects, certificates and audit.
- Technician: mobile field workflow, assigned jobs, SANS-aware visit capture, defects, photos and signature.
- Client: compliance status, documents, requests, quotes, invoices and evidence packs for mapped sites only.
- Finance: quote/invoice/payment workflow, VAT, debtor ageing, accounting export and immutable audit trail.


## Master User Operation

### Primary Visitor Operation

1. Visitor lands on homepage.
2. Visitor immediately understands Kharon as a commercial fire detection and gas suppression specialist.
3. Visitor scans core capabilities in priority order.
4. Visitor opens the relevant solution page.
5. Visitor validates fit through technical, operational and compliance-oriented content.
6. Visitor reviews industries served.
7. Visitor either requests a site assessment or uses the client portal link.

### Procurement Or Facilities Operation

1. User lands on a solution or industries page from search or referral.
2. User checks whether Kharon covers the site type and required system class.
3. User reads compliance and maintenance positioning.
4. User confirms Kharon is not a residential or generic security installer.
5. User submits an enquiry with site type, existing systems, priority and timescale.

### Existing Client Operation

1. User lands on homepage or contact page.
2. User finds `Access Records` in header, mobile menu, footer or the contact page.
3. User lands on `https://portal.tequit.co.za/portal/login` during staging.
4. User signs in and is routed to the dashboard allowed by their role.
5. New account requests still use the contact form until the portal has an account request workflow.

### Internal Portal Operation

1. Admin creates or updates site/system/user records in D1 using controlled scripts until an admin CRUD UI exists.
2. Technician signs in to `/portal/tech/dashboard`.
3. Technician closes assigned dispatch with comments and captured signature evidence.
4. Portal stores generated jobcard PDF in R2, marks the job completed, advances the system next due date using the configured service interval and creates an unpaid finance record.
5. Finance reviews ledger entries in `/portal/finance/dashboard`.
6. Client sees system lifecycle status and permitted jobcard files in `/portal/client/dashboard`.
7. Admin monitors active jobs, completed work and due systems in `/portal/admin/dashboard`.

### Internal Maintenance Operation

1. Update shared site facts in `src/data/site.js`.
2. Add or revise page copy in `src/pages`.
3. Add reusable UI patterns in `src/components`.
4. Add optimized local images in `src/assets`.
5. Run `npm run build`.
6. Run `npm audit --omit=dev`.
7. Run rendered smoke QA before deployment.

## Master Task List

### Architecture

- [x] Establish Astro page structure.
- [x] Establish layout, section and UI component folders.
- [x] Add shared data source for site-wide facts.
- [x] Add `src/assets` and define asset guidance.
- [x] Add `src/content` and define content guidance.
- [x] Confirm secure current Astro baseline is accepted for this implementation.
- [x] Switch deployment to Cloudflare SSR adapter.
- [x] Add Cloudflare D1 and R2 bindings.
- [x] Add server-side portal utility layer.

### Content

- [x] Add all required route files.
- [x] Add primary and secondary positioning.
- [x] Add service hierarchy.
- [x] Add core industry list.
- [x] Expand homepage to include dedicated Integrated Systems and Compliance sections after Industries.
- [x] Add deeper solution-specific proof points and operating evidence.
- [x] Add trust modules: compliance records, maintenance cadence, response process, documentation outputs.
- [x] Add South Africa-relevant compliance language where business requirements confirm scope.
- [ ] Add page-specific technical proof sections for Gas Suppression, Fire Detection, Compliance, Critical Infrastructure and Security.
- [ ] Add compliance hub content with SANS 10139 and SANS 14520 practical summaries.
- [ ] Add approved document evidence examples: jobcard, service report, defect register and certificate-readiness guidance.
- [ ] Add page-specific CTA wording and routing for protected-room review, fire detection review, compliance audit, urgent fault and records access.

### UI And Visuals

- [x] Add dark technical hero.
- [x] Add service cards.
- [x] Add split feature sections.
- [x] Add industry grid.
- [x] Add final CTA.
- [x] Add technical schematic visuals.
- [ ] Add final industrial image assets.
- [ ] Convert image usage to Astro Image for local assets.
- [x] Add reusable `Card` and `StatusIndicator` UI components.
- [x] Add more visual rhythm across homepage sections.
- [ ] Tune mobile typography and spacing against real screenshots.

### Technical Visual System

- [x] Replace 3D hero payload with static technical scene.
- [x] Add suppression release-sequence visual.
- [x] Add detection topology visual.
- [x] Add lifecycle maintenance flow visual.
- [x] Add compliance proof strip.
- [x] Add emergency/SLA response matrix.
- [ ] Replace schematic placeholders with approved real industrial photography where appropriate.

### SEO

- [x] Add canonical domain.
- [x] Add sitemap.
- [x] Add robots.
- [x] Add OpenGraph metadata.
- [x] Add LocalBusiness schema.
- [x] Add unique meta descriptions per page.
- [x] Add OpenGraph image once a brand image asset exists.
- [x] Replace SVG OG image with PNG or JPEG and update `og:image:type` meta.
- [x] Validate generated sitemap in built output.

### Accessibility

- [x] Add skip link.
- [x] Add visible focus styles.
- [x] Add labelled contact form.
- [x] Add reduced-motion support.
- [x] Add keyboard-accessible mobile menu escape behavior.
- [x] Fix duplicate Compliance link in mobile navigation.
- [x] Add mobile menu auto-close on nav link tap.
- [x] Fix Solutions dropdown ARIA role and keyboard navigation pattern.
- [ ] Audit keyboard flow in Browser across desktop and mobile.
- [ ] Run automated accessibility check when tooling is available.
- [ ] Verify all color combinations against WCAG AA.

### Performance

- [x] Astro SSR build passes.
- [x] Dependency audit passes.
- [x] Reduce 3D client chunk warning by removing live 3D public-shell dependency.
- [ ] Add responsive local image optimization.
- [ ] Run Lighthouse or equivalent once browser tooling is stable.
- [ ] Add bundle budget or build warning policy.

### Deployment

- [x] Build produces Cloudflare SSR output in `dist`.
- [x] Add Cloudflare deployment config.
- [x] Add production environment notes.
- [x] Add preview deployment smoke checklist.
- [x] Add DNS/canonical verification checklist.

### Portal Operations

- [x] Add D1 schema for users, sites, systems, jobs and financial records.
- [x] Add RBAC middleware for portal routes.
- [x] Add authentication endpoint and signed session cookie.
- [x] Add technician jobcard closure endpoint with D1/R2 writes.
- [x] Add protected document retrieval endpoint.
- [x] Add quote approval endpoint.
- [x] Add role dashboards for technician, admin, client and finance.
- [x] Add portal login routing from public website CTAs.
- [x] Verify live staging portal login and protected dashboard redirect behavior.
- [x] Add logout endpoint.
- [x] Add admin CRUD screens.
- [x] Add first-login password rotation path.
- [x] Add password reset.
- [x] Add login rate limiting and audit logging.
- [x] Add signature pad UI and richer jobcard PDF evidence.
- [x] Add dispatch scheduling workflow.
- [x] Convert client requests into scheduled dispatches.
- [x] Add monitoring and backup SOPs.
- [x] Add server-side session token revocation on logout (Phase 10).
- [x] Add pagination and search to admin operations list views (Phase 11).
- [x] Add technician completed job history view (Phase 11).
- [x] Sanitize CSV export cells against formula injection (Phase 11).
- [x] Add confirmation gate to finance Mark settled action (Phase 11).
- [x] Replace reset link plain-text DOM rendering with copy-to-clipboard control (Phase 11).
- [x] Add configurable service interval per system type (Phase 11).
- [ ] Add web analytics to public site (Phase 12).
- [ ] Add migration plan from `portal.tequit.co.za` to `portal.kharon.co.za`.
- [ ] Add strict security headers and CSP verification (Phase 13).
- [ ] Expand portal data model with Clients, Visits, Defects and Certificates (Phase 16).
- [ ] Add SANS-aware technician field telemetry and defect capture (Phase 17).
- [ ] Add client compliance command centre and evidence-pack downloads (Phase 18).
- [ ] Add finance VAT, invoice numbering, debtor ageing and proof-of-payment maturity (Phase 19).
- [ ] Refine role dashboards around primary operational jobs (Phase 20).

## Phased Implementation

### Phase 1: Website Foundation

Goal:

Create a deployable static site with all required routes, shared layout and baseline styling.

Tasks:

- Create Astro project structure.
- Create required pages.
- Create `BaseLayout`, `Header`, `Footer`.
- Add global CSS variables and typography.
- Add responsive section spacing.
- Add core navigation and CTA.

Deployable gate:

- `npm run build` passes.
- All required routes render.
- Header and footer appear on every page.
- No placeholder broken routes.

Status:

Complete.

### Phase 2: Enterprise Content And Positioning

Goal:

Make the site clearly communicate fire detection, gas suppression and critical-environment credibility.

Tasks:

- Add primary and secondary positioning.
- Add service hierarchy.
- Add service pages with focused copy.
- Add industries page.
- Add about page with specialist positioning.
- Add contact page with enquiry form.

Deployable gate:

- Visitor can understand what Kharon does within first viewport.
- Each required page has complete copy.
- Contact path is visible and usable.

Status:

Substantially complete.

Remaining:

- Add richer proof, compliance and operating evidence.
- Add South Africa-specific wording only after business/legal scope is confirmed.

### Phase 3: Visual System And Component Polish

Goal:

Move the site from functional to enterprise-grade visual maturity.

Tasks:

- Refine dark/light contrast rhythm.
- Add reusable `Card` and `StatusIndicator` components.
- Expand homepage with Integrated Systems and Compliance sections.
- Add final industrial image assets.
- Replace generic image handling with Astro Image.
- Tune mobile spacing and type scale.

Deployable gate:

- Homepage has full required roadmap flow.
- Reusable component system covers cards, indicators and section patterns.
- Mobile first viewport is readable and not blocked by header/menu.
- No placeholder imagery remains.

Status:

In progress.

### Phase 4: Technical Atmosphere And Performance

Goal:

Keep the hero visually technical while preserving fast static-first performance.

Tasks:

- Maintain static technical scene without client JavaScript.
- Keep diagrams SVG/HTML-first.
- Preserve no-hydration public shell.
- Add approved industrial photography when available.
- Verify above-the-fold content remains script-light.

Deployable gate:

- Hero 3D renders without console errors.
- Non-3D content remains fully readable if WebGL fails.
- Build warning for large 3D chunk is resolved or documented as accepted.

Status:

In progress.

### Phase 5: SEO, Accessibility And Trust Hardening

Goal:

Prepare the website for public production standards.

Tasks:

- Add unique meta descriptions per page.
- Add final OpenGraph image.
- Validate schema output.
- Validate sitemap output.
- Run keyboard QA.
- Run contrast QA.
- Run Lighthouse or equivalent.
- Fix all high-signal warnings.

Deployable gate:

- `npm run build` passes.
- `npm audit --omit=dev` passes.
- Sitemap and robots are correct.
- Browser smoke test has no console errors.
- Accessibility checks meet WCAG AA target.
- Lighthouse target is 95+ where tooling can verify it.

Status:

Partially complete.

### Phase 6: Deployment Readiness

Goal:

Make the website and portal ready for Cloudflare's serverless deployment model.

Tasks:

- [x] Choose deployment target.
- [x] Add target-specific config.
- [x] Confirm Node version and build command.
- [x] Confirm output directory.
- [x] Confirm canonical URL and DNS assumptions.
- [x] Add preview deployment smoke checklist.
- [x] Add production deployment checklist.

Deployable gate:

- Preview deployment succeeds.
- Active staging or production domain resolves.

### Phase 7: Proof & Case Evidence

Goal:

Add verified project evidence without inventing client claims.

Tasks:

- [ ] Collect 2-4 approved project examples.
- [ ] Confirm which client names, sectors, locations and system details may be published.
- [ ] Add case-study summaries covering challenge, system scope and operational outcome.
- [ ] Add approved industrial photography or anonymised technical imagery.
- [ ] Add compliance/maintenance evidence examples where commercially safe.
- Canonical links, sitemap and robots reference production domain.
- Contact and portal links work.

Status:

Cloudflare is selected for the Tequit staging stack. Deployment config lives in `wrangler.jsonc`; the Astro Cloudflare adapter emits SSR Worker output and static assets. Domain-level apex/www redirects belong in Cloudflare Redirect Rules or Bulk Redirects.

### Phase 8: Session Security Hardening

Goal:

Close the session revocation gap so logout is fully effective server-side.

Tasks:

- [x] Add revoked sessions table to D1 schema.
- [x] Update logout endpoint to write token fingerprint to revocation table.
- [x] Update middleware to reject revoked token fingerprints on every portal request.
- [x] Add revocation table cleanup for expired rows (opportunistic batch DELETE on logout).
- [x] Update QA harness with post-logout token replay test.

Deployable gate:

Former session cookie rejected after logout. Fresh login works normally. Revocation table stays bounded.

Status:

Implementation complete (2026-05-25). Apply `migrations/0009_revoked_sessions.sql` to staging and production D1.

### Phase 9: Portal Admin UX And Export Hardening

Goal:

Make the admin portal usable at production record volumes and close the data quality and UX gaps identified in the 2026-05-24 code review.

Tasks:

- [x] Add pagination or load-more to all capped admin list views (collapsible overflow disclosure).
- [x] Add collapsible or tabbed layout to admin operations page.
- [x] Surface CSV import failure details on the page (structured list with row numbers).
- [x] Replace reset link plain-text DOM rendering with copy-to-clipboard control.
- [x] Add confirmation dialog before finance Mark settled action.
- [x] Add technician completed job history view at `/portal/tech/history`.
- [x] Sanitize formula-injection prefixes on all CSV export cells (tab prefix).
- [x] Add configurable service interval per system type on the systems table.

Deployable gate:

All items above pass manual QA. `npm run build` and `npm run audit:site` pass.

Status:

Implementation complete (2026-05-25). Apply `migrations/0010_system_service_interval.sql` to staging and production D1. Manual staging QA with real credentials remains required.

### Phase 10: Analytics And Contact Form

Goal:

Add conversion visibility and replace the mailto contact form with a server-side handler.

Tasks:

- [ ] Select privacy-aware analytics provider; confirm POPIA alignment.
- [ ] Track public page views, CTA clicks and contact form conversion events.
- [ ] Confirm no analytics fire on `/portal/*` routes.
- [x] Replace `action="mailto:..."` contact form with a server-side form handler storing submissions in D1 with IP rate limiting and server-side honeypot validation (Phase 12 contact handler, 2026-05-25).
- [ ] Add phone number to contact and emergency support pages.
- [ ] Update privacy notice if required by chosen analytics or form provider.

Deployable gate:

Analytics events appear in provider dashboard for public routes. No events on portal routes. Contact form submission confirmed in staging without requiring a local email client. Phone number is visible on contact and emergency pages.

Status:

Contact form handler implemented and deployed to staging (migration `0011_contact_submissions.sql` applied). Analytics provider selection and phone number pending director input.


### Phase 11: Security Headers And Browser Hardening

Goal:

Add explicit browser security policy and verify header posture across public, portal, API and protected document routes.

Tasks:

- Add CSP and supporting headers.
- Confirm no portal scripts or form submissions are broken.
- Add header checks to audit tooling.
- Document approved external script/style/image domains.

Status:

Pending. Mirrors Outstanding Build Phase 13.

### Phase 12: Public Authority Proof And Compliance Hub

Goal:

Differentiate major public pages and add practical compliance resources.

Tasks:

- Add page-specific proof content.
- Add compliance hub and SANS practical summaries.
- Add approved technical diagrams and document examples.
- Add page-specific CTAs.

Status:

Pending. Mirrors Outstanding Build Phases 14 and 15.

### Phase 13: Portal Operational Model Expansion

Goal:

Expand portal data model from staging operations to Kharon's intended compliance lifecycle.

Tasks:

- Add Client, Visit, Defect and Certificate entities.
- Align role dashboards to the expanded model.
- Preserve existing staging data through migrations.
- Add certificate blocking logic tied to unresolved defects.

Status:

Pending. Mirrors Outstanding Build Phase 16.

### Phase 14: Technician Field Workflow Maturity

Goal:

Make technician workflow suitable for real mobile field-service use.

Tasks:

- Add visit timing, GPS, customer identity, system-specific readings, defect capture and offline draft expectations.
- Add evidence review before final submission.
- Add richer technician history filters.

Status:

Pending. Mirrors Outstanding Build Phase 17.

### Phase 15: Client Compliance Command Centre

Goal:

Turn client portal from record access into compliance visibility.

Tasks:

- Add site/system compliance summaries.
- Add open defects, certificate status and evidence-pack downloads.
- Add urgent request route and clearer client action states.

Status:

Pending. Mirrors Outstanding Build Phase 18.

### Phase 16: Finance Accounting Hardening

Goal:

Mature finance beyond staging ledger.

Tasks:

- Add VAT, invoice/quote numbering, debtor ageing, proof-of-payment capture, reversal flow and accounting export mapping.

Status:

Pending. Mirrors Outstanding Build Phase 19.

### Phase 17: Portal UX Scale Refinement

Goal:

Refine every role dashboard around its primary operational job.

Tasks:

- Redesign Admin, Technician, Client and Finance dashboards around role-specific action priority.
- Add consistent empty states, error states, filters, search and risk indicators.
- Complete tablet/mobile QA for every role.

Status:

Pending. Mirrors Outstanding Build Phase 20.


## Verification Commands

Use PowerShell for Node/npm commands on Windows.

```powershell
cd C:\Users\User\Desktop\Astro\kharon-website
npm install
npm run build
npm audit --omit=dev
npm run dev -- --host 127.0.0.1 --port 4321
```

Use Bash only for Bash helper scripts.

```bash
bash generate-enterprise-upgrade-fixed.sh
```

## Definition Of Done

A phase is done only when:

- The build passes.
- No known broken links or missing pages remain in that phase scope.
- All visible controls in that phase work.
- Mobile and desktop layouts are usable.
- SEO and accessibility obligations in that phase are met.
- The phase can be deployed without relying on unfinished future work.
