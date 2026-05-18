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

- Static-first Astro site with Tailwind and code-native SVG/HTML technical visuals.
- Required pages: `/`, `/gas-suppression`, `/fire-detection`, `/compliance-maintenance`, `/critical-infrastructure`, `/emergency-support`, `/security-systems`, `/industries`, `/about`, `/contact`.
- Core components: `BaseLayout`, `Header`, `Footer`, `CinematicHero`, `RouteMatrix`, `Hero`, `ContextualInquiry`, `ComplianceStrip`, `SectorRiskGrid`, `EngineeringSystems`, `AuthorityEvidence`, `EmergencyResponse`, `SectionHeading`, `Button`.
- SEO basics: canonical URLs, OpenGraph tags, `robots.txt`, `sitemap.xml`, LocalBusiness JSON-LD.
- Accessibility basics: skip link, visible focus state, semantic sections, labelled contact form, reduced-motion CSS.
- Secure dependency baseline with current installed stack.

Open constraints:

- Original roadmap specified Astro 4. Current dependency audit required a secure upgrade path beyond Astro 4. Treat exact Astro version as a compatibility constraint to revisit only if the deployment target strictly requires Astro 4.
- The previous React/Three.js hero chunk has been removed to preserve static-first performance. The homepage now uses a CSS/SVG fake-3D cinematic Kharon mark instead of live WebGL.
- Industrial imagery is currently represented by code-native schematic visuals, not final photographic or optimized image assets.

## Master Feature List

### Foundation

- Static-first Astro architecture.
- No required client hydration for the public site shell.
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
- Client portal link where relevant.
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

- Static rendering by default.
- Minimal hydration.
- No live 3D runtime in the public shell.
- CSS/SVG cinematic visuals only.
- Responsive images.
- Compressed local assets.
- No unnecessary global JavaScript.
- Lighthouse target: 95+ for performance, accessibility, best practices and SEO.

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
2. User finds `Records Access` in header, mobile menu, or footer.
3. User lands on the contact page's records-access section for service records, maintenance scheduling or compliance documentation requests.

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

- [x] Static Astro build passes.
- [x] Dependency audit passes.
- [ ] Reduce 3D client chunk warning.
- [ ] Add responsive local image optimization.
- [ ] Run Lighthouse or equivalent once browser tooling is stable.
- [ ] Add bundle budget or build warning policy.

### Deployment

- [x] Build produces static output in `dist`.
- [x] Add Cloudflare Pages deployment config.
- [x] Add production environment notes.
- [x] Add preview deployment smoke checklist.
- [x] Add DNS/canonical verification checklist.

## Phased Implementation

### Phase 1: Static Foundation

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

Make the site ready for Cloudflare Pages.

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

Cloudflare Pages selected for the Tequit production stack. Deployment config lives in `wrangler.jsonc`; static headers are emitted from `public/_headers`. Pages `_redirects` is reserved for path-level redirects only; apex/www redirects belong in Cloudflare Redirect Rules or Bulk Redirects.

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
