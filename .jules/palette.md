## 2025-06-08 - Refactoring the jobs POST API
**Learning:** Refactoring backend endpoints directly benefits developer experience without altering UI.
**Action:** Splitting `src/pages/portal/api/admin/jobs.ts` logic into helper functions.

## 2025-06-08 - Use focus-visible instead of focus
**Learning:** Using `focus:` applies a focus ring even on mouse click, which can be visually distracting and is generally considered bad practice for non-keyboard users. `focus-visible:` only applies focus styles for keyboard navigation, making it much more user-friendly.
**Action:** Replace `focus:` with `focus-visible:` on interactive elements.
