## 2025-06-08 - Refactoring the jobs POST API
**Learning:** Refactoring backend endpoints directly benefits developer experience without altering UI.
**Action:** Splitting `src/pages/portal/api/admin/jobs.ts` logic into helper functions.
## 2026-09-02 - Floating Close Button Focus States
**Learning:** Floating 'x' icon buttons for modals, toasts, and drawers across the app lack focus styling when triggered via keyboard, making navigation inaccessible for those users.
**Action:** Always apply `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color] focus-visible:ring-offset-[size] focus-visible:ring-offset-[color]` states to utility close buttons (often styled as generic text or SVGs) to ensure WCAG compliant keyboard focus outlines.
