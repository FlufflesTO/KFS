## 2025-06-08 - Refactoring the jobs POST API
**Learning:** Refactoring backend endpoints directly benefits developer experience without altering UI.
**Action:** Splitting `src/pages/portal/api/admin/jobs.ts` logic into helper functions.

## 2023-10-27 - Custom styling dropping default focus rings on native details/summary
**Learning:** Native interactive elements like `<summary>` used for custom-styled dropdown menus will drop their browser default focus rings when custom Tailwind styling is applied, creating accessibility traps for keyboard users.
**Action:** When implementing or modifying custom UI using semantic HTML interactable tags, always explicitly add focus states (e.g., `focus-visible:ring`) to ensure keyboard accessibility.
