## 2025-06-08 - Refactoring the jobs POST API
**Learning:** Refactoring backend endpoints directly benefits developer experience without altering UI.
**Action:** Splitting `src/pages/portal/api/admin/jobs.ts` logic into helper functions.
## 2024-05-24 - Standardizing Keyboard Focus Rings
**Learning:** Hardcoded `focus:` pseudo-classes on core UI components (like `Button.astro` and `KharonButton.astro`) create visual noise for mouse/touch users, as the focus ring triggers on click. This leads to a degraded UX for non-keyboard users while trying to support accessibility.
**Action:** Always prefer `focus-visible:` over `focus:` for focus rings (`ring`, `outline`) on interactive elements to ensure they only trigger during keyboard navigation, satisfying both visual aesthetics for mouse users and clear indication for keyboard users.
