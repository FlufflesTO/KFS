## 2025-06-08 - Refactoring the jobs POST API
**Learning:** Refactoring backend endpoints directly benefits developer experience without altering UI.
**Action:** Splitting `src/pages/portal/api/admin/jobs.ts` logic into helper functions.
## 2025-07-25 - Focus-visible transition for components
**Learning:** Replaced Tailwind `focus:` with `focus-visible:` for mouse users to improve visual experience and removed lingering active states while preserving keyboard accessibility.
**Action:** Replaced `focus:ring-2` with `focus-visible:ring-2` inside components/ui.
