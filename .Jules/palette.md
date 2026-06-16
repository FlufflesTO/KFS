## 2025-06-08 - Refactoring the jobs POST API
**Learning:** Refactoring backend endpoints directly benefits developer experience without altering UI.
**Action:** Splitting `src/pages/portal/api/admin/jobs.ts` logic into helper functions.

## 2025-06-08 - Added focus-visible states across all buttons and inputs
**Learning:** focus-visible pseudo-class ensures focus rings only trigger during keyboard navigation, preventing visual distraction for mouse users.
**Action:** Replaced `focus:` styles with `focus-visible:` across Button, KharonButton, login form, hr page, contact form, Header, and PortalLayout, matching the design system standard `ring-kharon-cyan` and `ring-offset-kharon-charcoal`.
