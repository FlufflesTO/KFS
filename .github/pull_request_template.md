# Pull Request Template

## UI/UX Compliance Checklist

**All PRs affecting UI components must complete this checklist:**

### Design Constitution Compliance
- [ ] Uses approved color tokens from `DESIGN_CONSTITUTION.md`
- [ ] Uses approved typography from `DESIGN_CONSTITUTION.md`
- [ ] Uses approved spacing from `DESIGN_CONSTITUTION.md`
- [ ] No new design tokens introduced without constitution update
- [ ] Preserves letterhead/logo rules (top-left primary anchor)
- [ ] No generic SaaS/admin template visuals
- [ ] Public and portal visual unity maintained

### Accessibility
- [ ] Accessible focus states (2px cyan outline, 4px offset)
- [ ] Minimum 44px touch targets for all interactive elements
- [ ] Keyboard navigation support (Tab order logical)
- [ ] ARIA labels on icon-only buttons and interactive elements
- [ ] Skip links present on new pages
- [ ] Color contrast meets WCAG 2.1 AA (4.5:1 text, 3:1 UI)
- [ ] Reduced-motion support (`@media (prefers-reduced-motion: reduce)`)

### Mobile & Responsive
- [ ] Mobile technician usability verified (one-handed operation where applicable)
- [ ] No horizontal overflow on mobile (test 320px width)
- [ ] Responsive breakpoints used correctly (sm, md, lg, xl, 2xl)
- [ ] Tables responsive (horizontal scroll or card layout on mobile)
- [ ] Forms stack correctly on mobile (labels above inputs)
- [ ] Navigation collapses to hamburger below 1024px

### Forms & Tables
- [ ] All form fields have visible labels (not placeholders only)
- [ ] Form validation messages clear and actionable
- [ ] Table headers use approved styling (13px semibold, uppercase)
- [ ] Table rows have proper hover states
- [ ] Status indicators use approved colors (green/amber/red/cyan)

### Code Quality
- [ ] No TypeScript errors (`npm run astro check`)
- [ ] No ESLint errors (`npm run lint` if available)
- [ ] Build passes (`npm run build`)
- [ ] No hydration/runtime errors in console
- [ ] No broken SVG paths or missing assets
- [ ] SEO metadata present on new public pages
- [ ] No backend/API behavior changed (unless intentional)

### Testing
- [ ] Tested on Chrome/Edge (latest)
- [ ] Tested on Firefox (latest)
- [ ] Tested on Safari (if Mac available)
- [ ] Tested on mobile device or emulator
- [ ] Tested with keyboard only (Tab, Enter, Escape)
- [ ] Tested with screen reader (if available)
- [ ] Tested with `prefers-reduced-motion` enabled

### Documentation
- [ ] Component JSDoc comments added
- [ ] TypeScript interfaces for component props
- [ ] Changes documented in relevant docs
- [ ] DESIGN_CONSTITUTION.md updated if tokens changed

---

## PR Information

**Type of Change:**
- [ ] Bug fix
- [ ] New feature
- [ ] UI/UX improvement
- [ ] Refactor
- [ ] Documentation
- [ ] Performance optimization

**Related Issues:**
Closes #___

**Testing Steps:**
1. ___
2. ___
3. ___

**Screenshots (if UI change):**
Before: ___
After: ___

**Deployment Checklist:**
- [ ] Cloudflare bindings verified (if applicable)
- [ ] Environment variables documented (if new)
- [ ] Database migrations added (if applicable)
- [ ] Rollback plan documented (if high-risk)

---

**Reviewers:**
- [ ] Design authority approval (for UI changes)
- [ ] Technical lead approval
- [ ] Security review (if authentication/authorization changed)

**Special Notes:**
_Add any additional context, risks, or considerations here._
