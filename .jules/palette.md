## 2025-06-08 - Refactoring the jobs POST API
**Learning:** Refactoring backend endpoints directly benefits developer experience without altering UI.
**Action:** Splitting `src/pages/portal/api/admin/jobs.ts` logic into helper functions.
## 2026-09-08 - Accessible Custom Drawers and Modals
**Learning:** Custom UI elements like drawers and modals that do not use semantic HTML elements (like <dialog> or <details>) require explicit ARIA attributes (aria-expanded and aria-controls) to communicate their state and relationships to screen reader users. The aria-expanded attribute must be dynamically updated via JavaScript.
**Action:** Always add aria-expanded="false" and aria-controls="[target-id]" to buttons that trigger custom modals or drawers, and ensure JavaScript updates the aria-expanded value when the element opens or closes.
