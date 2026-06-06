---
name: accessibility
description: Guidelines for enforcing WCAG 2.1 AA accessibility standards, focusing on keyboard navigation, ARIA tags, and target sizing. Use when designing, updating, or reviewing UI components.
---

# Accessibility (a11y) & WCAG 2.1 Guidelines

The Kharon platform requires full adherence to WCAG 2.1 AA standards.

## Key Compliance Checklists

1. **Focus States**: Every interactive element must have a highly visible focus ring. Ensure they use:
   ```css
   outline: 2px solid var(--color-kharon-cyan);
   outline-offset: 4px;
   ```
   Or tailwind: `focus:ring-2 focus:ring-kharon-cyan focus:outline-none`.
2. **Interactive Sizing**: Ensure touch targets are at least `44x44px` to accommodate physical field equipment usage.
3. **Screen Reader Text**: Add `aria-label` or `.sr-only` descriptions to visual-only elements (like SVGs) to ensure screen reader accessibility.
4. **Contrast**: High contrast ratios must be maintained, especially on dark surfaces.
5. **No Emojis**: Emojis are strictly banned from all UI components. Use SVGs instead.
