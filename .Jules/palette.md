## 2025-06-08 - Refactoring the jobs POST API
**Learning:** Refactoring backend endpoints directly benefits developer experience without altering UI.
**Action:** Splitting `src/pages/portal/api/admin/jobs.ts` logic into helper functions.
## 2025-02-14 - Replace focus: with focus-visible:
**Learning:** Interactive elements such as buttons, links, checkboxes, and text inputs across the application (like login, HR forms, and headers) were using the `focus:` pseudo-class for custom focus rings (e.g. `focus:ring-kharon-purple`). This causes the focus ring to appear visually on mouse clicks, which is often a jarring experience and considered a minor UX anti-pattern.
**Action:** Switched all `focus:ring-*` and `focus:border-*` classes to their `focus-visible:` equivalents (`focus-visible:ring-*`, `focus-visible:border-*`) globally across components and pages. This preserves accessibility for keyboard navigation while suppressing the outline for mouse users. Always ensure `focus:outline-none` remains intact unconditionally to strip native browser focus rings entirely.
