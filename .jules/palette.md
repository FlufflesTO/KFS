## 2025-06-08 - Refactoring the jobs POST API
**Learning:** Refactoring backend endpoints directly benefits developer experience without altering UI.
**Action:** Splitting `src/pages/portal/api/admin/jobs.ts` logic into helper functions.

## 2026-09-06 - Missing Focus States on Accordions
**Learning:** The native `<summary>` element inside `<details>` used for FAQs lacks a visible focus indicator by default when using Tailwind reset, rendering keyboard navigation inaccessible for screen reader or keyboard-only users as they cannot track their current position on the page.
**Action:** Always add `focus-visible:ring` state utility classes to interactive elements like `<summary>` that function as toggles.
