## 2026-06-01 - Added missing aria-labels on icon-only close buttons
**Learning:** In Astro components, the "x" close buttons for toasts, mobile drawers, and feedback form dialogs were missing `aria-label`s making them inaccessible to screen readers since they did not have visible text.
**Action:** Adding `aria-label="Close notification"` and similarly named labels improved the screen reader accessibility.

## 2026-06-02 - Fixed unassociated labels in forms
**Learning:** Found that multiple input fields in `src/pages/contact.astro` were missing `id` attributes and their corresponding `label` tags lacked `for` attributes. This breaks the semantic association between labels and their inputs, impacting accessibility (screen readers cannot associate the label with the input) and usability (clicking the label doesn't focus the input).
**Action:** Adding matching `id` and `for` attributes to the form inputs and labels improves screen reader accessibility and usability.
## 2026-06-03 - Keyboard Navigation Enhancements
**Learning:** Interactive elements on the shell layout (like the 'Feedback' and 'Logout' buttons in the PortalHeader) lacked proper `focus-visible` states, impairing keyboard navigability. The design constitution specifies an exact style of `2px solid cyan, 4px offset`.
**Action:** Add Tailwind CSS utility classes `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-kharon-cyan focus-visible:ring-offset-4 focus-visible:ring-offset-kharon-charcoal` to missing layout components to align with design specs and restore full accessibility.
