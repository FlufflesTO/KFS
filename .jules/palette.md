## 2025-06-08 - Refactoring the jobs POST API
**Learning:** Refactoring backend endpoints directly benefits developer experience without altering UI.
**Action:** Splitting `src/pages/portal/api/admin/jobs.ts` logic into helper functions.

## 2025-06-08 - Use focus-visible over focus
**Learning:** Using `focus:` for focus rings causes visual distraction for mouse users when they click interactive elements.
**Action:** Use `focus-visible:` pseudo-class (e.g., `focus-visible:ring-2`) instead of `focus:` for custom focus rings to ensure they only appear for keyboard navigation, improving the experience for mouse users while preserving accessibility. Retain `focus:outline-none` to strip native browser rings across all interactions.
