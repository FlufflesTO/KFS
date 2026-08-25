## 2025-06-08 - Refactoring the jobs POST API
**Learning:** Refactoring backend endpoints directly benefits developer experience without altering UI.
**Action:** Splitting `src/pages/portal/api/admin/jobs.ts` logic into helper functions.

## 2023-10-27 - Floating close buttons need explicit focus rings
**Learning:** Floating utility buttons (like toast "x" close buttons) often rely entirely on visual layout for their affordance and lack explicit outlines. This causes severe accessibility issues for keyboard users who cannot see when the element has focus.
**Action:** Always append `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-kharon-cyan focus-visible:ring-offset-4 focus-visible:ring-offset-kharon-charcoal` to these utility buttons to ensure they have a visible focus indicator matching the design system.
