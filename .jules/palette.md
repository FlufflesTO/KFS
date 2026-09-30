## 2025-06-08 - Refactoring the jobs POST API
**Learning:** Refactoring backend endpoints directly benefits developer experience without altering UI.
**Action:** Splitting `src/pages/portal/api/admin/jobs.ts` logic into helper functions.

## 2026-09-30 - Added ARIA attributes and improved touch targets in ClientNav
**Learning:** Decorative SVG icons within navigation links should explicitly have `aria-hidden="true"` to prevent screen readers from reading them. `aria-current="page"` should be toggled dynamically for active links. Navigation items on mobile require sufficient touch target dimensions (`min-h-[44px]`).
**Action:** Consistently enforce `aria-hidden="true"` on decorative inline SVGs, use dynamic `aria-current` attributes for current page state, and ensure interactive elements have a minimum of 44x44px touch areas across the application.
