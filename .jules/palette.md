## 2025-06-08 - Refactoring the jobs POST API
**Learning:** Refactoring backend endpoints directly benefits developer experience without altering UI.
**Action:** Splitting `src/pages/portal/api/admin/jobs.ts` logic into helper functions.
## 2026-09-20 - Custom Dropdown Menus Using Details/Summary Need Focus Rings
**Learning:** Native interactive elements like `<summary>` used for custom-styled dropdown menus (which are heavily used in this project's Header and various portal views) require explicit focus states to ensure keyboard accessibility. Custom CSS styling (like `list-none` and `appearance-none`) overrides the browser's default focus rings, leaving keyboard users with no visual indication of which menu is focused.
**Action:** When implementing or modifying custom `<details>/<summary>` dropdown patterns, always explicitly apply Tailwind focus ring utilities (e.g., `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color] focus-visible:ring-offset-[size]`) to the `<summary>` element to restore accessibility.
