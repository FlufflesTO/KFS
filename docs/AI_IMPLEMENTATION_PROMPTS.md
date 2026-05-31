# KHARON AI IMPLEMENTATION PROMPTS

Use these prompts with Qwen Coder, Qoder CN, Gemini Code Assist, or Gemini CLI.  
Each prompt assumes the AI has repository access.

## Prompt 1 — Repository Reconnaissance and Design Lock

You are working on the Kharon Fire and Security Solutions Astro project.

Your first task is reconnaissance only. Do not redesign yet.

Read:
- `src/layouts/BaseLayout.astro`
- `src/layouts/portal/PortalLayout.astro`
- `src/data/site.js` or equivalent site config
- Tailwind/global CSS files
- `src/components/**`
- public brand SVG assets
- all portal dashboard pages
- all public marketing pages

Then produce:
1. A file inventory of UI-critical files.
2. A list of current reusable components.
3. A list of styling tokens/classes currently used.
4. A list of pages/components that still use flat/white/generic card styling.
5. A proposed edit plan that preserves architecture but upgrades visual execution.

Do not modify files yet except to add `DESIGN_CONSTITUTION.md` if missing.

Design target:
Industrial Command Intelligence.

Non-negotiables:
- verified Kharon letterhead stays top-left
- standalone logo may be used as low-opacity environmental 3D background mark
- brand colors are black, purple, blue, grey, cyan, amber, red, green
- public site and portal must feel unified
- technician experience must remain mobile-first
- no generic SaaS dashboard aesthetic
- no unnecessary dependencies

Before completing, confirm whether `DESIGN_CONSTITUTION.md` exists and whether it is referenced from README or contributor docs.

---

## Prompt 2 — Add the Locked Design Constitution

Add a new repository file:

`DESIGN_CONSTITUTION.md`

Paste the full Kharon Design Constitution into it.

Then update:
- `README.md`
- any contributor/developer documentation if present

Add a short section:

`UI and Design Governance`

Include:
- all UI changes must follow `DESIGN_CONSTITUTION.md`
- no new color, font, or card system may be introduced without updating it
- the design target is Industrial Command Intelligence
- generic SaaS/admin-template styling is prohibited
- public site and portal must remain visually unified

Do not alter application behavior.

---

## Prompt 3 — Global Token and CSS Upgrade

You are upgrading the Kharon design system without breaking architecture.

Edit the global CSS/Tailwind token layer.

Goals:
1. Preserve existing Kharon brand colors.
2. Add dark industrial surface tokens.
3. Add reusable operational surface classes.
4. Add background/logo environment utilities.
5. Add focus, form, button, table, and status primitives.
6. Keep CSS-only animations and reduced-motion support.
7. Do not add heavy dependencies.

Add or update tokens:

```css
--surface-obsidian: #0B0D0F;
--surface-charcoal: #15191D;
--surface-graphite: #1A2027;
--surface-elevated: rgba(21, 25, 29, 0.82);
--surface-glass: rgba(21, 25, 29, 0.68);
--line-cyan-soft: rgba(0, 194, 255, 0.18);
--line-purple-soft: rgba(75, 46, 131, 0.28);
--line-white-soft: rgba(243, 245, 247, 0.10);
--glow-cyan: 0 0 40px rgba(0, 194, 255, 0.22);
--glow-purple: 0 0 60px rgba(75, 46, 131, 0.30);
--text-primary-dark: #F3F5F7;
--text-secondary-dark: rgba(243,245,247,.72);
--text-muted-dark: rgba(243,245,247,.52);
```

Create reusable classes:
- `.kharon-page-shell`
- `.kharon-environment`
- `.kharon-grid-bg`
- `.kharon-logo-watermark`
- `.kharon-surface`
- `.kharon-surface-strong`
- `.kharon-panel`
- `.kharon-command-button`
- `.kharon-secondary-button`
- `.kharon-danger-button`
- `.kharon-field`
- `.kharon-table`
- `.kharon-status-chip`
- `.kharon-focus-ring`

Rules:
- Maintain accessibility.
- Preserve reduced-motion behavior.
- Do not remove existing classes until all pages are migrated.
- No pure white portal panels unless used for printable/document contexts.

---

## Prompt 4 — BaseLayout Public Site Redesign

Upgrade `BaseLayout.astro` and public layout-level components.

Design target:
Industrial Command Intelligence public site.

Requirements:
1. Use verified top-left Kharon letterhead/full-logo asset.
2. Add environmental standalone Kharon emblem as low-opacity background layer.
3. Add obsidian/graphite page background.
4. Add subtle grid/radial glow layers.
5. Preserve SEO, metadata, structured data, sitemap assumptions, accessibility.
6. Preserve existing routes/content.
7. Keep header responsive.
8. Avoid heavy JS.

Header:
- top-left brand anchor
- dark transparent surface
- backdrop blur
- thin cyan/purple border
- formal navigation
- portal/login CTA as secure command action

Footer:
- dark operational surface
- company details
- registration/contact
- compliance/portal language
- no generic footer appearance

Do not rewrite content strategy. Upgrade visual structure only.

---

## Prompt 5 — PortalLayout Operations Console Redesign

Upgrade `PortalLayout.astro`.

Design target:
Secure operations command console.

Requirements:
1. Dark industrial background.
2. Top-left formal Kharon identity.
3. Role-aware navigation remains intact.
4. Sidebar/nav rail must feel like command infrastructure, not a generic admin menu.
5. Add top status/context bar where appropriate.
6. Use dark glass-metal surfaces.
7. Preserve auth, redirects, role checks, SSR behavior.
8. Technician/mobile views must remain fast and touch-friendly.

Portal shell layout:
- desktop: left rail + main command canvas
- tablet: compact rail or top nav
- mobile: bottom/compact navigation when practical
- content max width must support dense operational dashboards

All existing portal pages should visually inherit this shell.

---

## Prompt 6 — Core Component Migration

Update shared components:

- `Logo.astro`
- `Button.astro`
- `KharonButton.astro`
- `Card.astro`
- `KharonCard.astro`
- `StatusIndicator.astro`
- `SectionHeading.astro`
- `TrustBar.astro`
- `ProofGrid.astro`
- `RouteMatrix.astro`
- `SectorRiskGrid.astro`
- `ServiceGrid.astro`
- `SplitFeature.astro`
- `TrustModules.astro`
- suppression/fire/security technical blocks

Objectives:
1. Preserve props and public interfaces where possible.
2. Apply Kharon surface/token system.
3. Replace generic light card visuals with operational glass-metal visuals.
4. Use cyan/purple/blue/amber status logic consistently.
5. Keep responsive behavior.
6. Add visible focus styles for interactive components.
7. No unnecessary dependencies.

Component visual intent:
- `TrustBar`: illuminated authority strip
- `ProofGrid`: verification/intelligence matrix
- `RouteMatrix`: operational routing/orchestration map
- `SectorRiskGrid`: infrastructure risk profile grid
- `SuppressionAuthority`: premium technical authority section
- `SplitFeature`: cinematic asymmetric feature section
- `StatusIndicator`: operational telemetry chip

---

## Prompt 7 — Public Pages Visual Upgrade

Upgrade public Astro pages without changing routes or business logic.

Pages:
- `/`
- `/about`
- `/services`
- `/industries`
- `/compliance`
- `/compliance-maintenance`
- `/critical-infrastructure`
- `/emergency-support`
- `/fire-detection`
- `/gas-suppression`
- `/security-systems`
- `/contact`
- `/404`

Goals:
1. Make all pages visually unified.
2. Use dark industrial backgrounds.
3. Strengthen hero hierarchy.
4. Add environmental logo depth.
5. Make service/risk/compliance sections feel technical and premium.
6. Preserve existing SEO copy and metadata unless obviously broken.
7. Preserve forms and API integrations.

Specific page direction:
- Home: infrastructure continuity authority
- Fire Detection: addressable/cause-and-effect engineering
- Gas Suppression: clean-agent mission-critical precision
- Compliance: forensic, inspection-ready, evidence-led
- Contact: premium site assessment intake, not generic contact form
- 404: controlled failure state, not playful error page

---

## Prompt 8 — Portal Dashboard Visual Upgrade

Upgrade portal pages while preserving business logic.

Pages include:
- admin dashboard
- audit
- compliance
- dispatch
- enquiries
- exports
- jobs
- multi-client
- operations
- planning
- sites
- systems
- users
- advanced reporting
- feedback
- technician dashboard/history/job/log visit
- client dashboard/quotes/compliance dashboard
- finance dashboard
- auth/account pages

Rules:
1. Preserve all forms, API calls, names, IDs, methods, and expected payloads.
2. Preserve role-based access behavior.
3. Do not alter server/API logic.
4. Improve visual hierarchy and responsiveness.
5. Use dark command surfaces.
6. Tables must be readable and dense.
7. Forms must be accessible.
8. Dangerous actions must be visually controlled.
9. Technician pages must be mobile-first.

Admin:
- command center, dense data, filter ribbons, audit clarity

Tech:
- rugged mobile field terminal, large touch actions, sticky job context

Client:
- compliance confidence, quote approval clarity, maintenance request simplicity

Finance:
- controlled ledger/workflow surface, Sage-aware visual language

---

## Prompt 9 — Forms, Tables, and Workflow Components

Audit and update all form/table patterns.

Targets:
- login/reset/password/MFA forms
- contact form
- maintenance request form
- quote approvals
- admin CRUD forms
- import/export screens
- audit tables
- job tables
- site/system/user tables
- technician log-visit flow

Requirements:
1. Labels must remain visible.
2. Placeholder-only input labels are forbidden.
3. Use `.kharon-field`.
4. Focus state must be high contrast.
5. Error/success/warning states must use approved status colors.
6. Tables must support small screens.
7. Mobile tables may become stacked cards.
8. Destructive actions require strong visual confirmation.
9. Do not break endpoint payloads.

---

## Prompt 10 — Mobile and Technician UX Pass

Perform a dedicated mobile UX pass.

Test widths:
- 360px
- 390px
- 430px
- 768px
- 1024px
- desktop

Priorities:
1. Technician dashboard and job detail first.
2. Login and MFA second.
3. Client dashboard third.
4. Public hero/contact pages fourth.
5. Admin tables must degrade gracefully.

Technician requirements:
- minimum 44px touch targets
- sticky primary action when appropriate
- no horizontal overflow
- no tiny status buttons
- clear job state
- arrival/outcome flow must be obvious
- evidence/document links must be clear
- forms must be usable one-handed

Report all changes and any remaining constraints.

---

## Prompt 11 — Accessibility and QA Sweep

Run a full QA pass.

Check:
- keyboard navigation
- visible focus states
- reduced motion
- color contrast
- aria labels where required
- form labels
- responsive layout
- no horizontal overflow
- no missing SVG asset paths
- no broken portal routes
- no broken API payloads
- no hydration/runtime console errors
- no TypeScript/Astro errors

Commands to run as applicable:
- `npm run check`
- `npm run build`
- `npm run lint` if available
- `npx astro check` if configured

Produce:
1. summary of changed files
2. build/check results
3. screenshots or notes for major pages
4. remaining risks
5. confirmation that `DESIGN_CONSTITUTION.md` is followed

---

## Prompt 12 — Anti-Regression Guardrails

Add lightweight guardrails so future AI tools do not drift design.

Implement:
1. `DESIGN_CONSTITUTION.md`
2. README reference
3. optional `.github/pull_request_template.md` UI checklist
4. optional `docs/design-system.md` summary
5. comments in global CSS stating that visual tokens are governed by `DESIGN_CONSTITUTION.md`

Pull request checklist must include:
- uses approved tokens
- preserves letterhead/logo rules
- no generic SaaS/admin template visuals
- accessible focus states
- mobile technician usability
- public and portal visual unity
- reduced-motion safe

Do not add heavy automated tooling unless already present.

---

## Prompt 13 — Final Implementation Orchestrator

You are the final implementation agent.

Use all previous work and complete the redesign.

Mandatory final checks:
1. `DESIGN_CONSTITUTION.md` exists.
2. README references it.
3. Global CSS contains the dark industrial design tokens.
4. BaseLayout uses official brand assets correctly.
5. PortalLayout uses secure command-console styling.
6. Shared components use the new surface/button/status system.
7. Public pages are unified.
8. Portal pages are unified.
9. Technician mobile UX is usable.
10. Forms and tables remain functional.
11. No backend/API behavior was changed.
12. Build/check passes or issues are clearly documented.

Final response must include:
- files changed
- routes visually affected
- commands run
- results
- unresolved risks
- confirmation against design constitution
