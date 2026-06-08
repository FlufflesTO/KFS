# Website Rebuild — Agent Brief & Contracts

Single reference for all page-building work. **Read fully before creating any page.**
Foundation is already built; pages must consume it, not reinvent it.

---

## 1. Tone framework (replaces the old over-militarised voice)

Write **technical, direct, buyer-safe** copy. The reader is a facilities manager, building owner,
consultant or contractor making a procurement decision.

- ✅ Do: plain technical language, specific SANS references, clear outcomes, what the buyer gets.
- ✅ Do: short sentences. Lead with the problem and the result.
- ❌ Don't: military/combat metaphors ("command & control", "mission-critical defence", "battle",
  "weaponise", "tactical", "frontline", "war room", "deploy forces", "lock down the perimeter").
- ❌ Don't: hype ("revolutionary", "cutting-edge", "world-class", "unrivalled"), or fear-mongering.
- ❌ Don't: invent certifications, client names, numbers, or SANS clauses.
- Replace e.g. "Command & Control" → "Design & engineering"; "mission-critical defence" →
  "protection for critical assets"; "deploy" → "install".

## 2. Page template contract (minimum structure)

Use the shared layouts — do NOT hand-roll page structure or nav.

**Service / solution pages** → `src/layouts/ServicePage.astro`. Required props:
`meta{title,description}`, `hero{subtitle,title,description,icon}`, `overview` (1 para "what we do"),
`problem{heading,body,points[]}`, `capabilities[]{title,text}` (3–6), `standards[]` (SANS codes),
`intent` (see §4). Optional: `faqs[]{q,a}`, `caseStudySlug`, `cta`.

**Sector pages** → `src/layouts/SectorPage.astro`. Props: `meta`, `hero`, `overview`,
`risks[]{title,text}` (3), `systems[]{label,href,text}` (link to service pages), `standards[]`,
`intent`, optional `caseStudySlug`.

**Resource / guide pages** → `src/layouts/GuidePage.astro`. Props: `meta`, `hero`, `intro`,
`sections[]{heading,body?,list?}`, optional `checklists[]{title,items[]}`, `related[]{label,href}`, `intent`.

Every page file = a thin `---` frontmatter passing a data object to one layout. Example:
```astro
---
import ServicePage from "../layouts/ServicePage.astro";
---
<ServicePage
  meta={{ title: "Fire Doors | Kharon", description: "..." }}
  hero={{ subtitle: "Fire Protection", title: "Fire Doors", description: "...", icon: "/brand/icons/service-engineering.svg" }}
  overview="..."
  problem={{ heading: "...", body: "...", points: ["...","..."] }}
  capabilities={[{ title: "...", text: "..." }]}
  standards={["SANS 1253","SANS 10400-T"]}
  intent="fire-doors"
  caseStudySlug="..."
/>
```

## 3. CTA contract — approved labels ONLY

Use only these strings (from `src/data/forms.ts` `APPROVED_CTA_LABELS`):
`Request Site Assessment` · `Book a Compliance Inspection` · `Speak to an Engineer` · `Get a Quote` ·
`Report a Fault` · `Call Now` · `Discuss a similar project` · `Access Client Portal`.
The `WhatHappensNext` block (auto-included by the layouts) renders the primary CTA — pass `intent`.

## 4. Form routing map (intent → requestType)

Pages reference an **intent slug** only. The contact API resolves it via
`src/data/forms.ts` `INTENT_TO_REQUEST_TYPE` (kept in sync with `ALLOWED_REQUEST_TYPES` in
`src/lib/validation/schemas.ts`). Valid intents:

`site-assessment, general, compliance, emergency, fire-detection, gas-suppression, pa-pe, signage,
fire-doors, cctv, intrusion, access-control, integrated-security, ironmongery, data-centre,
electrical-rooms, warehousing, industrial, control-rooms, healthcare, critical-infrastructure`.

Each service page uses its own intent (e.g. `/fire-doors` → `intent="fire-doors"`); sector pages use
the sector intent.

## 5. URL registry (source of truth = src/data/site.ts)

Nav arrays (`solutionGroups`, `solutionLinks`, `sectorLinks`, `resourceLinks`, `mainLinks`) and
`sitemapPages` are already updated. Do NOT hardcode nav in pages. Routes to create:

**Services** (top-level slugs): `/fire-detection`*, `/gas-suppression`*, `/pa-pe-systems`,
`/fire-safety-signage`, `/fire-doors`, `/cctv`, `/intrusion-detection`, `/access-control`,
`/security-systems`* (Integrated Security), `/architectural-ironmongery`, `/compliance-maintenance`*,
`/emergency-support`*. (`*` = exists, rewrite to ServicePage/keep tone.)
**Hubs**: `/solutions` (rewrite), `/sectors` (new index), `/resources` (new index).
**Sectors**: `/sectors/data-centres`, `/sectors/electrical-rooms`, `/sectors/warehousing-logistics`,
`/sectors/industrial-facilities`, `/sectors/control-rooms`, `/sectors/healthcare-commercial`.
(Critical Infrastructure stays at `/critical-infrastructure`.)
**Resources**: `/resources/maintenance-checklists`, `/resources/fire-detection-guides`,
`/resources/gas-suppression-guides`, `/resources/fire-door-guides`, `/resources/cctv-security-guides`,
`/resources/faqs`, `/resources/case-studies`. (SANS Compliance = existing `/compliance`.)

## 6. Icon map (use existing /brand/icons — no missing assets)

Available: `service-fire-detection, service-fire-suppression, service-cctv, service-access-control,
service-engineering, sector-server-rack, sector-switchgear, sector-warehouse, sector-factory,
sector-control-room, sector-healthcare, sector-power-grid, sector-radio-tower, severity-urgent`.
Mapping: Fire Detection→service-fire-detection · Gas Suppression→service-fire-suppression ·
PA/PE→service-fire-detection · Signage→service-engineering · Fire Doors→service-engineering ·
CCTV→service-cctv · Intrusion→service-cctv · Access Control→service-access-control ·
Integrated Security→service-cctv · Ironmongery→service-engineering · Compliance→service-engineering ·
Emergency→severity-urgent. Sectors: Data Centres→sector-server-rack · Electrical Rooms→sector-switchgear ·
Warehousing→sector-warehouse · Industrial→sector-factory · Control Rooms→sector-control-room ·
Healthcare→sector-healthcare.

## 7. Verified SANS per discipline (use these — do not invent)

Fire Detection: SANS 10139 (+322 hospitals, +246 electronic equipment, +54/EN54 components).
Suppression: SANS 14520 (+15779 aerosol, +13565 foam, +306-4 CO₂, +10108 hazardous locations).
Fire Doors/Ironmongery: SANS 1253, SANS 10400-T, SANS 51155 (EN 1155).
Signage: SANS 1186-1/-3/-5, SANS 10400-T. Emergency lighting: SANS 10114-2.
PA/Voice Evac: SANS 60849, SANS 54-16, SANS 54-24.
Access Control: SANS 60839-11-1. CCTV: SANS 62676. Intrusion: SANS 50131.
Integration: SANS 10400-T, SANS 10142-1, SANS 10198 (cabling), SANS 10147 (HVAC).

## 8. Mock proof policy

Case studies are **representative/mock** until replaced with real proof. `CaseStudyCard` already
renders a "Representative example…" disclaimer — keep it. Never imply a named real client. Keep all
technical claims defensible.

## 9. Analytics events

Use these exact names (`src/data/forms.ts` `ANALYTICS_EVENTS`): `phone_click`, `form_start`,
`form_submit`, `portal_click`, `emergency_click`, `download_click`. Phone links must be
`tel:+27615458830`. Plausible is loaded on public pages; fire events via
`window.plausible?.(name)` inside a nonce'd script.

## 10. Hard rules (security/design — non-negotiable)

- Inline `<script>` must use `nonce={Astro.locals.nonce}`. No `innerHTML`/`set:html` with dynamic data.
- No emojis in UI — SVG icons only. Palette: kharon-* tokens only. Min tap target 44×44px.
- Contact email is `admin@kharon.co.za`. Site/portal URLs stay tequit (primary until cutover).
- Do NOT edit `src/data/site.ts` nav arrays (already done), other agents' files, configs, or run git/build.
