## 2025-06-08 - Refactoring the jobs POST API
**Learning:** Refactoring backend endpoints directly benefits developer experience without altering UI.
**Action:** Splitting `src/pages/portal/api/admin/jobs.ts` logic into helper functions.

## 2026-07-19 - Focus Rings for Mouse vs Keyboard
**Learning:** Using 'focus:ring' triggers visual focus styles on mouse click, which can be distracting. Using 'focus-visible:ring' ensures focus rings only appear during keyboard navigation.
**Action:** Use 'focus-visible:ring' (while maintaining 'focus:outline-none') for custom focus rings on interactive elements to support keyboard users without distracting mouse users.
