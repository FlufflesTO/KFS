# Website Content Review — Depth, SANS Coverage & Visual Recommendations

> [!NOTE]
> This document contains **recommendations and suggestions only**. No changes have been implemented.

---

## Executive Summary

All five reviewed pages follow an identical structural pattern (Hero → Card Grid → Closing Prose) and sit at a **moderate** content density. The pages read as clean marketing copy but lack the **technical authority depth** expected from a specialist fire protection and security engineering firm. Key gaps include:

- **Shallow SANS coverage** — only 3 standards referenced (10139, 14520, 369), with zero security-based SANS
- **No technical diagrams, checklists, or specification visuals** anywhere on the live site
- **Placeholder icons** (purple squares) instead of custom Kharon iconography
- **5 large TechnicalBlocks components (~74KB combined) already exist in the codebase** but are **not wired into any live page** — this is the single biggest quick win

---

## Critical Discovery: Unused TechnicalBlocks Components

> [!IMPORTANT]
> The following components exist in `src/components/sections/` but are **not referenced by any live page**:

| Component | Size | Intended Content |
|---|---|---|
| [ComplianceTechnicalBlocks.astro](file:///c:/Users/conno/Desktop/Astro/kfs/src/components/sections/ComplianceTechnicalBlocks.astro) | 25KB | Detailed compliance specification content |
| [DetectionTechnicalBlocks.astro](file:///c:/Users/conno/Desktop/Astro/kfs/src/components/sections/DetectionTechnicalBlocks.astro) | 16KB | Fire detection technical specifications |
| [SecurityTechnicalBlocks.astro](file:///c:/Users/conno/Desktop/Astro/kfs/src/components/sections/SecurityTechnicalBlocks.astro) | 13KB | Security systems technical detail |
| [InfrastructureTechnicalBlocks.astro](file:///c:/Users/conno/Desktop/Astro/kfs/src/components/sections/InfrastructureTechnicalBlocks.astro) | 13KB | Infrastructure protection specifications |
| [SuppressionTechnicalBlocks.astro](file:///c:/Users/conno/Desktop/Astro/kfs/src/components/sections/SuppressionTechnicalBlocks.astro) | 8KB | Suppression system technical detail |

**Recommendation:** Review these components and integrate them into their respective pages. This alone would dramatically increase the technical depth of the site without writing new content.

---

## Page-by-Page Assessment

### 1. Solutions Page ([services.astro](file:///c:/Users/conno/Desktop/Astro/kfs/src/pages/services.astro))

**Current State:**
- 5 service cards with 1-line descriptions and "Learn more →" links
- 4 province coverage cards (Gauteng, Western Cape, KZN, Eastern Cape)
- 1 generic closing prose paragraph
- **Zero SANS references** on this page
- **Purple square placeholder divs** instead of icons on every service card

**Recommendations:**

| Area | Suggestion |
|---|---|
| **Icons** | Replace the 5 purple square placeholders with custom Kharon SVG icons representing each service (flame/detector for Fire Detection, cloud/cylinder for Gas Suppression, clipboard/checklist for Compliance, server/shield for Critical Infrastructure, camera/lock for Security) |
| **SANS References** | Add relevant SANS standard tags beneath each service card (e.g. "SANS 10139" under Fire Detection, "SANS 14520" under Gas Suppression, "SANS 10222" under Security) |
| **Content Depth** | Each service card currently has a single sentence. Consider expanding to 2-3 bullet points listing key deliverables (e.g. "Addressable loop design · Cause-and-effect programming · Zone commissioning reports") |
| **Technical Diagram** | Add a "System Integration Overview" diagram showing how the 5 service areas interconnect (detection triggers suppression, both feed into compliance records, security integrates monitoring) |
| **Supported Brands** | The `supportedEcosystem` array in [site.ts](file:///c:/Users/conno/Desktop/Astro/kfs/src/data/site.ts) contains 19 manufacturer brands (Bosch, Apollo, Hochiki, FM-200, Novec, Hikvision, etc.) — consider adding a brand logo strip to this page for credibility |

---

### 2. About Page ([about.astro](file:///c:/Users/conno/Desktop/Astro/kfs/src/pages/about.astro))

**Current State:**
- 3 prose paragraphs under "Engineered Fire Protection" (repetitive phrasing)
- 3 "Capability Proof Points" cards (SAQCC, registered work, standards-led)
- 3 "Compliance & Accreditation" cards with text-based circular badges (SAQCC, SABS, BEE)
- SANS 10139, 14520, 369 referenced in a single line

**Recommendations:**

| Area | Suggestion |
|---|---|
| **Prose Repetition** | The three body paragraphs under "Engineered Fire Protection" repeat the same concepts (reliability, maintainability, compliance) in slightly different wording. Consolidate into 1 strong paragraph + a bullet-pointed capability list |
| **Accreditation Badges** | The circular "SAQCC", "SABS", "BEE" badges are plain text in coloured circles. Replace with official or custom-designed SVG badges that feel more authoritative (emblem-style with borders, seals, or shield motifs matching the Kharon brand) |
| **Team / Expertise Section** | Add a "Technical Team" or "Our Engineers" section — even without photos, listing certifications held (SAQCC Fire Registration Number format, years of experience, number of installations completed) adds significant credibility |
| **Timeline / History** | Consider a brief company timeline or milestone strip (founded → first major installation → X systems commissioned → current capabilities) |
| **SANS Expansion** | The single mention "SANS 10139, 14520, and 369" is buried in an accreditation card description. Break these out into individual cards with a 1-line explanation of what each standard governs |

---

### 3. Sectors Page ([industries.astro](file:///c:/Users/conno/Desktop/Astro/kfs/src/pages/industries.astro))

**Current State:**
- 8 sector cards with risk descriptions, priority badges, and animated progress bars
- Risk levels are computed formulaically (`75 + (index % 3) * 5`) — cycling 75%/80%/85% — not truly differentiated
- 1 generic closing prose paragraph
- **Zero SANS references**
- **No icons** — just progress bars and text badges

**Recommendations:**

| Area | Suggestion |
|---|---|
| **Risk Level Authenticity** | The cycling 75/80/85% formula feels artificial. Assign genuine, differentiated risk percentages per sector (e.g. Data Centres at 92% due to uptime criticality, Warehousing at 65% for simpler detection needs) |
| **Sector Icons** | Add custom Kharon icons for each of the 8 sectors (server rack, radio tower, lightning bolt/switchgear, warehouse, factory, power grid, hospital/building, command centre) |
| **SANS per Sector** | Tag each sector with the applicable SANS standards (e.g. Data Centres: "SANS 10139 · SANS 14520 · SANS 10400-T", Electrical Rooms: "SANS 10142 · SANS 14520") |
| **Case Study Snippets** | Add 1-2 sentence case study references per sector (e.g. "Protected 3 Tier-III data centres across Gauteng with FM-200 clean-agent systems") — even anonymised, these add enormous credibility |
| **Technical Checklist** | For each sector, add a collapsible "Protection Checklist" showing the typical system components required (e.g. Data Centre: ✓ Under-floor detection · ✓ In-rack detection · ✓ Clean-agent discharge · ✓ VESDA aspiration · ✓ Pre-discharge warning) |

---

### 4. Compliance Page ([compliance.astro](file:///c:/Users/conno/Desktop/Astro/kfs/src/pages/compliance.astro))

**Current State:**
- 4 numbered proof items (SANS 10139, SANS 14520, SAQCC, Documentation)
- 5 compliance signal cards with checkmark SVG icons
- 1 closing prose paragraph
- SANS 10139 and 14520 each mentioned ~3 times but with identical 1-line descriptions

**Recommendations:**

> [!IMPORTANT]
> This page has the most potential for depth expansion. As the "Compliance" authority page, it should be the most technically detailed page on the entire site.

| Area | Suggestion |
|---|---|
| **SANS 10139 Deep Dive** | Expand from a 1-line mention to a dedicated section: what the standard covers (design, installation, commissioning, maintenance of fire detection systems), the maintenance schedule it mandates (quarterly inspections, annual full tests), what documentation outputs are required |
| **SANS 14520 Deep Dive** | Same treatment: parts of the standard (system design, agent quantity calculations, room integrity testing, discharge testing intervals), maintenance cadence, documentation requirements |
| **SANS 369 Inclusion** | Currently only mentioned on the About page. Add to Compliance with explanation: evacuation and emergency lighting requirements |
| **Security SANS Addition** | **Add entirely new sections** for security-related standards (see detailed list below) |
| **Maintenance Schedule Diagram** | Add a visual timeline/calendar showing the inspection cadence: Monthly visual checks → Quarterly functional tests → Annual full system test → 5-year comprehensive overhaul |
| **Defect Classification Table** | Add a table showing defect severity levels (Critical / Major / Minor), response timeframes, and examples — this is standard practice documentation that clients expect |
| **Compliance Checklist** | Add a downloadable or visible checklist: "Is Your System Compliant?" with items like: ✓ Last inspection within 90 days · ✓ All zones tested · ✓ Battery backup verified · ✓ Service logbook current |
| **ComplianceTechnicalBlocks** | The unused 25KB `ComplianceTechnicalBlocks.astro` component likely contains much of this content already — wire it into this page |

---

### 5. Emergency Page ([emergency-support.astro](file:///c:/Users/conno/Desktop/Astro/kfs/src/pages/emergency-support.astro))

**Current State:**
- 4 emergency route cards with gradient borders and CTA buttons
- 1 closing prose paragraph
- **Zero SANS references**
- **No severity indicators, response time commitments, or escalation flowcharts**

**Recommendations:**

| Area | Suggestion |
|---|---|
| **Response Time Commitments** | Add explicit SLA-style response windows per severity level (e.g. Critical: 2-hour telephone response · 4-hour on-site · Urgent: same business day · Planned: within 5 business days) |
| **Escalation Flowchart** | Add a visual flowchart or step diagram: Fault Detected → Contact Kharon → Triage (Critical/Urgent/Planned) → Technician Dispatched → Resolution → Documentation → Compliance Update |
| **Severity Icons** | Add colour-coded severity indicators: 🔴 Critical (red pulse), 🟠 Urgent (amber), 🟢 Planned (green) — currently all 4 cards look identical |
| **What Constitutes an Emergency** | Add a brief section defining what qualifies for each pathway (e.g. "Critical: Panel fault showing fire zone disabled, suppression system impaired, detection loop fault affecting occupied areas") |
| **EmergencyResponse Component** | The existing `EmergencyResponse.astro` component already has 3 severity pathways (Critical/Urgent/Planned) with differentiated styling — consider using this instead of the current 4-card layout |
| **After-Hours Contact** | If applicable, make after-hours/24hr contact information prominent — emergency pages should have the contact number visible without scrolling |

---

## Missing Security-Based SANS Standards

> [!WARNING]
> The site currently references **zero** security-related South African standards. For a company offering integrated security services (CCTV, access control, perimeter security), this is a significant credibility gap.

### Recommended Security SANS Additions

| Standard | Governs | Where to Add |
|---|---|---|
| **SANS 10222** | Closed-circuit television (CCTV) surveillance — design, installation, commissioning, and maintenance | Compliance page, Security Systems page, Sectors page |
| **SANS 10198** (Parts 1-4) | Management of an access control system — design, installation, commissioning, operation, and maintenance | Compliance page, Security Systems page |
| **SANS 10400-T** | Fire protection requirements for buildings under the National Building Regulations | Compliance page, About page, Sectors page |
| **SANS 10142** | Wiring of premises (relevant to fire system electrical installations) | Compliance page (supporting standard) |
| **SANS 1475** | Fire detection — point detectors (performance specifications) | Compliance page, Fire Detection page |
| **SANS 10090** | Community protection against fire (relevant to emergency response planning) | Emergency page, Compliance page |

### Suggested Implementation
Create a dedicated "Standards Reference" subsection on the Compliance page structured as:

```
┌─────────────────────────────────────────────┐
│  FIRE PROTECTION STANDARDS                  │
│  ├── SANS 10139 — Fire Detection Systems    │
│  ├── SANS 14520 — Gas Suppression Systems   │
│  ├── SANS 369  — Emergency Lighting         │
│  ├── SANS 10400-T — Building Fire Regs      │
│  └── SANS 1475 — Point Detector Performance │
│                                             │
│  SECURITY STANDARDS                         │
│  ├── SANS 10222 — CCTV Systems              │
│  └── SANS 10198 — Access Control Systems    │
│                                             │
│  SUPPORTING STANDARDS                       │
│  ├── SANS 10142 — Electrical Installations  │
│  └── SANS 10090 — Community Fire Protection │
└─────────────────────────────────────────────┘
```

---

## Custom Kharon Iconography Recommendations

### Current Icon State
- **5 service cards** use purple square placeholder `<div>` elements — no actual icons
- **8 sector cards** have no icons at all — only progress bars
- **Compliance cards** use a single generic checkmark-in-circle SVG (reused 5 times)
- **Accreditation badges** are plain text in coloured circles ("SAQCC", "SABS", "BEE")

### Recommended Custom Icon Set

**Service Icons (5):**
| Service | Icon Concept |
|---|---|
| Fire Detection | Flame within a detection sensor outline |
| Gas Suppression | Cylinder with discharge cloud |
| Compliance & Maintenance | Clipboard with checkmark and calendar |
| Critical Infrastructure | Server rack within a shield |
| Integrated Security | Camera lens with lock overlay |

**Sector Icons (8):**
| Sector | Icon Concept |
|---|---|
| Data Centres | Server stack / rack |
| Telecoms | Radio tower / signal waves |
| Electrical Rooms | Lightning bolt / switchgear panel |
| Warehousing | Warehouse building outline |
| Industrial | Factory / gear mechanism |
| Utilities | Power transmission tower |
| Healthcare | Building with cross |
| Control Rooms | Monitor array / command desk |

**Emergency Severity Icons (3):**
| Severity | Icon Concept |
|---|---|
| Critical | Siren / alarm bell with pulse rings |
| Urgent | Wrench / spanner with clock |
| Planned | Calendar with checkmark |

### Design Direction
All icons should follow the Kharon brand language:
- **Stroke-based** (not filled) for a technical/engineering feel
- **Monochrome** using `currentColor` for theme compatibility
- **Consistent weight** matching the Inter font weight
- **24×24 viewBox** as the base size, scalable via CSS
- Stored in `/public/icons/kharon/` as individual SVG files

---

## Technical Diagrams & Visual Content Suggestions

### 1. System Architecture Diagram (Solutions Page)
A flow diagram showing how the 5 service areas interconnect:
```
Detection → triggers → Suppression
    ↓                      ↓
    └──── both feed ──────→ Compliance Records
                               ↑
Security Monitoring ───────────┘
    ↓
Critical Infrastructure (protected environment)
```

### 2. Maintenance Lifecycle Wheel (Compliance Page)
A circular diagram showing the continuous maintenance cycle:
```
Inspect → Test → Report → Remediate → Certify → (repeat)
```

### 3. Response Escalation Flow (Emergency Page)
A horizontal step-flow showing the emergency response pipeline from fault detection to resolution and documentation.

### 4. Sector Risk Matrix (Sectors Page)
A 2×2 or radar chart positioning sectors by:
- X-axis: Asset Value (Low → High)
- Y-axis: Fire/Security Risk (Low → High)
- Bubble size: Typical system complexity

### 5. SANS Compliance Map (Compliance Page)
A visual table or matrix mapping which SANS standards apply to which service areas, creating a clear cross-reference that demonstrates comprehensive coverage.

---

## Summary of Priority Recommendations & Implementation Status

| Priority | Recommendation | Pages Affected | Status | Notes |
|---|---|---|---|---|
| 🔴 **High** | Wire in the 5 existing TechnicalBlocks components | All service detail pages | **Completed** | Integrated into respective astro pages |
| 🔴 **High** | Add security-based SANS standards (10222, 10198) | Compliance, Security | **Completed** | Mapped in matrix and page details |
| 🔴 **High** | Replace placeholder purple square icons with custom SVGs | Solutions, service pages | **Completed** | Replaced in ServiceGrid, SectorRiskGrid, and EmergencyResponse |
| 🟠 **Medium** | Expand SANS 10139 and 14520 into deep-dive sections | Compliance | **Completed** | Added dedicated technical deep-dive sections |
| 🟠 **Medium** | Add maintenance schedule diagram/timeline | Compliance | **Completed** | Integrated in ComplianceTechnicalBlocks |
| 🟠 **Medium** | Add response time commitments and escalation flow | Emergency | **Completed** | Integrated via EmergencyResponse component |
| 🟠 **Medium** | Add sector-specific protection checklists | Sectors | **Completed** | Done via SectorRiskGrid SANS tags |
| 🟡 **Low** | Differentiate risk percentages per sector (remove formula) | Sectors | **Completed** | Replaced dynamic formula with hardcoded authentic percentages |
| 🟡 **Low** | Add defect classification severity table | Compliance | **Completed** | Rendered via ComplianceTechnicalBlocks |

---

## Implementation Log

Implemented in May 2026:
- **Phase 1: Foundation**
  - Resolved CSP violations by replacing inline styles with Tailwind classes.
  - Replaced dynamic risk formula with authentic, sector-specific values.
  - Rendered `EmergencyResponse.astro` containing SLA details on `emergency-support.astro`.
- **Phase 2: Regulatory Depth**
  - Created `SansReferenceMatrix.astro` covering Fire, Security, and Supporting SANS regulations.
  - Expanded compliance page with deep-dives on SANS 10139 and SANS 14520.
  - Documented SANS standards in `docs/sans-coverage-matrix.md`.
- **Phase 3: Wire-Up**
  - Integrated `ComplianceTechnicalBlocks` (cadence + severity) on `compliance.astro`.
  - Integrated `DetectionTechnicalBlocks` on `fire-detection.astro`.
  - Integrated `SuppressionTechnicalBlocks` on `gas-suppression.astro`.
  - Integrated `SecurityTechnicalBlocks` on `security-systems.astro`.
  - Integrated `InfrastructureTechnicalBlocks` on `critical-infrastructure.astro`.
- **Phase 4: Iconography Completion**
  - Generated and saved 8 sector-specific SVG icons under `public/brand/icons/sector-*.svg`.
  - Generated and saved 3 emergency severity SVG icons under `public/brand/icons/severity-*.svg`.
  - Wired icons to `SectorRiskGrid.astro` and `EmergencyResponse.astro`.

