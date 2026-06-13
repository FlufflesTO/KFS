## 2025-06-08 - Refactoring the jobs POST API
**Learning:** Refactoring backend endpoints directly benefits developer experience without altering UI.
**Action:** Splitting `src/pages/portal/api/admin/jobs.ts` logic into helper functions.

## 2026-06-13 - Enforcing consistent keyboard focus styles across buttons
**Learning:** Relying on 'focus:' for custom focus rings causes them to show up on mouse clicks, which is visually distracting. Using 'focus-visible:' ensures focus rings only appear when users are navigating via keyboard. Additionally, standardizing on a 4px offset (ring-offset-4) with the Kharon cyan color improves contrast and compliance with the design system's accessibility requirements.
**Action:** Use 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-kharon-cyan focus-visible:ring-offset-4 focus-visible:ring-offset-kharon-charcoal' consistently for interactive elements across the app to provide a clear, accessible focus state without punishing mouse users.
