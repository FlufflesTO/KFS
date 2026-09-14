## 2025-06-08 - Refactoring the jobs POST API
**Learning:** Refactoring backend endpoints directly benefits developer experience without altering UI.
**Action:** Splitting `src/pages/portal/api/admin/jobs.ts` logic into helper functions.

## 2026-09-14 - Header Dropdown Accessibility
**Learning:** Native interactive elements like `<summary>` used for custom-styled dropdown menus require explicit focus states (e.g., `focus-visible:ring`) to ensure keyboard accessibility, as custom styling often overrides the browser's default focus rings.
**Action:** Added focus ring classes to dropdown `<summary>` elements in the site header.
