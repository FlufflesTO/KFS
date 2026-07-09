## 2025-06-08 - Refactoring the jobs POST API
**Learning:** Refactoring backend endpoints directly benefits developer experience without altering UI.
**Action:** Splitting `src/pages/portal/api/admin/jobs.ts` logic into helper functions.
## 2025-06-08 - Use focus-visible over focus for keyboard navigation
**Learning:** Using `focus:ring-2` on interactive elements causes focus rings to persistently show on mouse click. This can be visually distracting for mouse users while providing no additional accessibility benefit.
**Action:** Replace `focus:ring` with `focus-visible:ring` to ensure focus rings only appear when navigating via keyboard, improving both visual polish and accessibility.
