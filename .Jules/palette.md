## 2025-06-08 - Refactoring the jobs POST API
**Learning:** Refactoring backend endpoints directly benefits developer experience without altering UI.
**Action:** Splitting `src/pages/portal/api/admin/jobs.ts` logic into helper functions.

## 2026-10-05 - Keyboard Focus for Custom Native Elements
**Learning:** Native interactive elements like `<summary>` used for custom-styled dropdown menus require explicit focus states (e.g., `focus-visible:ring-2`) to ensure keyboard accessibility, as custom styling often overrides the browser's default focus rings.
**Action:** Ensure all interactive elements styled to look like custom UI components retain clear, visible focus states for keyboard navigation.
