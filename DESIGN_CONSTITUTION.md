# KHARON DESIGN CONSTITUTION

Status: Locked design authority  
Applies to: Entire Kharon public website, portal, dashboards, forms, auth screens, API-facing UI, documentation-facing UI  
Purpose: Prevent future visual drift after the Industrial Command Intelligence redesign.

## 1. Non-Negotiable Brand Direction

Kharon must visually present as:

**Industrial Command Intelligence**

The product must feel like:
- mission-critical infrastructure software
- enterprise fire and suppression intelligence
- compliance command infrastructure
- premium field service operations technology
- South African commercial and industrial protection authority

Kharon must never visually drift into:
- generic SaaS
- Bootstrap admin dashboard
- playful startup UI
- ordinary SME brochure site
- bright consumer app
- flat corporate template
- cheap cybersecurity cliché

## 2. Official Brand Asset Usage

Use the verified SVG assets only.

Required assets:
- `kharon_letterhead_verified.svg` for the formal top-left letterhead identity
- `kharon_full_logo_verified.svg` for formal brand presentation where full identity is required
- `Kharon Logo.svg` as the standalone environmental emblem
- `kharon_qr_letterhead_verified.svg` only for QR/document-oriented contexts

### Letterhead Rule

Every public and portal layout must maintain a formal top-left identity anchor using the verified letterhead/full-logo asset.

The letterhead must be:
- top-left aligned
- visually premium
- never centered as the main decorative object
- never replaced by plain text unless SVG loading fails
- never stretched
- never recolored outside approved monochrome/brand-safe treatment

### 3D Background Logo Rule

The standalone Kharon emblem may be used as a large environmental background mark.

It must:
- sit behind foreground content
- use low opacity, usually 3%–10%
- feel embossed, metallic, holographic, or infrastructural
- be partially obscured by panels/cards
- never compete with the top-left letterhead
- never appear as a flat decorative sticker

## 3. Color System

The official palette remains:

```css
--color-kharon-purple: #4B2E83;
--color-kharon-blue: #1F4E79;
--color-kharon-black: #0B0D0F;
--color-kharon-charcoal: #15191D;
--color-kharon-grey: #2B3138;
--color-kharon-light: #F3F5F7;
--color-kharon-border: #D6D9DD;
--color-kharon-amber: #F59E0B;
--color-kharon-cyan: #00C2FF;
--color-kharon-red: #C4332F;
--color-kharon-green: #16A34A;
```

### Extended Dark Surface Tokens

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
--glow-blue: 0 0 56px rgba(31, 78, 121, 0.28);
--text-primary-dark: #F3F5F7;
--text-secondary-dark: rgba(243, 245, 247, 0.72);
--text-muted-dark: rgba(243, 245, 247, 0.52);
```

### Color Role Rules

- Purple = authority, brand intelligence, strategic layer
- Blue = operations, engineering, systems layer
- Cyan = active state, focus, live telemetry, route highlights
- Amber = warning, attention, SLA risk, pending action
- Red = emergency, destructive actions, failed state
- Green = valid, completed, compliant, successful

Do not use random new accent colors.

## 4. Global Visual Style

All redesigned UI must use:
- dark industrial base
- graphite/obsidian layered backgrounds
- glass-metal surfaces
- subtle cyan/purple illumination
- precise borders
- restrained cinematic depth
- high information clarity

Avoid:
- pure white dashboard panels
- large bland white backgrounds
- generic grey cards
- overly rounded consumer UI
- heavy colorful illustrations
- excessive gradients without structure

## 5. Surface System

Cards, panels, modals, dashboard modules, forms, sidebars, and tables must use operational surface styling.

Preferred base:

```css
.kharon-surface {
  background:
    linear-gradient(135deg, rgba(21,25,29,.92), rgba(11,13,15,.96));
  border: 1px solid rgba(0,194,255,.14);
  box-shadow:
    0 24px 80px rgba(0,0,0,.42),
    inset 0 1px 0 rgba(255,255,255,.06);
  backdrop-filter: blur(18px);
}
```

### Surface Hierarchy

- Level 0: page background, obsidian gradient
- Level 1: large dashboard shell panels
- Level 2: cards, grouped metrics, form panels
- Level 3: modals, dropdowns, command menus
- Level 4: critical overlays, confirmation panels

No component may introduce an unrelated card style without updating this constitution.

## 6. Typography

Default UI font remains Inter.

Recommended type stack:
- UI/body: Inter
- headings/display: Space Grotesk or Inter if no extra font is introduced
- operational data: JetBrains Mono, IBM Plex Mono, or system monospace

### Heading Style

Headings must feel engineered:
- tight line height
- controlled letter spacing
- strong contrast
- no playful typography
- no exaggerated marketing fonts

### Operational Labels

Small labels must use:
- uppercase or title case consistently
- slight tracking
- muted text color
- compact rhythm

## 7. Layout Rules

### Public Website

Public pages must feel like an enterprise infrastructure interface, not a generic brochure.

Required:
- asymmetrical hero compositions
- background emblem/logo depth
- status/proof modules
- risk and compliance storytelling
- strong conversion path
- clear sector relevance

### Portal

Portal screens must feel like a secure operations console.

Required:
- left navigation rail or role-appropriate navigation
- strong top status context
- dense but readable operational panels
- consistent table/filter/action patterns
- role-aware workflows
- never generic admin-template appearance

### Technician Mobile

Technician UI must be mobile-first.

Required:
- large touch targets
- sticky job context
- bottom action zones where appropriate
- clear state transitions
- minimal typing during field work
- GPS/status/evidence clarity
- responsive at small phone widths

## 8. Component Rules

All component updates must preserve existing Astro architecture unless there is a clear technical reason.

Primary components to align:
- `BaseLayout.astro`
- `PortalLayout.astro`
- `Logo.astro`
- `Button.astro`
- `KharonButton.astro`
- `Card.astro`
- `KharonCard.astro`
- `StatusIndicator.astro`
- `TrustBar.astro`
- `ProofGrid.astro`
- `RouteMatrix.astro`
- `SectionHeading.astro`
- `SectorRiskGrid.astro`
- `ServiceGrid.astro`
- `SplitFeature.astro`
- `TrustModules.astro`
- dashboard tables/forms/navigation components

### Button Rules

Buttons are command actions.

Primary:
- purple-to-blue gradient
- cyan edge/highlight
- compact confidence
- visible focus state

Secondary:
- transparent graphite/glass
- soft cyan or white border

Danger:
- red restrained
- confirmation-first
- never decorative

### Form Rules

Forms must:
- be dark-surface compatible
- have strong focus rings
- show clear validation
- maintain readable labels
- avoid placeholder-only labels

## 9. Motion Rules

Motion must be:
- restrained
- premium
- CSS-first
- performance-safe
- reduced-motion compliant

Allowed:
- slow ambient logo drift
- subtle grid movement
- panel hover elevation
- opacity/transform reveal
- low-intensity glow pulses

Forbidden:
- bouncy animation
- excessive parallax
- distracting loops
- motion that interferes with data entry
- animation required to understand state

## 10. Accessibility and UX Rules

Do not sacrifice accessibility for visual drama.

Required:
- visible focus states
- adequate contrast
- keyboard navigability
- semantic headings
- reduced motion support
- labelled form fields
- non-color-only status communication
- minimum touch target 44px for field/mobile workflows

## 11. Page-Specific Direction

### Home
Must establish:
- Kharon as infrastructure continuity authority
- fire detection + gas suppression first
- compliance as operational discipline
- portal-grade sophistication

### Fire Detection
Must feel:
- engineered
- addressable
- cause-and-effect oriented
- fault/zone aware

### Gas Suppression
Must feel:
- precision engineered
- mission-critical
- clean-agent/high-value asset oriented

### Compliance
Must feel:
- forensic
- inspection-ready
- SANS-aligned
- evidence-driven

### Portal Login
Must feel:
- secure
- formal
- premium
- trust-building

### Admin Dashboard
Must feel:
- operations command center
- dispatch/compliance intelligence
- dense and authoritative

### Technician Dashboard
Must feel:
- rugged field terminal
- mobile-first
- action-oriented

### Client Dashboard
Must feel:
- compliance confidence
- transparency
- managed service assurance

### Finance Dashboard
Must feel:
- controlled
- ledger-oriented
- Sage workflow aware
- audit-safe

## 12. Anti-Drift Rules

Before any future design change:
1. Check whether it supports Industrial Command Intelligence.
2. Check whether it uses approved tokens.
3. Check whether it preserves the letterhead and environmental logo rules.
4. Check whether it improves operational clarity.
5. Check whether it preserves accessibility.
6. Check whether it keeps public site and portal visually unified.
7. Reject changes that make the system look generic, playful, flat, or template-like.

Any design change that violates this document must be rejected or explicitly reviewed.

## 13. Required Pull Request Checklist

Every PR that changes UI must include:

- [ ] Uses approved Kharon color tokens
- [ ] Preserves top-left brand/letterhead treatment
- [ ] Preserves dark industrial command style
- [ ] Does not introduce generic white SaaS panels unless intentionally needed for document content
- [ ] Maintains mobile usability
- [ ] Maintains visible focus states
- [ ] Supports reduced motion
- [ ] Uses existing component architecture where possible
- [ ] Keeps public site and portal visually unified
- [ ] Does not introduce unapproved fonts, colors, or UI libraries

## 14. Final Design Standard

The final UI must make this statement visually:

**Kharon runs critical fire, suppression, compliance, and field operations infrastructure with disciplined enterprise control.**
