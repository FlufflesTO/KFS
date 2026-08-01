## 2025-06-08 - Refactoring the jobs POST API
**Learning:** Refactoring backend endpoints directly benefits developer experience without altering UI.
**Action:** Splitting `src/pages/portal/api/admin/jobs.ts` logic into helper functions.

## 2025-06-08 - Use focus-visible for better mouse user experience
**Learning:** Using `focus:` for focus rings causes them to appear even when clicking with a mouse, which can be visually distracting and is generally poor UX.
**Action:** Use `focus-visible:` for custom focus rings to ensure they only appear for keyboard navigation while maintaining `focus:outline-none` to remove default browser styles across all interactions.
