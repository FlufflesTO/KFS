# Comprehensive Audit Implementation Plan

Based on the granular codebase audit, this implementation plan outlines the actionable steps to execute Tier 1 (Immediate Hardening), Tier 2 (Operational Optimizations), and selected Tier 3 items (Client Self-Service Dashboard, PWA Evolution).

## Phase 1: Tier 1 - Immediate Hardening (Security & Compliance)

### 1.1 Cryptographic Key Isolation
**Objective:** Ensure AES-GCM encryption of sensitive at-rest data (like Sage OAuth tokens) does not share a key with session or CSRF signing.
- **Task:** Update `src/lib/server/crypto.ts` to strictly require `ENCRYPTION_SECRET` instead of falling back to `SESSION_SECRET`.
- **Task:** Update `.dev.vars` and deployment documentation to mandate a 32+ character `ENCRYPTION_SECRET`.
- **Task:** Write a migration script to handle the transition if existing data was encrypted with the old fallback key.

### 1.2 Telemetry & Error Forensics
**Objective:** Capture runtime Worker exceptions that occur outside the D1 connection scope.
- **Task:** Integrate Cloudflare Tail or a lightweight structured logging mechanism in `src/middleware.ts` to catch unhandled promise rejections or binding failures before `auditError` can trigger.

### 1.3 Zod Schema Completion
**Objective:** Enforce strict type validation boundary on all incoming mutations.
- **Task:** Define `JobCardSchema` in `src/lib/validation/schemas.ts` and apply it to `src/pages/portal/api/submit-jobcard.ts`.
- **Task:** Define `QuoteApprovalSchema` and apply it to `src/pages/portal/api/approve-quote.js`.
- **Task:** Audit remaining API routes and replace implicit `any` assertions with parsed Zod objects.

### 1.4 CSP Nonce Enforcement
**Objective:** Eliminate potential "unsafe-inline" vulnerabilities.
- **Task:** Refactor `src/components/Logo.astro` to remove the inline `<style>` tag, moving the fill classes (`.cls-1`, `.cls-2`, etc.) into Tailwind classes or `src/styles/global.css`.

---

## Phase 2: Tier 2 - Operational Optimizations (Performance & UI/UX)

### 2.1 Asset Pipeline Modernization (Cloudflare Image Transforms)
**Objective:** Reduce data bandwidth for mobile clients viewing high-resolution jobcard evidence.
- **Task:** Update the R2 image serving logic (likely in `src/pages/portal/api/file/[...key].js` or `image-transform-endpoint.ts`) to leverage Cloudflare Images or Worker-based WebP compression before streaming the image buffer to the client.

### 2.2 Dynamic SEO Engine
**Objective:** Automatically index new service pages or content additions.
- **Task:** Refactor `src/pages/sitemap.xml.ts` to dynamically crawl the `src/pages` directory (excluding `/api` and `/portal`) using `import.meta.glob` instead of relying on the static `sitemapPages` array in `site.ts`.

### 2.3 Mobile "Gloved-Hand" UI Refinement
**Objective:** Improve touch-target accuracy for technicians operating in rugged field conditions.
- **Task:** Audit and update interactive elements in `src/pages/portal/tech/jobs/[id]/log-visit.astro` and `jobcard.astro`. Ensure all primary action buttons (`<button>`, `<a>`) have a minimum computed height/width of 48px. Increase padding on form inputs.

### 2.4 Sage-First Sync Optimization (Webhooks)
**Objective:** Real-time financial state synchronization.
- **Task:** Review and harden the existing `src/pages/api/finance/sage-webhook.ts`. Ensure it properly verifies Sage HMAC signatures and updates the relevant `financial_records` and `finance_tasks` rows automatically upon invoice payment.

---

## Phase 3: Tier 3 - Selected Future Expansions

### 3.1 Client Self-Service Dashboard
**Objective:** Provide clients with a high-level compliance heatmap and the ability to self-approve quotes.
- **Task:** Enhance `src/pages/portal/client/dashboard.astro` and `compliance-dashboard.astro` to visualize aggregate site status (e.g., Red/Amber/Green indicators based on `defects` and `certificates`).
- **Task:** Build a secure quote-approval UI in `src/pages/portal/client/quotes.astro` that interfaces with the newly validated `approve-quote.js` endpoint, automatically triggering a workflow state change.

### 3.2 Progressive Web App (PWA) Evolution
**Objective:** Enable native-like installation and robust offline caching for the technician portal.
- **Task:** Finalize the `public/sw.js` (or `src/sw.ts` if it exists) to pre-cache critical shell assets (HTML, CSS, JS, logo).
- **Task:** Configure the `manifest.webmanifest` with accurate Kharon branding colors and icons.
- **Task:** Ensure the service worker intercepts fetch requests for `/portal/tech/*`, falling back to cached responses or the `offline-sync.ts` IndexedDB queue when `navigator.onLine` is false.
