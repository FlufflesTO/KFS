# Kharon Design Constitution

**Version:** 1.0.0  
**Effective Date:** 2026-05-27  
**Status:** Governing Document  
**Authority:** All UI/UX work must comply with this constitution

---

## Preamble

This document establishes the immutable visual and experiential principles for the Kharon Fire & Security digital presence. It governs all public-facing pages, the customer portal, and administrative interfaces. Deviations require explicit approval from the design authority.

---

## Article I: Visual Identity Principles

### Section 1.1: Brand Essence

Kharon's visual identity reflects **authority, precision, and trust** in the fire and security sector. The design must convey:

1. **Technical Competence** - Clean, engineered aesthetics
2. **Regulatory Authority** - Formal, compliance-oriented presentation
3. **Operational Reliability** - Stable, predictable interfaces
4. **South African Industrial Context** - Appropriate for heavy industry, mining, infrastructure

### Section 1.2: Prohibited Aesthetics

The following visual treatments are **forbidden**:

- ❌ Generic SaaS/admin template visuals (rounded pastel dashboards, playful illustrations)
- ❌ Overly decorative or whimsical elements
- ❌ Excessive white space that reduces information density
- ❌ Startup-style gradient backgrounds on primary content areas
- ❌ Emoji usage in professional interfaces
- ❌ Informal iconography (hand-drawn, cartoon styles)

### Section 1.3: Required Aesthetics

All interfaces **must** exhibit:

- ✅ Dense information architecture (engineered for professionals)
- ✅ Technical diagrams and schematic visualizations
- ✅ Compliance-focused data presentation (tables, status indicators)
- ✅ Industrial color palette (dark headers, high-contrast content)
- ✅ Formal typography (Inter, no decorative fonts)
- ✅ **A/B Variant Consistency**: All UI variants (`data-variant="A|B"`) must independently satisfy all core visual principles and avoid jarring layout shifts when accessed.

---

## Article II: Color System

### Section 2.1: Primary Brand Colors

These colors are **immutable** and define the Kharon brand:

```css
--color-kharon-purple: #4B2E83;  /* Primary brand - authority, expertise */
--color-kharon-blue: #1F4E79;    /* Secondary brand - trust, stability */
--color-kharon-black: #0B0D0F;   /* Primary dark - headers, backgrounds */
```

**Usage Rules:**
- Purple is the **primary action color** (buttons, links, active states)
- Blue is used for **hover states** and **secondary emphasis**
- Black is used for **headers**, **footers**, and **dark backgrounds**

### Section 2.2: Functional Colors

```css
--color-kharon-cyan: #00C2FF;    /* Highlights, active indicators */
--color-kharon-amber: #F59E0B;   /* Warnings, attention required */
--color-kharon-red: #C4332F;     /* Errors, critical alerts */
--color-kharon-green: #16A34A;   /* Success, valid status */
```

**Usage Rules:**
- Cyan: **Exclusively** for highlights and active state indicators
- Amber: **Only** for warnings and "attention required" states
- Red: **Only** for errors, critical defects, blocked certificates
- Green: **Only** for success states and valid certificates

### Section 2.3: Neutral Palette

```css
--color-kharon-charcoal: #15191D;  /* Secondary dark backgrounds */
--color-kharon-grey: #2B3138;      /* Body text (dark mode alternative) */
--color-kharon-light: #F3F5F7;     /* Light backgrounds, form fields */
--color-kharon-border: #D6D9DD;    /* Borders, dividers */
```

**Usage Rules:**
- Light backgrounds use `#F3F5F7` (never pure white except cards)
- Borders use `#D6D9DD` (never darker unless disabled state)
- Form fields use `#F3F5F7` background with `#D6D9DD` borders

---

## Article III: Typography System

### Section 3.1: Font Family

**Primary Font:** Inter (Google Fonts)

```css
--font-sans: "Inter", system-ui, -apple-system, sans-serif;
--font-heading: "Inter", system-ui, -apple-system, sans-serif;
```

**Substitution Policy:**
- If Inter fails to load, system fonts are acceptable
- **Never** substitute with decorative or serif fonts

### Section 3.2: Font Weights

```css
--font-weight-normal: 400;      /* Body text */
--font-weight-medium: 500;      /* Buttons, emphasized text */
--font-weight-semibold: 600;    /* Headings, labels */
--font-weight-bold: 700;        /* Reserved for critical alerts */
```

**Usage Rules:**
- Body text: **400** (never heavier)
- Headings: **600** (semibold, not bold)
- Buttons: **500** (medium weight)
- Labels/Captions: **600** (semibold, uppercase)
- Critical Alerts: **700** (bold, sparingly)

### Section 3.3: Typography Scale

**Headings (Responsive via clamp):**
```css
.kharon-h1: clamp(1.75rem, 3.5rem, 2.75rem);   /* 28px → 44px */
.kharon-h2: clamp(1.375rem, 2.5rem, 2rem);     /* 22px → 32px */
.kharon-h3: clamp(1rem, 1.25rem, 1.25rem);     /* 16px → 20px */
```

**Body Text:**
```css
--text-base: 0.9375rem;    /* 15px body text */
--text-sm: 0.8125rem;      /* 13px captions, labels */
--text-xs: 0.75rem;        /* 12px metadata, timestamps */
```

**Line Heights:**
```css
--leading-tight: 1.1;   /* Headings */
--leading-normal: 1.6;  /* Body text */
--leading-loose: 1.75;  /* Long-form content */
```

### Section 3.4: Letter Spacing

```css
--tracking-tight: -0.02em;   /* Headings */
--tracking-normal: -0.01em;  /* Body */
--tracking-wide: 0.05em;     /* Uppercase labels */
--tracking-widest: 0.1em;    /* Uppercase metadata */
```

**Usage Rules:**
- Headings: **Tight** tracking for compact appearance
- Body: **Normal** tracking (slightly negative for Inter)
- Uppercase Labels: **Wide** tracking for readability
- Uppercase Metadata: **Widest** tracking (timestamps, IDs)

---

## Article IV: Layout & Spacing

### Section 4.1: Grid System

**Container Widths:**
```css
--container-max: 1280px;     /* Max content width */
--container-narrow: 768px;   /* Forms, cards */
```

**Grid Columns:**
- Mobile: 1 column
- Tablet: 2 columns (`md:`)
- Desktop: 3-4 columns (`lg:`, `xl:`)

### Section 4.2: Spacing Scale

**Base Unit:** 4px (Tailwind default)

**Section Padding:**
```css
--section-padding: clamp(2.5rem, 4rem, 4rem);  /* 40px → 64px */
--hero-padding: clamp(3rem, 5rem, 6rem);       /* 48px → 96px */
```

**Card Padding:**
```css
--card-padding-sm: 12px;   /* Compact cards */
--card-padding-md: 16px;   /* Standard cards */
--card-padding-lg: 24px;   /* Feature cards */
```

**Gap Patterns:**
```css
--gap-tight: 8px;    /* Related items */
--gap-normal: 16px;  /* Standard grids */
--gap-loose: 24px;   /* Card grids */
--gap-section: 48px; /* Between sections */
```

### Section 4.3: Header Height

**Fixed Header:**
```css
--header-height: 5rem;  /* 80px */
```

**Usage:**
- All pages must account for header offset
- Scroll anchors must use `scroll-margin-top: var(--header-height)`
- Mobile menu sits below header (`top: var(--header-height)`)

---

## Article V: Component Standards

### Section 5.1: Buttons

**Minimum Touch Target:** 44px height (WCAG accessibility)

**Variants:**
```css
.primary: bg-kharon-purple, text-white
.secondary: bg-white, text-kharon-purple, border-kharon-border
.danger: bg-kharon-red, text-white
.ghost: bg-transparent, text-kharon-purple
```

**Sizes:**
```css
.sm: 36px height, 12px text
.md: 40px height, 14px text
.lg: 48px height, 16px text
```

**States:**
- Hover: Darken background by 10%
- Active: Scale to 98%
- Disabled: 50% opacity, cursor not-allowed
- Focus: 2px cyan outline, 4px offset

### Section 5.2: Cards

**Border Radius:** 0.5rem (8px)

**Border:** 1px solid `--color-kharon-border`

**Shadow:** `0 1px 2px 0 rgba(0, 0, 0, 0.05)`

**Variants:**
```css
.default: white background, border
.primary: purple tinted border
.warning: amber background tint
.danger: red background tint
.success: green background tint
```

**Content Structure:**
1. Optional subtitle (12px, uppercase, tracking-widest, purple/70)
2. Title (16px, semibold, black)
3. Divider (1px, purple/30, 24px width)
4. Body content (15px, normal weight, grey)

### Section 5.3: Form Fields

**Height:** 40px minimum

**Padding:** 8px vertical, 12px horizontal

**Border:** 1px solid `--color-kharon-border`

**Background:** `--color-kharon-light`

**Focus State:**
- Border: `--color-kharon-purple`
- Outline: 2px cyan, 4px offset
- Shadow: `0 0 0 2px rgba(75, 46, 131, 0.08)`

**Labels:**
- Font: 14px semibold
- Color: `--color-kharon-black`
- Spacing: 8px gap from input

### Section 5.4: Tables

**Header Row:**
- Background: `--color-kharon-light`
- Text: 13px semibold, uppercase, tracking-wide
- Padding: 12px 16px

**Data Rows:**
- Background: white
- Border-bottom: 1px solid `--color-kharon-border`
- Padding: 12px 16px
- Hover: `--color-kharon-light/50`

**Striping:**
- Even rows: white
- Odd rows: `--color-kharon-light/30`

### Section 5.5: Navigation

**Desktop Navigation:**
- Height: 80px (matches header)
- Links: 14px semibold, uppercase, tracking-wide
- Active: Purple background, white text
- Inactive: White/70 text, hover to white

**Mobile Navigation:**
- Full-screen overlay below header
- Links: 44px minimum touch targets
- Background: `#0B0D0F/95` with backdrop blur

---

## Article VI: Logo & Branding

### Section 6.1: Logo Files

**Primary Logo:** `/brand/kharon-full-logo.svg`
- Usage: Footer, letterhead, official documents
- Minimum width: 120px
- Clear space: 24px on all sides

**Logo Mark:** `/brand/kharon-mark.svg`
- Dimensions: 28×38px
- Usage: Header, portal, favicons
- Never stretch or rotate

### Section 6.2: Logo Clear Space

**Minimum Clear Space:**
```
┌─────────────────────────┐
│         24px            │
│   ┌─────────────────┐   │
│   │                 │   │
│24px│    LOGO MARK    │24px│
│   │                 │   │
│   └─────────────────┘   │
│         24px            │
└─────────────────────────┘
```

### Section 6.3: Logo Misuse Prohibitions

**Never:**
- ❌ Stretch or distort proportions
- ❌ Change colors (except white version on dark backgrounds)
- ❌ Add effects (shadows, gradients, outlines)
- ❌ Rotate or angle
- ❌ Place on busy backgrounds without backing
- ❌ Use outdated logo versions

**Background Watermark Exception:**
- Environmental background watermarks (e.g., the 3D "standing guard" `.kharon-sentinel-logo` and the homepage `.hero-cinematic__titan`) are explicitly permitted to use CSS 3D perspective transforms (`rotateX`, `rotateY`, `perspective`) and depth-simulating filters (`drop-shadow`). These elements must have `pointer-events: none` and remain strictly behind content with a low opacity (≤ 10%) to function as an ambient graphic rather than active foreground branding.

### Section 6.4: Letterhead

**Location:** `/brand/letterhead/`

**Usage:**
- Official documents only (certificates, invoices, quotes)
- Never for internal/admin documents
- Always include registration number and B-BBEE level

---

## Article VII: Animation & Motion

### Section 7.1: Animation Principles

**Purpose:** Animations serve functional purposes:
- Guide attention to important changes
- Provide feedback on user actions
- Indicate loading/processing states
- **Never** for decoration alone

### Section 7.2: Approved Animations

**Fade In:**
```css
animation: fadeIn 0.6s ease-out forwards;
```

**Slide Up:**
```css
animation: slideUp 0.6s cubic-bezier(0.22, 0.61, 0.36, 1) forwards;
```

**Reveal:**
```css
animation: reveal-up 0.8s cubic-bezier(0.2, 0.8, 0.2, 1) forwards;
```

**Duration Limits:**
- Maximum: 800ms
- Minimum: 200ms
- Stagger delay: 200ms between elements

### Section 7.3: Reduced Motion

**Requirement:** All animations must respect user preferences:

```css
@media (prefers-reduced-motion: reduce) {
  *, ::before, ::after {
    animation: none !important;
    transition-duration: 1ms !important;
  }
}
```

**Implementation:**
- Check `prefers-reduced-motion` media query
- Provide static fallback for all animated content
- Never disable functional animations (loading states, focus)

### Section 7.4: Performance

**GPU Acceleration:**
- Use `transform` and `opacity` only
- Avoid animating `width`, `height`, `top`, `left`
- Add `will-change` sparingly (test first)

**Budget:**
- Maximum 3 concurrent animations
- Maximum 500ms total animation time per interaction
- 60 FPS target (no jank)

---

## Article VIII: Accessibility

### Section 8.1: Color Contrast

**Minimum Ratios (WCAG 2.1 AA):**
- Normal text: 4.5:1
- Large text (18px+): 3:1
- UI components: 3:1

**Verified Combinations:**
- Purple (#4B2E83) on white: 7.5:1 ✅
- Cyan (#00C2FF) on black: 8.2:1 ✅
- Grey (#2B3138) on white: 10.1:1 ✅

### Section 8.2: Focus States

**Required Elements:**
- All interactive elements (links, buttons, inputs)
- Navigation menu items
- Form controls
- Dropdown triggers

**Focus Style:**
```css
:focus-visible {
  outline: 2px solid var(--color-kharon-cyan);
  outline-offset: 4px;
}
```

**Never:**
- ❌ Remove outline without replacement
- ❌ Use only color changes (must have visible indicator)
- ❌ Apply to non-interactive elements

### Section 8.3: Touch Targets

**Minimum Size:** 44×44px

**Applies To:**
- Buttons
- Navigation links
- Form controls
- Mobile menu items
- Card actions

**Spacing Between Targets:** 8px minimum

### Section 8.4: Screen Reader Support

**Required ARIA:**
- `aria-label` for icon-only buttons
- `aria-current="page"` for active navigation
- `aria-expanded` for collapsible sections
- `aria-live="polite"` for dynamic content updates

**Skip Links:**
- Must be first focusable element
- Visible on focus
- Skip to main content (`#main-content`)

---

## Article IX: Responsive Design

### Section 9.1: Breakpoint Strategy

**Tailwind Defaults (Mobile-First):**
```css
sm: 640px   /* Small tablets */
md: 768px   /* Tablets */
lg: 1024px  /* Laptops */
xl: 1280px  /* Desktops */
2xl: 1536px /* Large screens */
```

**Usage Rules:**
- Design mobile-first, scale up
- Never use `max-width` breakpoints
- Test at every breakpoint

### Section 9.2: Mobile Navigation

**Breakpoint:** `lg:hidden` (below 1024px)

**Behavior:**
- Hamburger menu triggers full-screen overlay
- Overlay sits below header (`top: 80px`)
- Backdrop blur for depth
- Close button in top-right

**Touch Targets:** 44px minimum height

### Section 9.3: Fluid Typography

**Implementation:**
```css
font-size: clamp(min, preferred, max);
```

**Examples:**
```css
/* H1: 28px mobile, 44px desktop */
font-size: clamp(1.75rem, 3.5rem, 2.75rem);

/* Body: 15px base, scales slightly */
font-size: clamp(0.9375rem, 1vw, 1.0625rem);
```

### Section 9.4: Content Reflow

**Rules:**
- Cards stack vertically on mobile
- Tables scroll horizontally if needed
- Images scale with container
- Navigation collapses to hamburger
- Forms stack labels above inputs

---

## Article X: Portal-Specific Standards

### Section 10.1: Portal Shell

**Background:**
```css
bg-gradient-to-br from-slate-50 to-slate-100
```

**Header:**
```css
bg-[#0B0D0F]/80 backdrop-blur-md
```

**Navigation:**
- Links: 12px semibold, uppercase, tracking-wide
- Active: Purple background, white text
- Inactive: White/70 text

### Section 10.2: Dashboard Panels

**Card Style:**
```css
bg-white border border-kharon-border rounded-md shadow-subtle
```

**Panel Header:**
- Title: 16px semibold
- Subtitle: 12px uppercase, tracking-widest
- Divider: 1px purple/30, 24px width

**Panel Content:**
- Padding: 16px standard
- Dense information presentation
- Tables for data display

### Section 10.3: Status Indicators

**Badge Style:**
```css
inline-flex items-center gap-2
text-xs font-bold uppercase
```

**Status Colors:**
- Valid: Green background, green text
- Blocked: Red background, red text
- Pending: Amber background, amber text
- Active: Cyan dot indicator

### Section 10.4: Technician Usability

**Requirements:**
- Large touch targets (field use)
- Offline-capable (service worker)
- GPS coordinates visible
- Photo upload prominent
- Quick status updates

**Mobile-First:**
- Design for 320px width
- Thumb-friendly placement
- One-handed operation where possible

---

## Article XI: Public Page Standards

### Section 11.1: Hero Sections

**Cinematic Hero:**
- Minimum height: 85svh
- Dark background (#0B0D0F)
- Technical linework overlays
- Titan illustration (right side)

**Content:**
- H1: 44px desktop, 28px mobile
- Subtitle: 20px, light grey
- CTA: Primary purple button

### Section 11.2: Service Cards

**Grid Layout:**
```css
grid gap-6 md:grid-cols-2 lg:grid-cols-4
```

**Card Style:**
- Border: kharon-border
- Background: kharon-light/50
- Hover: White background, shadow-xl

**Index Badge:**
- Size: 40×40px
- Background: Purple/5
- Text: Purple, bold

### Section 11.3: Compliance Pages

**Technical Blocks:**
- SVG diagrams with labeled components
- Step-by-step process flows
- SANS clause references prominent

**Certificate Examples:**
- Show actual certificate layouts
- Highlight security features
- Include validity verification QR

### Section 11.4: Contact Forms

**POPIA Compliance:**
- Consent checkbox required
- Privacy policy link
- Data retention disclosure

**Field Validation:**
- Real-time validation
- Clear error messages
- Success confirmation

---

## Article XII: Governance & Enforcement

### Section 12.1: Design Authority

**Responsibilities:**
- Approve deviations from this constitution
- Review and update token values
- Audit compliance across codebase
- Resolve visual inconsistency disputes

### Section 12.2: Compliance Review

**Required For:**
- All new pages/components
- Major redesigns
- Third-party integrations
- Marketing material

**Review Checklist:**
- [ ] Uses approved color tokens
- [ ] Follows typography scale
- [ ] Meets accessibility standards
- [ ] Respects logo guidelines
- [ ] Implements responsive breakpoints
- [ ] Includes reduced-motion support

### Section 12.3: Amendment Process

**Proposal:**
1. Submit written proposal with rationale
2. Provide visual examples/mockups
3. List affected components/pages

**Approval:**
- Design authority review (5 business days)
- Stakeholder consultation if major change
- Version bump and changelog update

**Implementation:**
- Update this document
- Communicate changes to team
- Provide migration guide if breaking

### Section 12.4: Violation Resolution

**Minor Violations:**
- Code review comment
- Developer fixes before merge

**Major Violations:**
- Block merge/pull request
- Require design authority approval
- Document exception if granted

---

## Appendix A: Quick Reference

### Color Tokens
```css
--color-kharon-purple: #4B2E83;
--color-kharon-blue: #1F4E79;
--color-kharon-black: #0B0D0F;
--color-kharon-cyan: #00C2FF;
--color-kharon-amber: #F59E0B;
--color-kharon-red: #C4332F;
--color-kharon-green: #16A34A;
```

### Typography
```css
font-sans: "Inter", system-ui, sans-serif;
h1: clamp(1.75rem, 3.5rem, 2.75rem), 600 weight
h2: clamp(1.375rem, 2.5rem, 2rem), 600 weight
body: 0.9375rem, 400 weight, 1.6 line-height
```

### Spacing
```css
header-height: 5rem (80px)
section-padding: clamp(2.5rem, 4rem, 4rem)
card-padding: 16px standard
touch-target: 44px minimum
```

### Components
```css
button-min-height: 44px
card-border-radius: 8px
card-border: 1px solid #D6D9DD
focus-outline: 2px solid #00C2FF, 4px offset
```

---

## Appendix B: File Locations

### Design Tokens
- **CSS Variables:** `src/styles/global.css` (@theme block)
- **Tailwind Config:** `tailwind.config.mjs`
- **This Document:** `DESIGN_CONSTITUTION.md`

### Logo Assets
- **Full Logo:** `public/brand/kharon-full-logo.svg`
- **Logo Mark:** `public/brand/kharon-mark.svg`
- **Letterhead:** `public/brand/letterhead/`

### Components
- **UI Kit:** `src/components/ui/`
- **Layout:** `src/components/layout/`
- **Sections:** `src/components/sections/`
- **Portal:** `src/components/portal/`

### Documentation
- **Design System:** `KHARON_DESIGN_SYSTEM_DOCUMENTATION.md`
- **This Constitution:** `DESIGN_CONSTITUTION.md`
- **README:** `README.md`

---

**Document Control:**
- **Version:** 1.0.0
- **Effective:** 2026-05-27
- **Next Review:** 2026-11-27 (6 months)
- **Maintained By:** Design Authority
- **Distribution:** All team members, contractors, agencies
