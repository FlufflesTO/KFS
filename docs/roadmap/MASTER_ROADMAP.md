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
- Portal routes: `/portal/login`, `/portal/tech/dashboard`, `/portal/admin/dashboard`, `/portal/client/dashboard`, `/portal/finance/dashboard`.
- Portal APIs: `/portal/api/auth`, `/portal/api/job-status`, `/portal/api/submit-jobcard`, `/portal/api/maintenance-request`, `/portal/api/admin/maintenance-requests`, `/portal/api/approve-quote`, `/portal/api/file/[...key]`.
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
- Portal data is seeded only for staging. Production user onboarding, password reset, audit logging and operational data management still require dedicated workflows.

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

Deployable gate:

- Public pages remain readable without horizontal scrolling at mobile, tablet and desktop widths.
- Portal dashboards remain usable on mobile and tablet.
- Header and portal navigation wrap or scroll intentionally without covering content.
- `npm run build` and `npm run audit:site` pass.

Status:

Implementation pass complete. Local build and site audit pass. Manual/browser screenshot QA across desktop, tablet and mobile remains required before closing the phase.

### Phase 2 - Portal QA And Role Hardening

Goal: prove the portal behaves correctly for every role and abuse case.

Tasks:

- Execute `docs/qa/PORTAL_ROLE_QA_CHECKLIST.md`.
- Test admin, technician, finance, client, disabled, MFA-enabled and force-password-change users.
- Confirm RBAC abuse cases block or redirect correctly.
- Confirm document access logs populate for allowed and blocked records.
- Confirm CSRF and rate limit failures behave correctly.
- Record QA outcomes and remaining risks.

Status: in progress. Add an automated non-secret QA harness for login/protected-route smoke checks and optional credential-backed role assertions; manual staging execution with externally supplied credentials remains required.

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

Status: pending.

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

Goal: harden performance after real media is added.

Tasks:

- Convert approved local imagery to Astro Image or equivalent optimized local asset handling.
- Add responsive image sizes.
- Re-run Lighthouse after image integration.
- Add bundle budget or build warning policy.
- Resolve practical chunk warnings.

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
- Contact page with accessible enquiry form and direct contact routes.
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
- D1 tables: `users`, `sites`, `systems`, `jobs`, `financial_records`.
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
  - [ ] Controlled seed process that does not store hashes in committed files.
  - [x] Data retention policy for jobcards, quotes, invoices and audit evidence.
- Technician workflow:
  - [x] Replace pasted signature data URL with a proper touchscreen signature pad.
  - [x] Add job status transition from Scheduled to In Progress.
  - [x] Add offline/poor-signal handling expectations for field work.
  - [x] Capture parts used, fault categories, photos and follow-up actions.
  - [x] Improve generated jobcard PDF to include visual signature and richer site/system evidence.
- Admin workflow:
  - [ ] Dispatch planner for scheduling jobs and assigning technicians.
  - [ ] Lifecycle due calendar by site, system type and risk tier.
  - [x] Exception queues for overdue systems, missing documentation and finance follow-up.
  - [ ] Export operational reports for management review.
- Client workflow:
  - [ ] Client account-to-site management for multi-site customers.
  - [ ] Quote approval history and confirmation receipts.
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
  - [ ] Structured error telemetry and Cloudflare log review process.
  - [ ] Per-role authorization tests.
- Operations and support:
  - [x] Written SOP for onboarding users, assigning jobs and closing jobcards.
  - [x] Incident response procedure for portal access issues.
  - [x] Backup/export process for D1 and R2 evidence.
  - [x] Production cutover checklist for `portal.kharon.co.za`.
  - [x] Monitoring checks for login, dashboard redirect and D1/R2 availability.

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
4. Portal stores generated jobcard PDF in R2, marks the job completed, advances system next due date by six months and creates an unpaid finance record.
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
- [x] Validate generated sitemap in built output.

### Accessibility

- [x] Add skip link.
- [x] Add visible focus styles.
- [x] Add labelled contact form.
- [x] Add reduced-motion support.
- [x] Add keyboard-accessible mobile menu escape behavior.
- [ ] Audit keyboard flow in Browser across desktop and mobile.
- [ ] Run automated accessibility check when tooling is available.
- [ ] Verify all color combinations against WCAG AA.

### Performance

- [x] Astro SSR build passes.
- [x] Dependency audit passes.
- [ ] Reduce 3D client chunk warning.
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
- [ ] Add dispatch scheduling workflow.
- [x] Convert client requests into scheduled dispatches.
- [x] Add monitoring and backup SOPs.
- [ ] Add migration plan from `portal.tequit.co.za` to `portal.kharon.co.za`.

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
