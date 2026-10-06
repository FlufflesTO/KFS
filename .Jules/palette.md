## 2025-06-08 - Refactoring the jobs POST API
**Learning:** Refactoring backend endpoints directly benefits developer experience without altering UI.
**Action:** Splitting `src/pages/portal/api/admin/jobs.ts` logic into helper functions.

## 2026-10-06 - Accessible Focus States for Custom Summary Elements
**Learning:** Native `<summary>` elements lose their default browser focus rings when heavily styled (e.g. with `list-none` or `marker:hidden`). This breaks keyboard accessibility because users cannot see which menu item is currently focused.
**Action:** Always explicitly add `focus-visible` styles (e.g., `focus-visible:ring-2 focus-visible:ring-offset-2`) to native interactive elements like `<summary>` that have their default appearance overridden.
