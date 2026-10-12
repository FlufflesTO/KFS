## 2025-06-08 - Refactoring the jobs POST API
**Learning:** Refactoring backend endpoints directly benefits developer experience without altering UI.
**Action:** Splitting `src/pages/portal/api/admin/jobs.ts` logic into helper functions.

## 2025-06-08 - Adding Focus States to Custom Dropdowns
**Learning:** Native interactive elements like `<summary>` used for custom-styled dropdown menus require explicit focus states to ensure keyboard accessibility. Browsers often lose default focus rings when custom styling is applied.
**Action:** Always add `focus-visible:ring` and related styles when heavily customizing `<summary>` elements or buttons.
