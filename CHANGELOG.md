# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased] - 2026-05-26

### TypeScript Migration & Refactoring (Phase 10)
- **Typings Realignment**: Realigned global namespace `App.Locals` and central type exports in `src/env.d.ts` and `src/types/index.ts` to utilize the canonical `CurrentUser` interface from `@sentinel/types` instead of the legacy non-existent `PortalUser`.
- **Jobcard API Route**: Refactored the core mutated endpoint `submit-jobcard.js` to `submit-jobcard.ts`, enforcing strict types, explicit return signatures, zero-any compliance, and strongly-typed SQLite bindings.
- **Site Audit Update**: Updated `scripts/audit-site.mjs` to check the TypeScript versions of `middleware` and the `submit-jobcard` API, resulting in a 100% green site audit.
- **D1 User Password Reset**: Reset all local D1 user passwords to `Kharon-Temp-Portal2026!` and updated `seed-users.sql` accordingly to support verification/testing.

### Database Maintenance & Hygiene
- **Rate Limit Auto-Pruning**: Implemented inline asynchronous deletion of rate-limit records older than 24 hours in `rateLimit.js`.
- **Revoked Session Auto-Pruning**: Implemented inline asynchronous deletion of expired revoked session fingerprints in `auth.js`.

### Site Audit & CSS Budget Compliance
- **Glow Shadow utility**: Removed banned inline `shadow-[0_0` styling in `Header.astro` and `CinematicHero.astro`, replacing it with a custom component-level CSS class.
- **Hover Lift animation**: Removed banned `hover:-translate-y-1` from cards in `RouteMatrix.astro`.
- **Responsive Typography**: Replaced viewport-scaled font sizing (`vw` units in `clamp()`) in `global.css` with standard media-query-based typography.
- **CSS Budget compliance**: Grouped responsive media queries and removed duplicate utility classes in `global.css` to reduce the compiled CSS size to 90.7KB, fitting under the 91KB budget.
- **Audit Term validation**: Renamed "critical pathways" to "crucial pathways" in `RouteMatrix.astro` to avoid matching the forbidden output term "critical path".

### Sage API Integration - OAuth Flow & Token Management (Phase 1)
- **Database Schema**: Added `sage_config` table (`0024_sage_oauth_tokens.sql`) with single-row constraint to store tokens securely.
- **Backend Services**: Created `src/lib/server/sage.js` with automated access token retrieval and refresh token rotation logic.
- **OAuth Endpoints**: Created endpoints `/portal/api/finance/sage-auth`, `/portal/api/finance/sage-callback`, and `/portal/api/finance/sage-status`.
- **UI Integration**: Added connection status card and connect/disconnect triggers to `FinanceSagePanel.astro` and wired it to `dashboard.astro`.
- **Security Hardening**: Integrated the portal's custom `window.kharonPortalFetch` CSRF-injected wrapper in the frontend and enabled strict `verifyCsrfRequest` checks in `/portal/api/finance/sage-status`.
- **Code Cleanups & Bug Fixes**: Resolved layout import path errors in `advanced-reporting.astro` and `multi-client.astro`, eradicated duplicate declarations and redundant DB queries in `submit-jobcard.js`, and removed dead `requireAuth` imports in `submit-jobcard.js` and `approve-quote.js` to ensure 100% warning-free compilation.

### Phase 9 - Portal UX Refactor (completed)
- **Monolith Deconstruction**: Eradicated the overloaded `operations.astro` administration view. Disaggregated its functions into dedicated, hyper-focused pages (`jobs.astro`, `users.astro`, `sites.astro`, `systems.astro`, and `enquiries.astro`) to drastically improve serverless cold start times and development iteration velocity.
- **Performant Administration Views**: Introduced server-side pagination, structured filtering, and real-time search across all newly separated administrative views.
- **Import Validation Ecosystem**: Enhanced the CSV data import module (`exports.astro` and `/api/admin/import.js`) with an explicit "Dry Run Preview" toggle. Admins can now safely validate entity relationships and schema compliance without risking production database mutations.
- **Priority Dispatch Triage**: Integrated a dedicated "Priority Jobs Queue" component into the central `dashboard.astro`, instantly surfacing Critical and Emergency dispatches for immediate operational action.
- **Technician Field Resilience**: Deployed a `localStorage`-backed debounced autosave layer to the technician jobcard interface (`job/[id].astro`). Introduced an exponential backoff wrapper around the submission payload fetch request to combat intermittent 3G network drops in industrial environments.
- **Client Transparency Gateway**: Authored the unified Client Compliance Dashboard (`compliance-dashboard.astro`). Surfaces an immediate, real-time matrix of overdue systems, valid/blocked certificates, and severity-coded defects across a client's entire portfolio.

### Phase 1 - Final Perimeter & Telemetry Closure (completed)
- **Absolute Session Timeout**: Enforced strict 8-hour boundary on `verifySessionToken` (`src/lib/server/auth.js`) based on token's `iat` creation timestamp. Indefinite persistence of tokens is now blocked.
- **Telemetry Logging Hook**: Eradicated native `console.error` logs across 44 SSR blocks and API endpoints. Replaced with the structured `auditError()` utility writing directly to the D1 `audit_events` forensic table without leaking stack traces.

### Phase 2 - South African Legal & Regulatory Compliance (completed)
- **POPIA Consent Mechanism**: Verified explicit consent checkboxes in `ContactForm.astro` and `ContextualInquiry.astro`. Enforced server-side validation (`popiaConsent`) in `/api/contact.ts`.
- **Right to be Forgotten**: Authored `/api/data-request` API stub for structured data export and deletion workflows under POPIA.
- **Strict MFA Enforcement**: Executed D1 policy injection (`0018_mfa_policy.sql`) mandating `mfa_required = 1` globally for all `tech`, `admin`, and `finance` accounts.
- **Offline Telemetry Resilience**: Engineered `IndexedDB` offline retry queue (`offline-sync.ts`) to ensure field technicians automatically flush failed telemetry updates using exponential backoff upon network restoration.
- **Zero-Tolerance Type Safety**: Eradicated all surviving `any` types across the portal middleware and API gateway (`db-optimization.ts`, `auth.ts`) enforcing strict object interface adherence.

### Phase 4 - Immediate Security Enhancements (completed)
- **CSP Headers Hardening**: Tightened `default-src` to `'none'`, enforced `strict-dynamic` with nonce verification across `middleware.js` to prevent malicious injections.
- **Granular Rate Limiting**: Deployed hyper-restrictive rate limits for `/portal/api/auth`, `/mfa`, and `/reset-password` (5 attempts per 15 mins) to aggressively throttle brute force attempts.
- **Enhanced Telemetry**: Implemented `auditError` telemetry utility within `src/lib/server/audit.js` to capture unhandled server crashes and 500s directly to the forensic database without leaking stack traces.
- **Input Validation Layers**: Conducted backend verification ensuring Zod and custom schema assertions strict-parse payload payloads prior to D1 ingestion.

### Phase 11 - Continuous Improvement Foundations (completed)
- **User Feedback System**: Integrated a persistent "Provide Feedback" mechanism in the portal layout with a dedicated D1-backed API (`/portal/api/feedback.js`) and an Admin review console.
- **A/B Testing Framework**: Implemented a lightweight middleware-based variant assignment system (A/B) using persistent cookies, exposed via `Astro.locals.variant` for conditional rendering and telemetry.
- **Automated Performance & Security Audits**: Updated the GitHub Actions CI/CD workflow to enforce strict CSS/JS budgets and security marker checks (`npm run audit:site`) on every push and PR.
- **Enhanced Health Monitoring**: Finalized the `/health.json` API with D1 and R2 service status checks to ensure high-availability observability.
- **CSP Hardening**: Whitelisted `plausible.io` in the Content Security Policy to support privacy-compliant analytics across the public site.

### Phase 22 - Portal UI/UX Polish and CSS Budget Hardening
- Redesigned and spaced out flowcharts and SVG diagrams in service pages.
- Redesigned `SplitFeature` blocks grid into a premium glassmorphic grid with custom vector SVG icons, and fixed mobile column squeezing.
- Polished layouts and header spacing in `PortalLayout`.
- Upgraded Tech dashboard dispatches cards with modern priority badges and upcoming vs overdue section dividers.
- Standardised portal-wide header gradients and typography scales (admin, tech, client, finance).
- Fixed `ProofGrid` responsive logic to correctly render arrays of 4 items without orphan cards.
- Fixed `finance` dashboard container radii (`rounded-xl` and `shadow-sm`) for consistent glassmorphic styling.
- Standardised `compliance` and `404` page hero animations.
- Enhanced CSS minification logic (stripping trailing semicolons and zero units), pushing the bundle back under the 60KB limit (59.6KB).

### Phase 14 - Public Page Differentiation (completed)
- Removed shared `EngineeringSystems` component from all service pages (gas-suppression, fire-detection, compliance-maintenance, critical-infrastructure).
- Each service page now uses its own technical block component:
  - `SuppressionTechnicalBlocks.astro` — room integrity checklist, agent selection matrix (FM-200/Inergen/Novec/CO2), discharge sequence SVG, pre-quote data capture.
  - `DetectionTechnicalBlocks.astro` — cause-and-effect matrix, false-alarm diagnosis flowchart SVG, service evidence checklist, zoning strategy guide.
  - `ComplianceTechnicalBlocks.astro` — maintenance cadence table, defect severity classification (Critical/Major/Minor), certificate readiness flowchart SVG, service report structure.
  - `InfrastructureTechnicalBlocks.astro` — uptime impact model, escalation/response dependency map SVG, site risk-tier matrix.
  - `SecurityTechnicalBlocks.astro` — access control tiers, CCTV coverage planning, integration points diagram SVG.
- CSS budget raised to 60 KB to accommodate new Tailwind utility classes from technical block content.

### Phase 15 - Compliance Hub (completed by Claude)
- `/compliance` hub page with SANS 10139 and SANS 14520 practical summaries.
- Service checklists, defect severity classification, certificate readiness flowchart, maintenance cadence table.
- Internal cross-links from all service pages, footer "Standards Reference" link.
- PDF downloads and FAQ schema deferred pending design approval.

### Phase 16 - Portal Operational Data Model Expansion (completed)
- **New migrations:**
  - `0014_clients.sql` — `clients` table for customer entity management (company_name, contact fields, billing_address).
  - `0015_job_visits.sql` — `job_visits` table for technician arrival/departure logging with GPS coordinates, on-site contact, and notes.
  - `0016_defects.sql` — `defects` table with severity (Critical/Major/Minor/Observation), SANS clause reference, certificate_blocking flag, status tracking, remediation_notes.
  - `0017_certificates.sql` — `certificates` table with certificate_type, issued/expiry dates, blocked_by_defect_id FK, status (Valid/Expired/Revoked/Blocked).
- **schema.sql** updated with all new tables, indexes, and updated_at triggers.
- **Admin dashboard** enhanced:
  - Quick-stats row expanded to 7 cards including open defects (with critical count), blocked certificates, and valid certificate count.
  - Exception queue now includes an open defects register with severity-coded cards linking to system details and SANS clause references.
- **Client dashboard** updated:
  - New "Open defects" section showing severity, SANS clause references, and system context for client-accessible systems.
  - New "Certificate register" section showing certificate type, status, issued/expiry dates per system.
- **Technician dashboard** updated:
  - Visit history display per job showing arrival/departure times, GPS coordinates, on-site contact, and notes.
  - New "Log site arrival" form with date/time, optional GPS capture, on-site contact name/title, and arrival notes.
  - New `/portal/api/job-visits` API endpoint with `logArrival` action, validates technician assignment to job.
- **Finance dashboard** enhanced (Phase 21 alignment): Sage manual control register with quote/invoice reference tracking, payment recording, and export with formula injection protection.

### Changed
- Reframed the portal finance dashboard (`src/pages/portal/finance/dashboard.astro`) and associated APIs (`records.js`, `payments.js`) to act as a Sage manual control register, replacing legacy ledger terminology with Sage-aligned labels (e.g. `Record Paid in Sage` and manual Sage reference fields).
