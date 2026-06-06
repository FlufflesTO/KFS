# Phases 7, 14 & 15 - Design and Implementation Plan

## Executive Summary

These three phases work together to transform the public website from a **competent QA site** into an **authority-positioned production website**:

| Phase | Focus | Outcome |
|-------|-------|---------|
| **7** | Approved project evidence | Real proof replaces schematic placeholders |
| **14** | Page differentiation | Each service page has unique technical proof |
| **15** | Compliance hub | SANS summaries, checklists, certificate guidance |

**Combined timeline:** 3-4 weeks implementation  
**Risk level:** Low (content-heavy, no schema changes)  
**Production impact:** High (SEO, authority, conversion)

---

## Phase 7 - Public Authority Proof

### Goals

Replace abstract authority signals with **approved, publishable evidence** that demonstrates real operational competence without making unapproved client or vendor claims.

### Deliverables

#### 7.1 - Case Study Framework (2-4 examples)

**Structure for each case study:**
```markdown
## [Industry/Sector] - [System Type]

**Context:**
- Sector: Commercial/Industrial/Critical Infrastructure
- Location: [City/Region - no specific address unless approved]
- System scope: Fire Detection / Gas Suppression / Integrated

**Challenge:**
[2-3 sentences on the operational problem]

**System Scope:**
- Detection: [type, zoning approach]
- Suppression: [agent type, cylinder configuration]
- Integration: [cause-and-effect, panel logic]

**Operational Outcome:**
[2-3 sentences on measurable result - uptime preserved, compliance achieved, risk reduced]

**Evidence Available:**
- [ ] Service report example (anonymised)
- [ ] System photograph (approved)
- [ ] Technical diagram
- [ ] Testimonial (if client approved)
```

**Content to collect from director:**
1. Which 2-4 projects can be published?
2. What client names/sectors are approved for mention?
3. Are system photographs approved for each?
4. Any vendor partnership claims that are approved vs. avoided?

#### 7.2 - Approved Industrial Photography

**Assetæ¸…å•:**
- [ ] Gas suppression cylinder bank (1-2 images)
- [ ] Fire detection control panel (1-2 images)
- [ ] Detector/installation close-up (1-2 images)
- [ ] Control room or infrastructure environment (1-2 images)
- [ ] Technician at work with equipment (1 image, optional)

**Image treatment:**
- Apply existing CSS filters: `contrast(1.05) brightness(0.95) saturate(0.9)`
- Generate responsive sizes via Astro Image
- Store in `src/assets/approved-photos/`

#### 7.3 - Anonymised Document Examples

**Documents to create:**
1. **Sample Jobcard** - redacted template showing structure
2. **Service Report Example** - filled with fake site data
3. **Defect Register Extract** - showing severity classification
4. **Certificate of Compliance** - blank template with Kharon branding

**Storage:** `public/documents/examples/` (PDF format)

### Implementation Tasks

```
[ ] 7.1.1 - Create CaseStudy.astro component
[ ] 7.1.2 - Add /case-studies index page
[ ] 7.1.3 - Write 2-4 case study content files
[ ] 7.1.4 - Link case studies from relevant service pages
[ ] 7.2.1 - Collect and optimize approved photos
[ ] 7.2.2 - Replace schematic placeholders where photos are stronger
[ ] 7.3.1 - Design document templates in Figma/Canva
[ ] 7.3.2 - Generate PDFs with verified Kharon branding
[ ] 7.3.3 - Add document download links to compliance page
```

### Deployable Gate

- [ ] No unapproved client names appear
- [ ] No vendor partnership claims without approval
- [ ] At least 2 case studies published
- [ ] At least 3 approved photos integrated
- [ ] At least 2 document examples available
- [ ] `npm run build` and `npm run audit:site` pass

---

## Phase 14 - Public Page Differentiation

### Goals

Eliminate "templated" feel by giving each major service page **unique proof blocks, technical diagrams, and evidence sections** that could only belong to that specific service.

### Page-by-Page Plan

### 14.1 - Gas Suppression Page Enhancements

**Unique content blocks to add:**

#### A. Protected Room Readiness Checklist
```markdown
**Room Integrity Prerequisites:**
- [ ] Room boundaries sealed (walls, floor, ceiling)
- [ ] Door closure verified (self-closing, gasketed)
- [ ] Penetrations identified (cables, ducts, pipes)
- [ ] Hold-time test scheduled
- [ ] Ventilation isolation confirmed
- [ ] Occupant safety briefing planned
```

#### B. Agent Selection Matrix
| Factor | FM-200 | Inergen | Novec 1230 | COâ‚‚ |
|--------|--------|---------|------------|-----|
| Occupied spaces | âœ“ | âœ“ | âœ“ | âœ— |
| Environmental impact | Moderate | Low | Low | High |
| Storage pressure | High | Very High | Low | High |
| Cost per kg | Medium | High | Very High | Low |
| Typical use | Server rooms | Large volumes | Sensitive assets | Unoccupied |

#### C. Discharge Sequence Diagram
Create SVG showing:
```
Detection â†’ Alarm Stage 1 â†’ Alarm Stage 2 â†’ Shutdown â†’ Delay â†’ Release â†’ Post-Release Alarm
```

#### D. Pre-Quote Data Capture
```markdown
**Information Required:**
1. Protected room dimensions (LÃ—WÃ—H)
2. Room volume (mÂ³)
3. Door/window count and sizes
4. Existing penetration count
5. Agent type (if replacement)
6. Cylinder location preference
7. Occupancy pattern
```

**New component:** `SuppressionTechnicalBlocks.astro`

### 14.2 - Fire Detection Page Enhancements

**Unique content blocks to add:**

#### A. Cause-and-Effect Explanation
```markdown
**Typical Cause-and-Effect Matrix:**

| Event | Zone A Alarm | Zone B Alarm | Manual Call Point | Gas Release Area |
|-------|--------------|-------------|-------------------|------------------|
| First detector | Alert panel | Alert panel | Alert panel | Abort release |
| Second detector | Evacuate zone | Evacuate zone | Evacuate all | Initiate delay |
| Manual call point | Evacuate zone | Evacuate zone | Evacuate all | Abort release |
| Gas release confirmed | Alert only | Alert only | Alert only | Evacuate area |
```

#### B. False Alarm Diagnosis Flow
Create SVG flowchart:
```
False Alarm Reported
  â†“
Environmental check (dust, steam, airflow)
  â†“
Device inspection (damage, contamination)
  â†“
Wiring test (earth fault, insulation)
  â†“
Panel configuration review
  â†“
Root cause identified â†’ Remediation
```

#### C. Service Evidence Examples
```markdown
**What a Proper Service Includes:**
- [ ] Panel function test (indicators, sounds)
- [ ] Battery voltage/load test
- [ ] Earth fault measurement
- [ ] Sample detector test (2 per zone minimum)
- [ ] MCP function check (rotating sample)
- [ ] Sounder/strobe operation verified
- [ ] Printer/history log reviewed
- [ ] Cause-and-effect verified (if modified)
```

#### D. Zoning Strategy Guide
```markdown
**Zone Boundaries Should Reflect:**
- Physical fire compartments
- Evacuation route grouping
- Plant room isolation
- After-hours occupancy patterns
- False alarm source separation
```

**New component:** `DetectionTechnicalBlocks.astro`

### 14.3 - Compliance & Maintenance Page Enhancements

**Unique content blocks to add:**

#### A. Maintenance Cadence Table
| System Type | Monthly | Quarterly | 6-Monthly | Annual |
|-------------|---------|-----------|-----------|--------|
| Fire Detection | Visual panel check | - | Full inspection | Full service + test |
| Gas Suppression | Pressure check | - | Full inspection | Full service + test |
| Emergency Lighting | Function test | - | - | Full duration test |
| Fire Extinguishers | Visual check | - | Basic service | Extended service |

*Note: Final intervals depend on system, site, insurer and applicable standards*

#### B. Defect Severity Classification
```markdown
**Category 1 - Critical (Immediate Action)**
- System inoperative
- False alarm risk high
- Suppression unavailable
- Regulatory breach

**Category 2 - Significant (7-Day Action)**
- Partial system impairment
- Recurring fault pattern
- Documentation gap
- Single detector fault

**Category 3 - Minor (Scheduled Action)**
- Cosmetic damage
- Label missing
- Single non-critical fault
- Housekeeping issue
```

#### C. Certificate Readiness Logic
Create flowchart:
```
Service Completed
  â†“
Any Category 1 defects?
  â”œâ”€ Yes â†’ Certificate BLOCKED until rectified
  â””â”€ No â†’ Continue
        â†“
Any Category 2 defects?
  â”œâ”€ Yes â†’ Certificate ISSUED with defect advisory
  â””â”€ No â†’ Certificate ISSUED clear
```

#### D. Sample Service Report Structure
```markdown
**Service Report Contains:**
1. Site information and system details
2. Service scope and standards referenced
3. Visual inspection findings
4. Functional test results (device-by-device)
5. Fault/defect register with severity
6. Recommendations and required actions
7. Technician sign-off and date
8. Client acknowledgment
```

**New component:** `ComplianceTechnicalBlocks.astro`

### 14.4 - Critical Infrastructure Page Enhancements

**Unique content blocks to add:**

#### A. Uptime Impact Model
```markdown
**Fire Event Consequence Hierarchy:**

| Outcome | Financial Impact | Operational Impact | Reputation Impact |
|---------|-----------------|-------------------|-------------------|
| System failure to detect | Catastrophic | Site loss | Brand damage |
| False alarm discharge | High (cleanup) | 24-48hr downtime | Client confidence |
| Planned maintenance window | Minimal | Scheduled | Demonstrates diligence |
| Audit finding resolved | Cost avoided | None | Compliance preserved |
```

#### B. Escalation and Response Dependency Map
Create SVG showing:
```
Site Alarm â†’ On-Site Response â†’ Remote Monitoring â†’ Technician Dispatch â†’ Specialist Engineer â†’ OEM Support
```

#### C. Site Risk-Tier Matrix
| Tier | Description | Response SLA | Inspection Frequency |
|------|-------------|--------------|---------------------|
| Tier 1 | 24/7 critical, no downtime | 2hr emergency | Quarterly |
| Tier 2 | Business critical, limited window | 4hr emergency | 6-monthly |
| Tier 3 | Important, scheduled access | Next business day | Annual |

**New component:** `InfrastructureTechnicalBlocks.astro`

### 14.5 - Security Systems Page Enhancements

**Unique content blocks to add:**

#### A. Access Control Tiers
```markdown
**Access Strategy Levels:**

**Level 1 - Basic:**
- Card-only entry
- Exit request-to-exit
- Audit trail

**Level 2 - Enhanced:**
- Card + PIN
- Anti-passback
- Time-zone restrictions
- Door forced alarm

**Level 3 - High Security:**
- Multi-factor (card + biometric)
- Interlocking doors (mantrap)
- Visitor management integration
- lockdown capability
```

#### B. CCTV Coverage Planning
```markdown
**Camera Placement Logic:**
- Entry/exit points (face capture)
- Asset protection zones
- Corridor choke points
- Perimeter monitoring
- Integration with access events
```

#### C. Integration Points Diagram
Show how security supports fire/gas:
```
Access Control â†’ Fire Alarm Interface
  - Unlock doors on alarm
  - Lock down on gas discharge
  - Prevent re-entry until reset

CCTV â†’ Alarm Verification
  - Visual confirm before dispatch
  - Post-incident review
  - False alarm evidence
```

**New component:** `SecurityTechnicalBlocks.astro`

### Implementation Tasks

```
[ ] 14.1.1 - Create SuppressionTechnicalBlocks.astro
[ ] 14.1.2 - Add protected room checklist to gas-suppression.astro
[ ] 14.1.3 - Add agent selection matrix
[ ] 14.1.4 - Create discharge sequence SVG
[ ] 14.1.5 - Add pre-quote data capture section
[ ] 14.2.1 - Create DetectionTechnicalBlocks.astro
[ ] 14.2.2 - Add cause-and-effect matrix
[ ] 14.2.3 - Create false alarm diagnosis SVG
[ ] 14.2.4 - Add service evidence section
[ ] 14.2.5 - Add zoning strategy guide
[ ] 14.3.1 - Create ComplianceTechnicalBlocks.astro
[ ] 14.3.2 - Add maintenance cadence table
[ ] 14.3.3 - Add defect severity classification
[ ] 14.3.4 - Create certificate readiness flowchart
[ ] 14.3.5 - Add sample report structure
[ ] 14.4.1 - Create InfrastructureTechnicalBlocks.astro
[ ] 14.4.2 - Add uptime impact model
[ ] 14.4.3 - Create escalation diagram
[ ] 14.4.4 - Add risk-tier matrix
[ ] 14.5.1 - Create SecurityTechnicalBlocks.astro
[ ] 14.5.2 - Add access control tiers
[ ] 14.5.3 - Add CCTV coverage logic
[ ] 14.5.4 - Create integration diagram
[ ] 14.6.1 - Replace generic ProofGrid items with page-specific proof
[ ] 14.6.2 - Update ProofGrid.astro to support varied content density
```

### Deployable Gate

- [ ] Gas Suppression page has unique checklist, matrix, diagram, data capture
- [ ] Fire Detection page has unique matrix, flowchart, evidence, zoning guide
- [ ] Compliance page has unique cadence, defect classes, certificate logic
- [ ] Critical Infrastructure page has unique impact model, escalation, risk tiers
- [ ] Security Systems page has unique tiers, coverage logic, integration diagram
- [ ] No two pages use identical proof-card copy
- [ ] Each page has at least one unique SVG diagram
- [ ] `npm run build` and `npm run audit:site` pass

---

## Phase 15 - Compliance Hub and SANS Operationalisation

### Goals

Transform compliance from a **service page** into a **practical resource hub** that educates visitors, supports SEO, and establishes Kharon as a compliance-first authority.

### Information Architecture

```
/compliance (hub page)
  â”œâ”€â”€ /compliance/sans-10139 (fire detection summary)
  â”œâ”€â”€ /compliance/sans-14520 (gas suppression summary)
  â”œâ”€â”€ /compliance/checklists
  â”‚     â”œâ”€â”€ fire-detection-service-checklist
  â”‚     â””â”€â”€ gas-suppression-service-checklist
  â”œâ”€â”€ /compliance/defects
  â”‚     â””â”€â”€ defect-examples-and-certificates
  â”œâ”€â”€ /compliance/maintenance-cadence
  â””â”€â”€ /compliance/downloads (PDF versions)
```

### 15.1 - Compliance Hub Page

**Location:** `/compliance` (new page)

**Content structure:**
```markdown
# Compliance Resources for Fire Protection Systems

**Purpose:**
Practical guidance for responsible persons, facility managers and operators managing fire detection and gas suppression systems.

**Available Resources:**

## Standards Summaries
- SANS 10139 (Fire Detection)
- SANS 14520 (Gaseous Suppression)

## Service Checklists
- Fire Detection Service Checklist
- Gas Suppression Service Checklist

## Defect and Certificate Guidance
- Understanding Defect Categories
- Certificate Readiness Logic

## Maintenance Cadence
- Inspection Frequency Guide
- Lifecycle Planning

## Downloads
- PDF versions of all resources
```

**New component:** `ComplianceHub.astro`

### 15.2 - SANS 10139 Practical Summary

**Location:** `/compliance/sans-10139`

**Content approach:**
- Summary-level only (no copyrighted text reproduction)
- Practical interpretation for operators
- Focus on "what this means for your site"
- Link to official standards purchase

**Key sections:**
```markdown
## What SANS 10139 Covers

**Scope:**
Design, installation, commissioning, inspection and maintenance of fire detection and alarm systems.

**Who It Applies To:**
- Responsible persons for commercial/industrial buildings
- System designers and installers
- Maintenance providers
- Insurance and regulatory inspectors

**Key Requirements (Operator Summary):**

### Design and Installation
- Systems must be designed by competent persons
- Zoning should reflect fire compartments and evacuation
- Control equipment must be accessible and labelled
- Cause-and-effect matrix must be documented

### Commissioning
- Full functional testing before handover
- As-built documentation required
- User training must be provided
- Certificate of conformity issued

### Inspection and Maintenance
- Monthly visual checks by responsible person
- Quarterly intermediate inspection (competent person)
- Annual full service and test
- Records retained for audit/insurance

### Documentation
- Logbook maintained on-site
- Certificates retained
- Cause-and-effect matrix updated
- Defect records with remediation tracking
```

**New component:** `Sans10139Summary.astro`

### 15.3 - SANS 14520 Practical Summary

**Location:** `/compliance/sans-14520`

**Content approach:**
- Same summary-level treatment
- Focus on gas suppression specifics
- Room integrity and safety emphasis

**Key sections:**
```markdown
## What SANS 14520 Covers

**Scope:**
Design, installation, testing, commissioning, inspection and maintenance of gaseous fire suppression systems.

**System Types Covered:**
- Inert gas systems (IG-01, IG-55, IG-541)
- Fluoroketone systems (FK-5-1-12 / Novec 1230)
- HFC systems (HFC-227ea / FM-200)
- COâ‚‚ systems (special application)

**Key Requirements (Operator Summary):**

### Design Considerations
- Protected volume accurately calculated
- Room integrity (hold time) verified
- Agent quantity based on hazard class
- Nozzle placement for even distribution
- Safety signage and warnings

### Safety Requirements
- Pre-discharge alarm mandatory
- Abort station required
- Post-discharge ventilation
- Occupant evacuation procedure
- Manual release protection

### Installation and Commissioning
- Cylinder pressure verified
- Piping pressure tested
- Nozzle blow-off test
- Detection integration verified
- Full functional discharge test (if applicable)

### Inspection and Maintenance
- Monthly pressure checks
- 6-monthly full inspection
- Annual full service and test
- Room integrity re-test every 2 years
- Hydrostatic test per cylinder standard
```

**New component:** `Sans14520Summary.astro`

### 15.4 - Service Checklists

**Locations:**
- `/compliance/checklists/fire-detection-service-checklist`
- `/compliance/checklists/gas-suppression-service-checklist`

**Format:** Interactive checklist with printable version

**Fire Detection Checklist Content:**
```markdown
## Fire Detection Service Checklist

**Pre-Service:**
- [ ] Logbook reviewed for previous defects
- [ ] Panel history printed/reviewed
- [ ] Site-specific risks briefed

**Panel Inspection:**
- [ ] Panel clean and undamaged
- [ ] All indicators functional
- [ ] Display working (if applicable)
- [ ] Printer paper adequate
- [ ] Keys/special tools available

**Electrical Tests:**
- [ ] Mains voltage confirmed
- [ ] Battery voltage measured
- [ ] Battery load test passed
- [ ] Earth fault measurement taken
- [ ] Charger function verified

**Device Testing (Rotating Sample):**
- [ ] Minimum 2 detectors per zone tested
- [ ] All zones covered over service cycle
- [ ] MCPs tested (rotating sample)
- [ ] Sounders/strobes verified
- [ ] Isolators function checked

**Cause-and-Effect Verification:**
- [ ] Alarm zoning correct
- [ ] Evacuation signals appropriate
- [ ] Plant interfaces tested (if modified)
- [ ] Gas release interface verified (if applicable)

**Post-Service:**
- [ ] Logbook updated
- [ ] Defects recorded with severity
- [ ] Recommendations provided
- [ ] Certificate issued (if no blockers)
- [ ] Client briefed on findings
```

**Gas Suppression Checklist Content:**
```markdown
## Gas Suppression Service Checklist

**Pre-Service:**
- [ ] Logbook reviewed
- [ ] Protected room use unchanged
- [ ] No structural modifications
- [ ] Cylinder access clear

**Cylinder Inspection:**
- [ ] Cylinder secure and labelled
- [ ] Pressure in green zone (or weigh)
- [ ] Hose/pipework undamaged
- [ ] Valves sealed and secured
- [ ] Safety tags current

**Release Panel:**
- [ ] Panel powered and normal
- [ ] Indicators functional
- [ ] Key switch operational
- [ ] Abort function tested
- [ ] Manual release protected

**Detection Integration:**
- [ ] Detection zone normal
- [ ] Cross-zoning verified
- [ ] Pre-discharge alarm tested
- [ ] Delay timer verified
- [ ] Post-discharge alarm tested

**Room Integrity:**
- [ ] Door self-closing verified
- [ ] Seals/gaskets intact
- [ ] Penetrations sealed
- [ ] Ventilation isolation confirmed
- [ ] Hold-time test (if scheduled)

**Safety Systems:**
- [ ] Warning signs present
- [ ] Abort station accessible
- [ ] Post-discharge ventilation ready
- [ ] Occupant briefing current

**Post-Service:**
- [ ] Logbook updated
- [ ] Defects recorded
- [ ] Certificate issued (if clear)
- [ ] Client briefed
```

**New component:** `ServiceChecklist.astro`

### 15.5 - Defect and Certificate Guidance

**Location:** `/compliance/defects`

**Content:**
```markdown
## Understanding Defects and Certificates

### Why Defects Matter

Defects are not just "things to fix" - they are:
- Compliance gaps that may breach regulations
- Insurance validity risks
- Operational continuity threats
- Potential liability exposures

### Defect Categories

**Category 1 - Critical (Immediate Action Required)**
System is inoperative or poses immediate risk:
- Fire panel dead / no power
- Suppression cylinder empty/discharged
- False alarm condition persistent
- Escape route compromised

**Action:** System off-service, immediate rectification, responsible person notified.

**Category 2 - Significant (7-Day Action)**
System impaired but partially functional:
- Zone fault (partial detection loss)
- Recurring false alarm source
- Battery failed load test
- Documentation missing/outdated

**Action:** Certificate issued with defect advisory, quote provided, scheduled rectification.

**Category 3 - Minor (Scheduled Action)**
Non-critical issues:
- Label missing
- Cosmetic damage
- Single detector fault in large zone
- Housekeeping issues

**Action:** Certificate issued clear, defect noted for next service.

### Certificate Logic

```
Service Completed
       â†“
Category 1 defects present?
   â”œâ”€ YES â†’ Certificate BLOCKED
   â”‚        (cannot issue until rectified)
   â””â”€ NO  â†’ Continue
            â†“
   Category 2 defects present?
      â”œâ”€ YES â†’ Certificate ISSUED with Advisory
      â”‚        (client acknowledges defects)
      â””â”€ NO  â†’ Certificate ISSUED Clear
```

### What Blocks a Certificate?

- Category 1 defects uncorrected
- System isolation unapproved
- Access denied for testing
- Critical documentation missing
- Unauthorised modifications found

### Certificate Types

**Certificate of Conformity**
- Issued after new installation commissioning
- Confirms system meets standard at handover

**Certificate of Inspection**
- Issued after periodic service
- Confirms system inspected and tested

**Certificate with Advisory**
- Issued with Category 2 defects noted
- Client acknowledges and accepts risk
- Rectification quote provided

**Interim Certificate**
- Issued pending minor documentation
- Valid for limited period
- Full certificate follows
```

**New component:** `DefectCertificateGuidance.astro`

### 15.6 - Maintenance Cadence Guide

**Location:** `/compliance/maintenance-cadence`

**Content:**
```markdown
## Maintenance Cadence Guide

### Statutory Minimums

These are typical minimum frequencies. Your insurer, site risk assessment or specific standard may require more frequent inspection.

| System | Monthly | Quarterly | 6-Monthly | Annual | Notes |
|--------|---------|-----------|-----------|--------|-------|
| Fire Detection (SANS 10139) | Visual panel check | - | Full inspection | Full service + test | Quarterly recommended for high-risk |
| Gas Suppression (SANS 14520) | Pressure check | - | Full inspection | Full service + test | Room integrity every 2 years |
| Emergency Lighting | Function test | - | - | Full duration test | Monthly flick test |
| Fire Extinguishers | Visual check | - | Basic service | Extended service | 5-year hydrostatic |
| Fire Hose Reels | - | - | - | Annual service | 3-year pressure test |
| Sprinkler Systems | Gauge check | - | Full inspection | Full service | Quarterly for some components |

### Lifecycle Planning

**Year 1-5:**
- Routine inspection and service
- Minor defect rectification
- Battery replacement (as needed)
- Detector cleaning (as needed)

**Year 5-10:**
- Consider detector replacement (typical life 10 years)
- Panel battery replacement (typical life 4-5 years)
- Cable insulation testing
- Software/firmware updates

**Year 10+:**
- Full system replacement planning
- Technology obsolescence review
- Standard compliance update assessment
- Capital budget preparation

### When More Frequent Service Is Needed

- High dust/particulate environments
- Corrosive atmospheres
- Extreme temperature fluctuations
- High false-alarm history
- Critical uptime requirements
- Insurance or regulatory mandate
- After any significant fire event or discharge
```

**New component:** `MaintenanceCadence.astro`

### 15.7 - PDF Downloads

**Documents to generate:**
1. `fire-detection-service-checklist.pdf`
2. `gas-suppression-service-checklist.pdf`
3. `defect-certificate-guidance.pdf`
4. `maintenance-cadence-guide.pdf`
5. `sans-10139-summary.pdf`
6. `sans-14520-summary.pdf`

**Design approach:**
- Use verified Kharon letterhead (`kharon_letterhead_verified.svg`)
- Century Gothic font (brand continuity)
- Include QR code linking back to online resource (`kharon_qr_letterhead_verified.svg`)
- Footer with document version and date

**Storage:** `public/documents/compliance/`

### Implementation Tasks

```
[ ] 15.1.1 - Create /compliance hub page
[ ] 15.1.2 - Add navigation link (footer + primary nav dropdown)
[ ] 15.1.3 - Add hub page links to all service pages
[ ] 15.2.1 - Create SANS 10139 summary page
[ ] 15.2.2 - Add disclaimer about copyrighted standards
[ ] 15.2.3 - Link to official SANS standards purchase
[ ] 15.3.1 - Create SANS 14520 summary page
[ ] 15.3.2 - Add agent type reference table
[ ] 15.4.1 - Create fire detection checklist page
[ ] 15.4.2 - Create gas suppression checklist page
[ ] 15.4.3 - Add printable CSS styles
[ ] 15.5.1 - Create defect and certificate guidance page
[ ] 15.5.2 - Add certificate logic flowchart SVG
[ ] 15.6.1 - Create maintenance cadence page
[ ] 15.6.2 - Add lifecycle planning timeline
[ ] 15.7.1 - Design PDF templates with verified branding
[ ] 15.7.2 - Generate all 6 PDFs
[ ] 15.7.3 - Add download links to each resource page
[ ] 15.8.1 - Add internal links FROM all service pages TO compliance hub
[ ] 15.8.2 - Add contextual links within service content
[ ] 15.8.3 - Update sitemap.xml to include compliance pages
```

### Deployable Gate

- [ ] Compliance hub is live at `/compliance`
- [ ] Hub is linked from primary navigation (dropdown) and footer
- [ ] SANS 10139 summary page complete with disclaimer
- [ ] SANS 14520 summary page complete with agent table
- [ ] Both service checklists are interactive and printable
- [ ] Defect/certificate guidance includes flowchart
- [ ] Maintenance cadence table includes lifecycle planning
- [ ] All 6 PDFs generated with verified Kharon branding
- [ ] Every service page links to relevant compliance resources
- [ ] No copyrighted SANS text reproduced (summary-level only)
- [ ] `npm run build` and `npm run audit:site` pass

---

## Combined Implementation Timeline

### Week 1-2: Phase 7 (Authority Proof)
- Days 1-2: Collect approved project info from director
- Days 3-5: Write case studies, optimize photos
- Days 6-7: Create document templates, generate PDFs
- Days 8-10: Build CaseStudy component, integrate photos/docs

### Week 2-3: Phase 14 (Page Differentiation)
- Days 11-12: Gas suppression technical blocks
- Days 13-14: Fire detection technical blocks
- Days 15-16: Compliance technical blocks
- Days 17-18: Infrastructure + Security technical blocks
- Days 19-20: SVG diagrams, replace generic proof

### Week 3-4: Phase 15 (Compliance Hub)
- Days 21-22: Compliance hub page + SANS summaries
- Days 23-24: Service checklists (interactive)
- Days 25-26: Defect/certificate guidance
- Days 27-28: Maintenance cadence + PDFs
- Days 29-30: Internal linking, final QA

---

## SEO and Content Strategy

### Target Keywords

| Page | Primary Keyword | Secondary Keywords |
|------|----------------|-------------------|
| Gas Suppression | "gas suppression system Cape Town" | "FM-200 server room", "clean agent suppression" |
| Fire Detection | "fire detection system installation" | "addressable fire panel", "fire alarm servicing" |
| Compliance | "SANS 10139 compliance" | "fire system maintenance schedule" |
| Compliance Hub | "fire safety compliance checklist" | "SANS 14520 requirements" |

### Internal Linking Strategy

```
Homepage
  â†’ All service pages
  â†’ Compliance hub

Gas Suppression
  â†’ Compliance hub â†’ SANS 14520
  â†’ Compliance hub â†’ Gas checklist
  â†’ Case studies (suppression examples)

Fire Detection
  â†’ Compliance hub â†’ SANS 10139
  â†’ Compliance hub â†’ Fire checklist
  â†’ Case studies (detection examples)

Compliance & Maintenance
  â†’ Compliance hub (primary)
  â†’ All compliance resources
  â†’ Maintenance cadence

Critical Infrastructure
  â†’ Gas suppression page
  â†’ Fire detection page
  â†’ Compliance hub

Security Systems
  â†’ Fire detection page (integration)
  â†’ Critical infrastructure page
```

---

## Risk Mitigation

### Content Approval Risk
**Risk:** Director cannot approve project examples quickly.  
**Mitigation:** Create anonymised "typical project" examples that don't name clients.

### Copyright Risk
**Risk:** SANS content reproduction.  
**Mitigation:** Summary-level only, link to official standards purchase, explicit disclaimer on each page.

### Scope Creep Risk
**Risk:** Technical diagrams become overly complex.  
**Mitigation:** Use simple SVG/HTML CSS-based visuals (consistent with existing site style).

### SEO Disruption Risk
**Risk:** URL structure changes break existing rankings.  
**Mitigation:** Keep existing page URLs, only add new pages. No redirects needed.

---

## Success Metrics

### Quantitative
- [ ] 5+ new indexed pages (case studies, compliance hub, 2 SANS summaries, 2 checklists)
- [ ] 20+ internal links added
- [ ] Average time on page > 2 minutes for compliance resources
- [ ] Contact form submissions from compliance pages tracked

### Qualitative
- [ ] "This feels like a real specialist, not a template" (user testing)
- [ ] Compliance pages rank for target SANS keywords
- [ ] Case studies provide credible proof without naming clients
- [ ] Visitors download PDFs and return to site

---

## Definition of Done

All three phases complete when:

- [ ] Phase 7 gate: 2+ case studies, 3+ photos, 2+ document examples published
- [ ] Phase 14 gate: Each service page has unique technical proof (checklist, matrix, diagram)
- [ ] Phase 15 gate: Compliance hub live with 6 resources, all PDFs generated
- [ ] All internal links working
- [ ] No copyrighted material reproduced
- [ ] No unapproved client claims made
- [ ] `npm run build` passes
- [ ] `npm run audit:site` passes
- [ ] Mobile and desktop QA complete
- [ ] Director approval received

---

## Next Steps

1. **Director review of this plan** - confirm scope and priorities
2. **Content collection** - approved projects, photos, any vendor claims
3. **Phase 7 first** - quick wins with authority proof
4. **Phase 14 second** - page differentiation
5. **Phase 15 third** - compliance hub (largest content lift)
6. **Combined deploy** - all phases tested together before production cutover

