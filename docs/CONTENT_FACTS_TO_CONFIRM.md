# Content Facts — Confirmation, Corrections & Verified Standards

Owner-confirmed status of business facts + **researched/verified SANS standards** per discipline.
Line refs captured 2026-06-07 against the active branch; re-verify before editing.

**Legend:** ✅ correct · ✏️ correction · 🗑️ remove · ✔️DONE applied this session · ❓ pending owner

---

## ✔️ Applied this session

- **Contact email → `admin@kharon.co.za`** (tequit has no inbox). Changed in:
  `config/site-config.ts:13`, `data/site.ts:79`, `components/sections/ContextualInquiry.astro` (×2),
  `lib/server/jobcardPdf.ts:260` (website left as tequit, the primary domain), `middleware.ts:588`,
  `pages/api/contact.ts:190`, `.github/workflows/ci-cd.yml:21`, `scripts/build-deploy-artifacts.ps1:131`.
- **Privacy: Information Regulator URL** `inforeg.org.za` → **`inforegulator.org.za`** (`privacy.astro:89`). Verified official site.
- **Address → `2B Uppercamp Road`** (was `Cnr Uppercamp & Berkley Rd`) in `site-config.ts`, `data/site.ts`, `BaseLayout.astro`, `jobcardPdf.ts`, `index.astro`, `public/legal/paia-manual.html` (also fixed the tequit email in the PAIA manual).
- **SAQCC cert number removed** → generic "SAQCC Fire & Gas registered" in both footers.
- **ISO 9001 claim removed** (`industries.astro:152`).
- **SANS 1475 removed everywhere** (matrix, CorporateCompliance → SANS 1253, compliance.astro Point-Detector entry → SANS 54/EN 54, site.ts & industries sector arrays, maintenance row → SANS 10105).
- **Sprinkler removed** (ComplianceTechnicalBlocks cadence row, DetectionTechnicalBlocks input).
- **SANS corrected to the authoritative list**: `SANS 10222`→`SANS 62676` (CCTV), `SANS 10198`(as access)→`SANS 60839-11-1`, `SANS 369`(as lighting)→`SANS 10114-2` — across `SansReferenceMatrix.astro` (fully rebuilt to the complete owner-supplied list), `about.astro`, `compliance.astro`, `industries.astro`, `SecurityTechnicalBlocks.astro`. The only remaining `SANS 10198` is the legitimate **power-cabling** entry in the matrix.
- **SansReferenceMatrix.astro rebuilt** with 7 categories from the complete authoritative SANS list (Detection, Suppression, Doors & Ironmongery, Signage & Evacuation, PA & Voice Evac, Electronic Security, Building & Electrical Integration).

---

## ✏️ Corrections still to apply (owner-confirmed, not yet edited)

### Address — `Cnr Uppercamp & Berkley Rd` → `2B Uppercamp Road`
Full: `Unit 58, M5 Freeway Park, 2B Uppercamp Road, Ndabeni, Maitland, 7405`. In:
`config/site-config.ts:15`, `data/site.ts:94`, `layouts/BaseLayout.astro:45`, `lib/server/jobcardPdf.ts:259`,
`pages/index.astro:28`, `public/legal/paia-manual.html:70`.

### 🗑️ SAQCC Fire certificate number — incorrect, remove
`components/Footer.astro:51` (`SAQCC Cert #: FIRE-2024-0847`), `components/layout/Footer.astro:62`
(`SAQCC FIRE-2024-0847`). Keep generic "SAQCC Fire & Gas registered" wording (that is correct).

### 🗑️ ISO 9001 — not held, remove
`pages/industries.astro:152` — drop `… to ISO 9001 quality discipline`.

### 🗑️ Sprinkler — remove
`components/sections/ComplianceTechnicalBlocks.astro:15`, `components/sections/DetectionTechnicalBlocks.astro:12`
(`Sprinkler Flow Switch`).

---

## 🔬 SANS standards — VERIFIED (research-backed)

The site currently contains **several incorrect SANS numbers**. Verified correct standards below.

### Errors found in the current site (must fix)
| Where | Current (WRONG) | Correct | Why |
|---|---|---|---|
| `SansReferenceMatrix.astro` | `SANS 369` = "Emergency Lighting" | **SANS 10114-2** | SANS 369 is a **gas-extinguishing-with-detection** standard, not lighting |
| `SansReferenceMatrix.astro` | `SANS 10222` = "CCTV" | **SANS/IEC 62676** | SANS 10222(-3) is **electric fencing**, not CCTV |
| `SansReferenceMatrix.astro` | `SANS 10198` = "Access Control" | **SANS/IEC 60839-11** | SANS 10198 is **electric power cables ≤33 kV**, not access control |
| `SansReferenceMatrix.astro` | `SANS 1475` = "Point Detector Performance" | (remove) | SANS 1475-1 = **reconditioning of portable extinguishers**; mislabelled (and owner wants 1475 gone) |
| `data/site.ts` solutionLinks "Integrated Security" | `["SANS 10222","SANS 10198"]` | `["SANS/IEC 62676","SANS/IEC 60839-11"]` | as above |
| `data/site.ts` sectors (telecoms `:255`, control rooms `:303`) | `SANS 10198` / `SANS 10222` | `SANS/IEC 60839-11` / `SANS/IEC 62676` | as above |
| `data/site.ts` Fire Detection solutionLink `:175` | `["SANS 10139","SANS 1475-1"]` | `["SANS 10139"]` | 1475-1 is extinguisher reconditioning, not detection |

### Verified standard per discipline (use these)
| Discipline | Correct standard(s) | Confidence |
|---|---|---|
| **Fire Detection** | **SANS 10139** (fire detection & alarm systems — design, installation, servicing) | High ✅ already used |
| **Gas Suppression** | **SANS 14520** (gaseous fire-extinguishing systems); **SANS 369** legitimately applies to gas systems actuated by automatic detection (release/detection logic) | High |
| **Fire Doors** | **SANS 1253** (fire door & shutter assemblies); tested per **SANS 10177-2**, admin **SANS 10177-1** | High |
| **Access Control** | **SANS/IEC 60839-11** (electronic access control systems; parts 11-1/11-2) | High |
| **CCTV** | **SANS/IEC 62676** (video surveillance systems for security; parts 1–4) | High |
| **Intrusion Detection** | **SANS/IEC 62642** (alarm systems — intrusion & hold-up systems, I&HAS; SA equivalent of EN 50131) | High |
| **Signage** | **SANS 1186-1** (symbolic safety signs); **SANS 1186-3** (internally-illuminated / photoluminescent); escape-route signage also under **SANS 10400-T** | High |
| **Public Address / Public Evac (voice evacuation)** | Within fire systems: **SANS 10139** (voice-alarm provisions). Dedicated emergency sound systems: historically **IEC 60849** (now withdrawn) → **ISO 7240-19** / EN 54-16/24 | Medium — confirm whether a current SANS adoption is preferred |
| **Ironmongery** | No standalone SANS found. Fire-door hardware is certified **as part of the SANS 1253 rated assembly** (SANS 10177); panic/emergency-exit hardware commonly references **EN 1125 / EN 179** | Low — confirm intended reference |
| **Emergency Lighting** | **SANS 10114-2** (interior lighting — emergency lighting) | High |

### Supporting standards already correct in the matrix (keep)
- **SANS 10142-1** — wiring of premises ✅
- **SANS 10090** — community protection against fire ✅
- **SANS 10400-T** — National Building Regulations, fire protection ✅

---

## ✅ Confirmed correct (no change)

- Phone `0615458830`; company reg `2016/313076/07`; legal name; B-BBEE Level 4; SAQCC Fire & Gas
  (generic, number removed); coverage (Cape Town → Southern Africa, commercial & industrial only);
  all SLA commitments.
- **Emergency-lighting "1-hour minimum"** (`compliance.astro:106-107`) — verified against SANS 10114-2
  (1 h baseline; some sources cite 90 min). Keep.

---

## ❓ Pending owner

- **Sector risk scores** (`data/site.ts:245-303`: 92/88/90/65/82/94/78/85) — these are **editorial numbers
  with no external standard to validate against**, presented as if data. Recommend either removing the
  precise figures or reframing as qualitative bands (e.g. Critical / High / Elevated) unless a documented
  scoring methodology exists. Cannot be "verified."
- **Full SANS list** — owner noted "various SANS missing." Provide the complete authoritative set per
  discipline so the SANS corrections above can be applied in one pass (alongside the SANS 1475 removal).
- **Public Address / Voice Evac & Ironmongery** standard references — confirm preferred citations (see table).
- **Geo coordinates** (`index.astro:36-37`) — owner to verify.
- **Brand/platform authorisation list** (`site.ts:397-417`, `about.astro:32-82`).
- **Privacy effective date** (`privacy.astro:16`, "3 June 2026") — bump if policy is re-issued.

---

## 🧭 Page architecture — future work (owner note)

- **Access Control** page will currently encompass **Fire Doors** and **Ironmongery**, but those should
  technically become their **own dedicated pages**.
- **Public Address (PA)**, **Public Evacuation (PE/voice evac)**, **Signage**, and the other newly-listed
  disciplines (Intrusion Detection, CCTV, etc.) will each need their **own pages**.
- Build these under `/portal`-independent public routes with matching nav entries; wire their SANS badges
  from the verified standards above. (Not yet created — tracked here.)

- **Geo coordinates** updated to `-33.92682014385232, 18.47915963914358` (`index.astro:36-37`). ✔️DONE

## ⚠️ Flags

- **Login-identifier emails still on tequit** (NOT the public contact email): `scripts/production-safety-reset.ps1:8`
  (`admin@tequit.co.za`) and `scripts/setup-auth-test.ts:14` (`test.admin@tequit.co.za`). These are account
  identifiers; if such accounts must receive mail (e.g. password resets) they need a real inbox. Left unchanged
  to avoid auth/seed side-effects — decide before relying on them.
- Removing **SANS 1475 (fire extinguishers)** also drops extinguisher/hose-reel compliance rows — confirm intended.
