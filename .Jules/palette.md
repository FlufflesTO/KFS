## 2025-06-08 - Refactoring the jobs POST API
**Learning:** Refactoring backend endpoints directly benefits developer experience without altering UI.
**Action:** Splitting `src/pages/portal/api/admin/jobs.ts` logic into helper functions.

## 2025-06-09 - Use focus-visible for Button focus rings
**Learning:** Using generic `focus:` for focus rings on clickable elements like Buttons can cause visual distraction for mouse users, making the UI feel clunky as rings persist after clicking.
**Action:** Always use the `focus-visible:` pseudo-class (e.g., `focus-visible:ring-2`) instead of `focus:` for custom focus rings on interactive elements like buttons, while unconditionally retaining `focus:outline-none` to strip away native focus rings. Applied to `Button`, `KharonButton` and layout toggles.
