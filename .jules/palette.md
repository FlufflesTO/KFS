## 2025-06-08 - Refactoring the jobs POST API
**Learning:** Refactoring backend endpoints directly benefits developer experience without altering UI.
**Action:** Splitting `src/pages/portal/api/admin/jobs.ts` logic into helper functions.
## 2024-03-24 - Improve keyboard accessibility on Portal Layout buttons
**Learning:** Some interactive elements like the mobile drawer toggle, mobile drawer close button, and feedback modal close button were missing visible focus states or were using standard `focus:` which can be visually distracting for mouse users.
**Action:** Added `focus-visible:` utilities (`focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-kharon-cyan focus-visible:ring-offset-2`) to ensure focus rings are only shown during keyboard navigation, improving both accessibility and general UX.
