## 2025-06-08 - Refactoring the jobs POST API
**Learning:** Refactoring backend endpoints directly benefits developer experience without altering UI.
**Action:** Splitting `src/pages/portal/api/admin/jobs.ts` logic into helper functions.
## 2025-07-20 - Use focus-visible for interactive elements
**Learning:** Generic `focus:` on interactive elements like buttons creates visual distraction for mouse users, while `focus-visible:` maintains accessibility for keyboard users without the distraction.
**Action:** Always prefer `focus-visible:` over `focus:` for focus rings on buttons, selects, and textareas.
