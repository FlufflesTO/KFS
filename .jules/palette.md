## 2025-06-08 - Refactoring the jobs POST API
**Learning:** Refactoring backend endpoints directly benefits developer experience without altering UI.
**Action:** Splitting `src/pages/portal/api/admin/jobs.ts` logic into helper functions.
## 2025-06-08 - Accessible `<summary>` focus rings
**Learning:** Native interactive elements like `<summary>` used for custom-styled dropdown menus require explicit focus states (e.g., `focus-visible:ring`) to ensure keyboard accessibility, as custom styling often overrides the browsers default focus rings.
**Action:** Always test keyboard navigation on custom native elements like `<summary>` and explicitly add `focus-visible` styling when they act as interactive toggles.
