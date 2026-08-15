## 2025-06-08 - Refactoring the jobs POST API
**Learning:** Refactoring backend endpoints directly benefits developer experience without altering UI.
**Action:** Splitting `src/pages/portal/api/admin/jobs.ts` logic into helper functions.
## 2025-06-08 - Keyboard accessibility for floating/utility close buttons
**Learning:** Floating or utility close buttons (e.g., 'x' icons) explicitly require `focus-visible:ring` states alongside their standard hover effects to ensure proper keyboard navigation accessibility. Use `focus:outline-none focus-visible:ring-2 focus-visible:ring-[color] focus-visible:ring-offset-[size] focus-visible:ring-offset-[color]`.
**Action:** Always add explicit `focus-visible:ring` styles to close buttons in toasts, modals, and mobile menus to support keyboard users.
