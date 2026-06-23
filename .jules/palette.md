## 2025-06-08 - Refactoring the jobs POST API
**Learning:** Refactoring backend endpoints directly benefits developer experience without altering UI.
**Action:** Splitting `src/pages/portal/api/admin/jobs.ts` logic into helper functions.
## 2023-10-25 - Using focus-visible instead of focus
**Learning:** Using `focus:` applies a focus ring even when a button is clicked with a mouse, which can be visually distracting and look unpolished in certain design systems. The `focus-visible:` pseudo-class only triggers when navigating via keyboard, providing a better experience for both mouse and keyboard users.
**Action:** Always use `focus-visible:` instead of `focus:` for focus rings on interactive elements like buttons and links to ensure accessibility without compromising visual aesthetics for mouse users.
