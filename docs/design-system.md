# Kharon Design System Summary

**Quick Reference Guide** | For complete specification, see `DESIGN_CONSTITUTION.md` and `KHARON_DESIGN_SYSTEM_DOCUMENTATION.md`

---

## Design Tokens

### Colors

**Brand Colors (Immutable):**
```css
--color-kharon-purple: #4B2E83;  /* Primary action */
--color-kharon-blue: #1F4E79;    /* Hover states */
--color-kharon-black: #0B0D0F;   /* Headers, dark backgrounds */
--color-kharon-cyan: #00C2FF;    /* Highlights, focus states */
--color-kharon-amber: #F59E0B;   /* Warnings */
--color-kharon-red: #C4332F;     /* Errors, critical alerts */
--color-kharon-green: #16A34A;   /* Success, valid status */
```

**Neutral Palette:**
```css
--color-kharon-charcoal: #15191D;  /* Secondary dark */
--color-kharon-grey: #2B3138;      /* Body text alternative */
--color-kharon-light: #F3F5F7;     /* Light backgrounds, form fields */
--color-kharon-border: #D6D9DD;    /* Borders, dividers */
```

**Status Colors (Functional):**
- ✅ **Green**: Valid certificates, success states
- ⚠️ **Amber**: Warnings, pending approval, attention required
- 🚫 **Red**: Errors, blocked certificates, critical defects
- 🔵 **Cyan**: Active indicators, highlights, focus states

### Typography

**Font Family:**
```css
font-family: "Inter", system-ui, -apple-system, sans-serif;
```

**Font Weights:**
- `400` - Body text
- `500` - Buttons, emphasized text
- `600` - Headings, labels
- `700` - Critical alerts (sparingly)

**Typography Scale:**
```css
/* Headings (responsive via clamp) */
.kharon-h1: clamp(1.75rem, 3.5rem, 2.75rem);   /* 28px → 44px */
.kharon-h2: clamp(1.375rem, 2.5rem, 2rem);     /* 22px → 32px */
.kharon-h3: clamp(1rem, 1.25rem, 1.25rem);     /* 16px → 20px */

/* Body */
--text-base: 0.9375rem;  /* 15px */
--text-sm: 0.8125rem;    /* 13px */
--text-xs: 0.75rem;      /* 12px */
```

### Spacing

**Layout:**
```css
--header-height: 5rem;           /* 80px fixed header */
--section-padding: clamp(2.5rem, 4rem, 4rem);  /* 40px → 64px */
--container-max: 1280px;         /* Max content width */
```

**Touch Targets:**
```css
--touch-target-min: 44px;        /* WCAG accessibility minimum */
```

**Gap Scale:**
- `gap-1` (4px), `gap-2` (8px), `gap-4` (16px), `gap-6` (24px)

### Border Radius
```css
--radius-sm: 0.375rem;   /* 6px */
--radius-md: 0.5rem;     /* 8px */
--radius-lg: 0.75rem;    /* 12px */
```

### Shadows
```css
--shadow-subtle: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
--shadow-md: 0 4px 6px -1px rgba(0,0,0,.1);
--shadow-lg: 0 10px 15px -3px rgba(0,0,0,.1);
--shadow-xl: 0 20px 25px -5px rgba(0,0,0,.1);
```

---

## Component Patterns

### Buttons

**Base Classes:**
```html
<button class="inline-flex items-center justify-center rounded-md border font-semibold font-weight-500 transition-all duration-200 active:scale-[0.98] min-h-[44px]">
```

**Variants:**
```html
<!-- Primary -->
<button class="bg-kharon-purple text-white border-transparent hover:bg-kharon-blue">

<!-- Secondary -->
<button class="bg-white text-kharon-purple border-kharon-border hover:border-kharon-purple">

<!-- Danger -->
<button class="bg-kharon-red text-white border-transparent hover:bg-red-700">

<!-- Ghost -->
<button class="bg-transparent text-kharon-purple border-transparent hover:bg-kharon-purple/5">
```

**Sizes:**
```html
<!-- Small -->
<button class="px-4 py-2 text-xs min-h-[36px]">

<!-- Medium -->
<button class="px-5 py-2.5 text-sm min-h-[40px]">

<!-- Large -->
<button class="px-8 py-3.5 text-base min-h-[48px]">
```

### Cards

**Base Card:**
```html
<div class="rounded-md border border-kharon-border bg-white shadow-subtle p-4 sm:p-5 lg:p-6">
```

**Card with Header:**
```html
<div class="rounded-md border border-kharon-border bg-white shadow-subtle">
  <div class="mb-5">
    <p class="mb-1.5 text-xs font-semibold uppercase tracking-widest text-kharon-purple/70">
      Subtitle
    </p>
    <h2 class="text-base font-semibold tracking-tight text-kharon-black">
      Title
    </h2>
    <div class="mt-4 h-[1px] w-6 bg-kharon-purple/30"></div>
  </div>
  <div class="text-kharon-grey text-sm leading-relaxed font-normal">
    Content
  </div>
</div>
```

**Card Variants:**
```html
<!-- Primary -->
<div class="border-kharon-purple/20 shadow-md">

<!-- Warning -->
<div class="border-amber-200 bg-amber-50/30">

<!-- Danger -->
<div class="border-red-200 bg-red-50/30">

<!-- Success -->
<div class="border-green-200 bg-green-50/30">
```

### Form Fields

**Input:**
```html
<label class="grid gap-2 text-sm font-semibold text-kharon-black">
  Label Text
  <input 
    type="text" 
    class="w-full rounded-md border border-kharon-border bg-kharon-light px-4 py-3 font-normal focus:outline-none focus:border-kharon-purple focus:ring-2 focus:ring-kharon-purple/10"
  />
</label>
```

**Select:**
```html
<select class="w-full rounded-md border border-kharon-border bg-kharon-light px-4 py-3 font-normal focus:outline-none focus:border-kharon-purple">
```

**Textarea:**
```html
<textarea 
  rows="4"
  class="w-full rounded-md border border-kharon-border bg-kharon-light px-4 py-3 font-normal focus:outline-none focus:border-kharon-purple"
></textarea>
```

### Tables

**Base Table:**
```html
<table class="min-w-full divide-y divide-kharon-border">
  <thead class="bg-kharon-light">
    <tr>
      <th class="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-kharon-black">
        Column
      </th>
    </tr>
  </thead>
  <tbody class="divide-y divide-kharon-border bg-white">
    <tr class="hover:bg-kharon-light/50">
      <td class="px-6 py-4 text-sm text-kharon-grey">
        Data
      </td>
    </tr>
  </tbody>
</table>
```

### Status Badges

**Badge Base:**
```html
<span class="inline-flex items-center gap-2 text-xs font-bold uppercase">
  <span class="h-2 w-2 rounded-full bg-{color}"></span>
  Status Label
</span>
```

**Status Colors:**
```html
<!-- Valid -->
<span class="text-green-700"><span class="bg-green-600"></span>Valid</span>

<!-- Blocked -->
<span class="text-red-700"><span class="bg-red-600"></span>Blocked</span>

<!-- Pending -->
<span class="text-amber-700"><span class="bg-amber-500"></span>Pending</span>

<!-- Active -->
<span class="text-cyan-700"><span class="bg-cyan-500"></span>Active</span>
```

---

## Layout Patterns

### Section Padding
```html
<section class="section-padding">
  <!-- Uses clamp(2.5rem, 4rem, 4rem) -->
</section>
```

### Hero Padding
```html
<section class="hero-padding">
  <!-- Uses clamp(3rem, 5rem, 6rem) -->
</section>
```

### Grid Layouts
```html
<!-- 2 Column -->
<div class="grid gap-6 md:grid-cols-2">

<!-- 3 Column -->
<div class="grid gap-6 md:grid-cols-2 lg:grid-cols-3">

<!-- 4 Column -->
<div class="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
```

### Responsive Container
```html
<div class="container mx-auto px-4 max-w-7xl">
```

---

## Accessibility

### Focus States
```css
:focus-visible {
  outline: 2px solid var(--color-kharon-cyan);
  outline-offset: 4px;
}
```

**Usage:**
```html
<button class="focus:outline-none focus-visible:ring-2 focus-visible:ring-kharon-cyan focus-visible:ring-offset-2">
```

### Skip Links
```html
<a href="#main-content" class="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-kharon-purple focus:text-white">
  Skip to main content
</a>
```

### ARIA Labels
```html
<!-- Icon-only button -->
<button aria-label="Close menu">
  <svg>...</svg>
</button>

<!-- Navigation -->
<nav aria-label="Main navigation">

<!-- Current page -->
<a aria-current="page" href="/current">
```

### Reduced Motion
```css
@media (prefers-reduced-motion: reduce) {
  *, ::before, ::after {
    animation: none !important;
    transition-duration: 1ms !important;
  }
}
```

---

## Responsive Breakpoints

**Tailwind Defaults (Mobile-First):**
```css
sm: 640px   /* Small tablets */
md: 768px   /* Tablets */
lg: 1024px  /* Laptops */
xl: 1280px  /* Desktops */
2xl: 1536px /* Large screens */
```

**Usage Pattern:**
```html
<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
```

---

## Animation System

### Approved Animations
```css
/* Fade In */
animation: fadeIn 0.6s ease-out forwards;

/* Slide Up */
animation: slideUp 0.6s cubic-bezier(0.22, 0.61, 0.36, 1) forwards;

/* Reveal */
animation: reveal-up 0.8s cubic-bezier(0.2, 0.8, 0.2, 1) forwards;
```

### Performance Rules
- Use `transform` and `opacity` only (GPU-accelerated)
- Avoid animating `width`, `height`, `top`, `left`
- Maximum 3 concurrent animations
- Maximum 800ms duration

---

## Logo Usage

### Logo Files
- **Full Logo:** `/brand/kharon-full-logo.svg` (footer, documents)
- **Logo Mark:** `/brand/kharon-mark.svg` (header, 28×38px)

### Clear Space
```
┌─────────────────────────┐
│         24px            │
│   ┌─────────────────┐   │
│24px│    LOGO MARK    │24px│
│   └─────────────────┘   │
│         24px            │
└─────────────────────────┘
```

### Prohibited Uses
- ❌ Stretch or distort
- ❌ Change colors (except white on dark)
- ❌ Add effects (shadows, gradients)
- ❌ Rotate or angle
- ❌ Place on busy backgrounds without backing

---

## Portal-Specific Patterns

### Portal Shell
```html
<body class="bg-gradient-to-br from-slate-50 to-slate-100">
```

### Portal Header
```html
<header class="sticky top-0 z-50 bg-[#0B0D0F]/80 backdrop-blur-md shadow-lg shadow-black/10">
```

### Portal Navigation
```html
<nav class="flex items-center gap-2">
  <a class="px-3.5 py-2 text-xs font-semibold uppercase tracking-wide rounded-md min-h-[40px]">
    Link
  </a>
</nav>
```

### Dashboard Panels
```html
<div class="portal-panel rounded-md bg-white border border-kharon-border p-4 sm:p-5 lg:p-6">
```

---

## File Locations

### Design Governance
- `DESIGN_CONSTITUTION.md` - Authoritative design rules
- `KHARON_DESIGN_SYSTEM_DOCUMENTATION.md` - Complete technical reference
- `docs/design-system.md` - This summary

### Components
- `src/components/ui/` - Button, Card, StatusIndicator
- `src/components/layout/` - Header, Footer
- `src/components/sections/` - Hero, ServiceGrid, SplitFeature
- `src/components/portal/` - Portal-specific components

### Styles
- `src/styles/global.css` - Design tokens, base styles
- `tailwind.config.mjs` - Tailwind configuration

### Assets
- `public/brand/` - Logo files, letterhead
- `public/icons/` - PWA icons, favicon

---

## Quick Checks

### Before Committing UI Changes
- [ ] Uses approved color tokens
- [ ] Uses approved typography
- [ ] 44px minimum touch targets
- [ ] Focus states visible (2px cyan, 4px offset)
- [ ] Responsive (test mobile, tablet, desktop)
- [ ] Reduced motion supported
- [ ] Keyboard navigable
- [ ] ARIA labels where needed
- [ ] No horizontal overflow on mobile
- [ ] Matches DESIGN_CONSTITUTION.md

### Common Mistakes to Avoid
- ❌ Using `font-bold` (700) for headings (use 600 semibold)
- ❌ Using generic colors (use `--color-kharon-*` tokens)
- ❌ Touch targets below 44px
- ❌ Removing focus outlines without replacement
- ❌ Using `max-width` breakpoints (use mobile-first)
- ❌ Adding decorative animations
- ❌ Generic SaaS/admin template visuals

---

**For Complete Specification:**
- See `DESIGN_CONSTITUTION.md` for governing rules
- See `KHARON_DESIGN_SYSTEM_DOCUMENTATION.md` for full technical reference

**Last Updated:** 2026-05-27
