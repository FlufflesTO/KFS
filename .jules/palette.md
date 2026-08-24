## 2025-06-08 - Refactoring the jobs POST API
**Learning:** Refactoring backend endpoints directly benefits developer experience without altering UI.
**Action:** Splitting `src/pages/portal/api/admin/jobs.ts` logic into helper functions.

## 2025-06-08 - Keyboard Focus on Utility Close Buttons
**Learning:** Icon-only utility buttons like close ('x') icons in toasts, modals, and drawers lacked visual focus indicators, breaking keyboard accessibility for essential user actions.
**Action:** Always add explicit focus-visible classes (`focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-kharon-cyan focus-visible:ring-offset-4 focus-visible:ring-offset-kharon-charcoal`) to utility and close buttons alongside standard hover states.
