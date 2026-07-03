## 2025-06-08 - Refactoring the jobs POST API
**Learning:** Refactoring backend endpoints directly benefits developer experience without altering UI.
**Action:** Splitting `src/pages/portal/api/admin/jobs.ts` logic into helper functions.

## 2025-06-08 - Accessible Focus States
**Learning:** Using `focus:` on interactive elements creates visual distraction for mouse users when they click buttons, causing unnecessary focus rings to persist.
**Action:** Always use the `focus-visible:` pseudo-class (e.g., `focus-visible:ring-2`, `focus-visible:outline-none`) instead of `focus:` for focus rings on buttons and other interactive elements, ensuring they only trigger during keyboard navigation while keeping the UI clean for mouse users.
