## 2025-06-08 - Refactoring the jobs POST API
**Learning:** Refactoring backend endpoints directly benefits developer experience without altering UI.
**Action:** Splitting `src/pages/portal/api/admin/jobs.ts` logic into helper functions.

## 2023-08-03 - Focus states vs Focus visible
**Learning:** `focus:ring` applies focus rings indiscriminately to both mouse clicks and keyboard navigation, causing visual distraction for mouse users.
**Action:** Use `focus-visible:ring-*` for custom focus styles while retaining unconditional `focus:outline-none` to override native browser styling. This ensures accessibility for keyboard users without compromising the visual experience for mouse users.
