# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased] - 2026-05-25

### Phase 4 - Immediate Security Enhancements (completed)
- **CSP Headers Hardening**: Tightened `default-src` to `'none'`, enforced `strict-dynamic` with nonce verification across `middleware.js` to prevent malicious injections.
- **Granular Rate Limiting**: Deployed hyper-restrictive rate limits for `/portal/api/auth`, `/mfa`, and `/reset-password` (5 attempts per 15 mins) to aggressively throttle brute force attempts.
- **Enhanced Telemetry**: Implemented `auditError` telemetry utility within `src/lib/server/audit.js` to capture unhandled server crashes and 500s directly to the forensic database without leaking stack traces.
- **Input Validation Layers**: Conducted backend verification ensuring Zod and custom schema assertions strict-parse payload payloads prior to D1 ingestion.

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
