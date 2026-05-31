# Phase 11: Continuous Improvement Foundation

## Objective
Establish the foundational infrastructure for the ongoing tasks defined in Phase 11 of the `MASTER_ROADMAP.md`.

## Proposed Solution

### 1. Performance Monitoring and Optimization
- **Action:** Automate site validation.
- **Implementation:** The `/health.json` API is already complete. We will add `npm run validate:site` to the `.github/workflows/ci-cd.yml` to ensure performance (JS/CSS budgets) and security are continuously monitored on every build.

### 2. User Feedback Integration
- **Action:** Add a persistent feedback mechanism in the portal.
- **Implementation:** 
  - Create a `user_feedback` table in D1.
  - Add a "Provide Feedback" modal/button in `PortalLayout.astro`.
  - Create a `/portal/api/feedback.js` endpoint to handle submissions.
  - Add a "Feedback" tab in the Admin Operations dashboard to review submissions.

### 3. A/B Testing for UX Improvements
- **Action:** Establish a lightweight feature flag / variant assignment system.
- **Implementation:** 
  - Update `src/middleware.js` to assign a `ui_variant` (e.g., 'A' or 'B') based on a persistent cookie.
  - Expose this variant via `Astro.locals.variant` to enable conditional rendering in Astro components.
  - Add variant tagging to audit logs and feedback submissions.

### 4. Regular Security Audits
- **Action:** Automate security and compliance checks.
- **Implementation:** As part of step 1, updating `.github/workflows/ci-cd.yml` to explicitly run `npm run validate:site` as a dedicated step before deployment enforces strict CSS/JS budgets and security marker checks on every PR and push.

### 5. Compliance Updates for Regulatory Changes
- **Action:** Update privacy documentation.
- **Implementation:** Update `src/pages/legal/paia-manual.html` (or create a new privacy notice section) to explicitly detail the use of Plausible Analytics, feedback collection, and A/B testing cookies, aligning with POPIA requirements.

## Migration & Rollback
- Database changes will be handled via a new migration (`0024_phase11_telemetry.sql`).
- The A/B testing flag will default to 'A' (control) if cookies are disabled.

## Verification
- Validate the new CI/CD workflow passes.
- Test the feedback form submission and its appearance in the admin dashboard.
- Verify the middleware correctly assigns and persists the A/B variant cookie.