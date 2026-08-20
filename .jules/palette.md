## 2025-06-08 - Refactoring the jobs POST API
**Learning:** Refactoring backend endpoints directly benefits developer experience without altering UI.
**Action:** Splitting `src/pages/portal/api/admin/jobs.ts` logic into helper functions.
## 2025-06-08 - Keyboard Navigation Consistency
**Learning:** Floating or utility close buttons (e.g., "×" icons) across the codebase often miss `focus-visible` styles, creating inconsistent keyboard navigation experiences for visually impaired users.
**Action:** Always ensure `.focus-visible:ring-2` (and typically `focus-visible:outline-none`) are applied to floating interactive elements, tying the ring color to existing brand tokens like `kharon-cyan` or `white` for high contrast.
