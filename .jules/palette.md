## 2025-06-08 - Refactoring the jobs POST API
**Learning:** Refactoring backend endpoints directly benefits developer experience without altering UI.
**Action:** Splitting `src/pages/portal/api/admin/jobs.ts` logic into helper functions.
## 2026-09-17 - Add explicit focus rings to custom summary elements
**Learning:** Native interactive elements like summary tags used for custom-styled dropdown menus lose their default browser focus rings due to custom styling. This requires explicit focus-visible states to ensure keyboard accessibility and pass visual a11y checks.
**Action:** Add explicit focus-visible states (e.g., focus-visible:outline-none focus-visible:ring-2) to all summary elements and similar interactive native tags that use custom styling.
