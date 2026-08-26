## 2025-06-08 - Refactoring the jobs POST API
**Learning:** Refactoring backend endpoints directly benefits developer experience without altering UI.
**Action:** Splitting `src/pages/portal/api/admin/jobs.ts` logic into helper functions.
## 2025-06-08 - Keyboard Accessibility for Utility Buttons
**Learning:** Floating or utility close buttons (like 'x' icons) are frequently missed in keyboard navigation testing and require explicit focus indicators to be usable for keyboard-only users.
**Action:** Always apply `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-kharon-cyan focus-visible:ring-offset-4 focus-visible:ring-offset-kharon-charcoal` to utility buttons in this design system.
