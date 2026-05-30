KHARON FIRE & SECURITY - SYSTEM HARDENING & REMEDIATION REGISTRY
Target Baseline: May 2026 | Execution Framework: Astro SSR, Cloudflare Serverless, SQLite (D1)

This document contains the complete structural remediation task list for the Kharon Fire & Security (KFS) platform. The assisting AI engine must read this file, execute exactly one task at a time, verify compilation, log changes, and update the task status from [ ] to [x].

🏗️ PHASE 1: CORE INFRASTRUCTURE & DATABASE FOUNDATION

[x] Task SRE-001: Automated D1 Migrations in CI/CD Pipeline
Target File: .github/workflows/ci-cd.yml
System Context: wrangler.jsonc
Surgical Prompt:
USER_DIRECTIVE: Execute Remediation for Task ID [SRE-001]
TARGET_FILE: .github/workflows/ci-cd.yml
SYSTEM_CONTEXT: wrangler.jsonc

CRITICAL CONSTRAINTS:
1. Refactor the GitHub Actions deployment workflow strictly following May 2026 Cloudflare Wrangler Action paradigms.
2. Automate the execution of pending database migrations against the live production D1 database.
3. Inject a distinct workflow step running `npx wrangler d1 migrations apply kharon-db --remote` sequentially after the type-checking stage (`npm run check`) but strictly before the static compilation command (`npm run build`).
4. Ensure target environment variables and Cloudflare credentials use repository encrypted secrets bindings natively.

OUTPUT ONLY THE REVISED CI/CD WORKFLOW CONFIGURATION BLOCK.

[x] Task SRE-002: Hardcoded Account ID Security RemovalTarget File: wrangler.jsoncSystem Context: AI_CONTEXT.mdSurgical Prompt:USER_DIRECTIVE: Execute Remediation for Task ID [SRE-002]
TARGET_FILE: wrangler.jsonc
SYSTEM_CONTEXT: AI_CONTEXT.md

CRITICAL CONSTRAINTS:
1. Scan the full configuration file text stream to isolate any raw, hardcoded 32-character Cloudflare Account ID strings or values.
2. Replace hardcoded identity values with a dynamic evaluation rule extracting strings natively via `env.CLOUDFLARE_ACCOUNT_ID`.
3. Do not modify or alter active D1 database bindings, R2 bucket namespaces, compatibility dates, or environment names.

OUTPUT THE UNIFIED DIFF BUNDLE FOR WRANGLER.JSONC.

[x] Task DB-005: Source Schema & Migration Alignment
Target File: schema.sql
System Context: migrations/
Surgical Prompt:
USER_DIRECTIVE: Execute Remediation for Task ID [DB-005]
TARGET_FILE: schema.sql
SYSTEM_CONTEXT: migrations/

CRITICAL CONSTRAINTS:
1. Reconcile the target file script definitions to bring the primary database baseline layout into 100% agreement with all sequential adjustments made across the cumulative migrations index.
2. Inject definitions for the 10+ missing tables (including join tracking arrays, status history ledgers, session monitoring spaces, and rate limit indices) using clean, valid SQLite syntax.
3. Ensure every table structure explicitly defines data constraints, explicit data types, primary keys, and foreign key relations.
4. Keep the exact column signatures required for multi-factor authentication, soft-deletes, session revocations, and rate limits.

OUTPUT THE SECTIONS OF SCHEMA.SQL ADDING MISSING STRUCTURAL TABLES.

[ ] Task DB-006: Migration Sequence De-duplication

CRITICAL CONSTRAINTS:
1. Identify and resolve sorting conflicts within the migration file index where duplicate indexing prefixes occur on files (`0018`, `0020`, `0024`).
2. Consolidate separate structural alteration scripts sharing a sequence marker into single, combined atomic transaction blocks.
3. Maintain chronological schema generation logic matching relational table dependencies. Do not alter any target row data fields.

OUTPUT THE UNIFIED FILE DELTA CONTENTS AND RENAMING MANIFEST.
[ ] Task DB-001: Structural Foreign Key CASCADE Deletion RepairTarget File: schema.sqlSystem Context: docs/privacy/POPIA_COMPLIANCE_DOCUMENTATION.mdSurgical Prompt:USER_DIRECTIVE: Execute Remediation for Task ID [DB-001]
TARGET_FILE: schema.sql
SYSTEM_CONTEXT: docs/privacy/POPIA_COMPLIANCE_DOCUMENTATION.md

CRITICAL CONSTRAINTS:
1. Scan for any instances of `ON DELETE CASCADE` parameters forming destructive data relationships from core entities down to task histories.
2. Remove hard cascade parameters link updates from relationships between `sites` → `systems` → `jobs` → `defects`.
3. Refactor foreign key relation definitions to enforce `ON DELETE SET NULL` or `ON DELETE RESTRICT` constraints to preserve historical data paths for POPIA compliance.

OUTPUT THE COMPLETED SCHEMA TABLE LAYOUT WITH CORRECTED RESTRICTIONS.
[ ] Task DB-007: Unified Soft-Delete State Pattern StandardizationTarget File: src/lib/server/db/user-repository.tsSystem Context: schema.sqlSurgical Prompt:USER_DIRECTIVE: Execute Remediation for Task ID [DB-007]
TARGET_FILE: src/lib/server/db/user-repository.ts
SYSTEM_CONTEXT: schema.sql

CRITICAL CONSTRAINTS:
1. Remove all references to the legacy binary checking column variable `is_active`.
2. Transition the query logic layer to use a standard ISO `deleted_at` timestamp field configuration.
3. Refactor data selection wrapper methods (`findById`, `getAll`, `authenticate`) to apply `WHERE deleted_at IS NULL` filters natively across all lookup passes.

OUTPUT THE FULLY COMPLETED, STRONGLY-TYPED USER REPOSITORY SOURCE CODE.
[ ] Task DB-003: Concurrency Protection via Optimistic LockingTarget File: src/lib/server/db/job-repository.tsSystem Context: schema.sqlSurgical Prompt:USER_DIRECTIVE: Execute Remediation for Task ID [DB-003]
TARGET_FILE: src/lib/server/db/job-repository.ts
SYSTEM_CONTEXT: schema.sql

CRITICAL CONSTRAINTS:
1. Implement a complete database optimistic locking pattern to protect job details against overlapping updates from field devices.
2. Intercept update commands to execute query verification checks using an incrementing sequence number: `SET status = ?, version = version + 1 WHERE id = ? AND version = ?`.
3. Throw a dedicated, typed concurrency error statement if a row modification call affects zero records due to an out-of-date state baseline version.

OUTPUT THE REVISED DATA PERSISTENCE METHODS WITHIN JOB-REPOSITORY.TS.
[ ] Task FIN-003: Strict Statutory 15% VAT Validation EnforcementTarget File: src/lib/validation/schemas.tsSystem Context: src/lib/server/services/finance-service.tsSurgical Prompt:USER_DIRECTIVE: Execute Remediation for Task ID [FIN-003]
TARGET_FILE: src/lib/validation/schemas.ts
SYSTEM_CONTEXT: src/lib/server/services/finance-service.ts

CRITICAL CONSTRAINTS:
1. Target the Zod object parsers that validate financial entities or invoice creation payloads.
2. Replace loose floating-point validation constraints with strict numeric literals: `z.literal(15)` or a target refinement check forcing `val === 15`.
3. Reject any calculation payloads containing non-standard or custom tax properties to ensure strict compliance with the statutory SARS standard rate.

OUTPUT ONLY THE REVISED INVOICE SCHEMA DEFINITION BLOCKS.
[ ] Task JOB-001: On-Site Field Task Visual Evidence EnforcementTarget File: src/lib/validation/schemas.tsSystem Context: src/pages/portal/tech/jobs/[id]/jobcard.astroSurgical Prompt:USER_DIRECTIVE: Execute Remediation for Task ID [JOB-001]
TARGET_FILE: src/lib/validation/schemas.ts
SYSTEM_CONTEXT: src/pages/portal/tech/jobs/[id]/jobcard.astro

CRITICAL CONSTRAINTS:
1. Locate the runtime validation schema parsing technician job card completion forms.
2. Restructure the validation layout processing the incoming attachments array to require a minimum of 1 item payload string: `z.array(z.string().url()).min(1)`.
3. Ensure server-side input processing blocks any form submittal actions that lack supporting site photographic evidence.

OUTPUT THE UPDATED JOBCARD FORM VALIDATION SCHEMAS ONLY.
🔒 PHASE 2: SECURITY & CRYPTOGRAPHIC REALIGNMENT[ ] Task SEC-001: MFA Enforcement Validation for API EndpointsTarget File: src/middleware.tsSystem Context: src/lib/server/auth.tsSurgical Prompt:USER_DIRECTIVE: Execute Remediation for Task ID [SEC-001]
TARGET_FILE: src/middleware.ts
SYSTEM_CONTEXT: src/lib/server/auth.ts

CRITICAL CONSTRAINTS:
1. Intercept all data transmission channels mapping under the sub-route pattern `/api/portal/*`.
2. Extract the active verification payload context and explicitly check the multi-factor authentication lifecycle tracking state.
3. If the authentication claims mark 'mfa_required' as true but 'mfa_verified' is unconfirmed, structurally truncate the request loop and issue a clean `403 Forbidden` response header string natively.
4. Ensure full type safety using May 2026 Astro middleware context objects.

OUTPUT ONLY THE REVISED MIDDLEWARE EXECUTION CODE BLOCK.
[ ] Task SEC-002: Fixed-Time Cryptographic Session Token VerificationTarget File: src/lib/server/auth.tsSystem Context: schema.sqlSurgical Prompt:USER_DIRECTIVE: Execute Remediation for Task ID [SEC-002]
TARGET_FILE: src/lib/server/auth.ts
SYSTEM_CONTEXT: schema.sql

CRITICAL CONSTRAINTS:
1. Locate the dynamic token string comparison steps inside the session validation pipeline.
2. Replace short-circuiting early return evaluation blocks to mitigate side-channel timing attack exposure.
3. Utilize the serverless Web Crypto standard framework via `crypto.subtle.timingSafeEqual()` to execute fixed-time data stream validations.
4. Correctly pad input arrays to match bit lengths before execution routines run.

OUTPUT ONLY THE SPECIFIC REFACTORED SESSION VALIDATION METHOD.
[ ] Task SEC-003: Elevated PBKDF2 Hashing Iteration ScalingTarget File: src/lib/server/crypto.tsSystem Context: docs/privacy/POPIA_COMPLIANCE_DOCUMENTATION.mdSurgical Prompt:USER_DIRECTIVE: Execute Remediation for Task ID [SEC-003]
TARGET_FILE: src/lib/server/crypto.ts
SYSTEM_CONTEXT: docs/privacy/POPIA_COMPLIANCE_DOCUMENTATION.md

CRITICAL CONSTRAINTS:
1. Locate the password hashing generation configuration blocks.
2. Upgrade the standard system computation iteration scale factor property from 100,000 runs to a baseline of exactly 600,000 iterations to meet POPIA Section 24 parameters.
3. Keep salt generation buffers at 32 bytes and do not alter the output signature length definition.

OUTPUT THE SECTIONS OF CRYPTO.TS DISPLAYING MODIFIED ITERATION VARIABLES.
[ ] Task SEC-004: Isolate MFA and Session Secret DefinitionsTarget File: src/lib/server/auth.tsSystem Context: wrangler.jsoncSurgical Prompt:USER_DIRECTIVE: Execute Remediation for Task ID [SEC-004]
TARGET_FILE: src/lib/server/auth.ts
SYSTEM_CONTEXT: wrangler.jsonc

CRITICAL CONSTRAINTS:
1. Locate where configuration context strings pass cryptographically down to initialization logic blocks.
2. Inject strict initialization validation checks ensuring that the `MFA_SECRET` and `SESSION_SECRET` strings evaluate as unequal.
3. Throw an immediate system startup error if the environment maps read duplicate string configurations across those variable contexts.

OUTPUT THE SPECIFIC PERIMETER VARIABLE CHECK BLOCKS.
[ ] Task SEC-005: Audit Log Network Address AnonymizationTarget File: src/lib/server/audit.tsSystem Context: schema.sqlSurgical Prompt:USER_DIRECTIVE: Execute Remediation for Task ID [SEC-005]
TARGET_FILE: src/lib/server/audit.ts
SYSTEM_CONTEXT: schema.sql

CRITICAL CONSTRAINTS:
1. Locate the method responsible for persisting event tracking context logs down to the database ledger table.
2. Intercept incoming raw connection strings (`ip_address`) before data gets logged.
3. Transform the raw address metadata using SHA-256 calculation passes paired with a secure environment configuration text salt.
4. Ensure plain-text information strings never write directly down to storage layouts.

OUTPUT THE COMPLETED LOG ARCHIVING METRIC INTERCEPTOR FUNCTION.
[ ] Task SEC-006: User Identity Anonymization Deletion LogicTarget File: src/lib/server/db/user-repository.tsSystem Context: docs/privacy/POPIA_COMPLIANCE_DOCUMENTATION.mdSurgical Prompt:USER_DIRECTIVE: Execute Remediation for Task ID [SEC-006]
TARGET_FILE: src/lib/server/db/user-repository.ts
SYSTEM_CONTEXT: docs/privacy/POPIA_COMPLIANCE_DOCUMENTATION.md

CRITICAL CONSTRAINTS:
1. Build a secure data anonymization method inside the repository file layer to fulfill POPIA Section 26 rules.
2. Replace private text inputs (such as names, physical locations, cell profiles, or validation parameters) with randomized cryptographic text values.
3. Keep numerical row identifiers, account metadata mapping vectors, and ledger linkages intact to protect financial data dependencies.

OUTPUT ONLY THE REVISED USER REPOSITORY SECURITY METHODS.
📊 PHASE 3: FINANCIAL & SARS ALIGNMENT[ ] Task FIN-001: Absolute Integer Cent Conversion in Sage ClientTarget File: src/lib/server/services/sage-client.tsSystem Context: src/lib/utils/financial-utils.tsSurgical Prompt:USER_DIRECTIVE: Execute Remediation for Task ID [FIN-001]
TARGET_FILE: src/lib/server/services/sage-client.ts
SYSTEM_CONTEXT: src/lib/utils/financial-utils.ts

CRITICAL CONSTRAINTS:
1. Audit all mathematical transformations structuring invoices before sending to the external API endpoint.
2. Strip out all fractional calculations like `(amount/100).toFixed(2)` which introduce IEEE 754 rounding errors.
3. Restructure accounting transformations to format input numbers strictly as complete integer units representing total cents.

OUTPUT THE UNIFIED FILE DELTA MODIFICATIONS FOR THE SAGE CLIENT.
[ ] Task FIN-002: Type Realignment for Financial FieldsTarget File: src/lib/server/db/finance-repository.tsSystem Context: schema.sqlSurgical Prompt:USER_DIRECTIVE: Execute Remediation for Task ID [FIN-002]
TARGET_FILE: src/lib/server/db/finance-repository.ts
SYSTEM_CONTEXT: schema.sql

CRITICAL CONSTRAINTS:
1. Audit the data property assignments mapping database columns down to memory objects.
2. Modify all transaction lookup parameters to enforce strict integer typing allocations (`number`) natively.
3. Reject any query formatting blocks that reference fractional values or real data definitions.

OUTPUT THE ENTIRE RECONCILED DATA RECORD DEFINITION BLOCK.
[ ] Task FIN-004: Automated Sage Ledger Event WebhookTarget File: src/pages/api/finance/sage-webhook.tsSystem Context: src/lib/server/db/finance-repository.tsSurgical Prompt:USER_DIRECTIVE: Execute Remediation for Task ID [FIN-004]
TARGET_FILE: src/pages/api/finance/sage-webhook.ts
SYSTEM_CONTEXT: src/lib/server/db/finance-repository.ts

CRITICAL CONSTRAINTS:
1. Build a standard Astro route controller endpoint capable of handling post event actions from external accounting sources securely.
2. Extract incoming payment allocation references from the incoming text stream and pass updates straight down to system tracking structures.
3. Verify signature headers dynamically on incoming web traffic to protect against route spoofing attempts.

OUTPUT THE COMPLETE WEBHOOK FILE CONTEXT SCRIPT.
[ ] Task FIN-005: Idempotency Validation Parameter ImplementationTarget File: src/lib/server/services/sage-client.tsSystem Context: AI_CONTEXT.mdSurgical Prompt:USER_DIRECTIVE: Execute Remediation for Task ID [FIN-005]
TARGET_FILE: src/lib/server/services/sage-client.ts
SYSTEM_CONTEXT: AI_CONTEXT.md

CRITICAL CONSTRAINTS:
1. Identify outward-facing transaction pipelines that serialize data models to outside platforms.
2. Inject a unique identifier token (`X-Idempotency-Key`) calculated using specific transaction variables directly into the request header metadata map.
3. Guarantee that transient network connectivity errors do not result in duplicate account adjustments or double billing events.

OUTPUT THE MODIFIED POST CALL INTERCEPTOR BLOCK.
[ ] Task FIN-006: Invoicing Render Multi-Page Layout RepairTarget File: src/lib/pdf/invoice-generator.tsSystem Context: src/lib/utils/financial-utils.tsSurgical Prompt:USER_DIRECTIVE: Execute Remediation for Task ID [FIN-006]
TARGET_FILE: src/lib/pdf/invoice-generator.ts
SYSTEM_CONTEXT: src/lib/utils/financial-utils.ts

CRITICAL CONSTRAINTS:
1. Audit the loop configurations pacing item layouts inside file creation processes.
2. Inject dynamic positioning check calculations that track text cursor boundaries as records get added.
3. Implement structural pagination controls that add a fresh sheet layer if items exceed standard design heights, preventing layout truncation on multi-page invoices.

OUTPUT THE COMPLETED REVISED MULTI-PAGE LAYOUT ENVELOPE.
📷 PHASE 4: FIELD OPERATIONS, EVIDENCE & STORAGE OPTIMIZATIONS[ ] Task JOB-002: Optimistic Locking Verification Check ImplementationTarget File: src/lib/server/db/job-repository.tsSystem Context: schema.sqlSurgical Prompt:USER_DIRECTIVE: Execute Remediation for Task ID [JOB-002]
TARGET_FILE: src/lib/server/db/job-repository.ts
SYSTEM_CONTEXT: schema.sql

CRITICAL CONSTRAINTS:
1. Locate tracking state persistence methods inside storage update blocks.
2. Inject verification requirements checking status properties matching the current atomic identifier count index.
3. Enforce tracking rules that safely handle transaction race condition failures by returning typed error signals back to interactive forms.

OUTPUT THE MODIFIED LOGIC MAP BLOCK FOR ROW STORAGE OPERATIONS.
[ ] Task JOB-003: Core Certificate Generation Verification Check RulesTarget File: src/pages/api/certificates/generate-pdf.tsSystem Context: src/lib/server/db/job-repository.tsSurgical Prompt:USER_DIRECTIVE: Execute Remediation for Task ID [JOB-003]
TARGET_FILE: src/pages/api/certificates/generate-pdf.ts
SYSTEM_CONTEXT: src/lib/server/db/job-repository.ts

CRITICAL CONSTRAINTS:
1. Intercept document generation requests before running formatting actions.
2. Inject validation lookups querying structural tasks records linked to target site coordinates.
3. Stop document completion scripts if relational tracking lookups identify unresolved critical failure records.

OUTPUT THE STRUCTURAL SECURITY LOOKUP BLOCKS FOR CERTIFICATE ROUTING.
[ ] Task JOB-004: Client-Side Upload Image Downsampling Compression RoutineTarget File: src/lib/forms/unifiedSubmit.tsSystem Context: AI_CONTEXT.mdSurgical Prompt:USER_DIRECTIVE: Execute Remediation for Task ID [JOB-004]
TARGET_FILE: src/lib/forms/unifiedSubmit.ts
SYSTEM_CONTEXT: AI_CONTEXT.md

CRITICAL CONSTRAINTS:
1. Target the script engine wrapping asynchronous multipart payload formatting processes.
2. Build an asset downsampling interceptor that routes upload data to hidden web canvas surfaces.
3. Re-scale large images to drop sizes below a maximum threshold of 2MB per entry before finalizing submission processing.

OUTPUT THE COMPLETE IMAGE TRANSFORM UTILITY BLOCK.
[ ] Task JOB-006: Cross-Tenant Data Access Validation RulesTarget File: src/lib/server/access.tsSystem Context: src/middleware.tsSurgical Prompt:USER_DIRECTIVE: Execute Remediation for Task ID [JOB-006]
TARGET_FILE: src/lib/server/access.ts
SYSTEM_CONTEXT: src/middleware.ts

CRITICAL CONSTRAINTS:
1. Target the authorization middleware handling data access lookups for tenant accounts.
2. Build validation requirements that compare active identity claim variables directly with access mapping tables.
3. Reject data requests with a `403 Unauthorized` response payload if the structural relation parameters are unverified.

OUTPUT THE REFACTORED TENANT PERMISSION LOOKUP CODE.
🎨 PHASE 5: UX, INTERFACES & TELEMETRY[ ] Task UI-001: Operational Alert Notification Panel Visual AlignmentTarget File: src/components/portal/OfflineBanner.astroSystem Context: DESIGN_CONSTITUTION.mdSurgical Prompt:USER_DIRECTIVE: Execute Remediation for Task ID [UI-001]
TARGET_FILE: src/components/portal/OfflineBanner.astro
SYSTEM_CONTEXT: DESIGN_CONSTITUTION.md

CRITICAL CONSTRAINTS:
1. Audit style definitions used within the interface notification panel.
2. Remove loose layouts, soft styling tokens, or non-approved colors.
3. Align visual components with the "Industrial Command Intelligence" blueprint by applying solid brand tokens uniformly.

OUTPUT THE REMEDIATED OFFLINEBANNER STRATEGY.
[ ] Task UI-002: System Focus Ring Palette UpdateTarget File: src/styles/global.cssSystem Context: DESIGN_CONSTITUTION.mdSurgical Prompt:USER_DIRECTIVE: Execute Remediation for Task ID [UI-002]
TARGET_FILE: src/styles/global.css
SYSTEM_CONTEXT: DESIGN_CONSTITUTION.md

CRITICAL CONSTRAINTS:
1. Scan for standard CSS keyboard layout selection classes (`:focus`, `:focus-visible`).
2. Replace standard purple outline indicators with the designated high-contrast corporate cyan color palette token standard.
3. Ensure absolute high-contrast highlight visibility for accessibility across system surfaces.

OUTPUT THE COMPLETED FOCUS PROPERTY MODIFICATION INDEX.
[ ] Task UI-003: Navigation Target Size Accessibility OverhaulTarget File: src/components/portal/AdminNav.astroSystem Context: DESIGN_CONSTITUTION.mdSurgical Prompt:USER_DIRECTIVE: Execute Remediation for Task ID [UI-003]
TARGET_FILE: src/components/portal/AdminNav.astro
SYSTEM_CONTEXT: DESIGN_CONSTITUTION.md

CRITICAL CONSTRAINTS:
1. Audit all structural links, interactive icons, and target selectors inside navigation components.
2. Scale up bounding dimensions using padding utilities to enforce a minimum interactable grid size of **44×44px**.
3. Prevent layout alignment breaking while expanding spacing limits for technical tools used in the field.

OUTPUT THE RESTRUCTURED ELEMENT LAYOUT STRATEGY.
[ ] Task SRE-004: Service Worker Compiling Phase IsolationTarget File: astro.config.tsSystem Context: package.jsonSurgical Prompt:USER_DIRECTIVE: Execute Remediation for Task ID [SRE-004]
TARGET_FILE: astro.config.ts
SYSTEM_CONTEXT: package.json

CRITICAL CONSTRAINTS:
1. Isolate background runtime service worker compilation steps to prevent race conditions during asset building.
2. Remove processing scripts from standard bundle loops and refactor generation tasks into a clean, standalone compilation phase.
3. Ensure generated target worker scripts map correctly into destination directories post-compilation.

OUTPUT THE UPDATED ASTRO INFRASTRUCTURE CONFIGURATION.
