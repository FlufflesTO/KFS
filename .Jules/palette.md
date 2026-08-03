## 2025-06-08 - Refactoring the jobs POST API
**Learning:** Refactoring backend endpoints directly benefits developer experience without altering UI.
**Action:** Splitting `src/pages/portal/api/admin/jobs.ts` logic into helper functions.

## 2023-08-03 - Contextual ARIA labels on list item actions
**Learning:** Buttons with generic text (like "Revoke", "Expire", "Save") inside loops or lists lack context for screen reader users navigating by interactive elements.
**Action:** Always append dynamic contextual data (like item ID or name) to `aria-label` attributes on repetitive action buttons (e.g., `aria-label={"Revoke certificate " + item.id}`) to improve screen reader navigation context without cluttering the visual UI.
