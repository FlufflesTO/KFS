## 2026-06-01 - Added missing aria-labels on icon-only close buttons
**Learning:** In Astro components, the "x" close buttons for toasts, mobile drawers, and feedback form dialogs were missing `aria-label`s making them inaccessible to screen readers since they did not have visible text.
**Action:** Adding `aria-label="Close notification"` and similarly named labels improved the screen reader accessibility.

## 2026-06-02 - Fixed unassociated labels in forms
**Learning:** Found that multiple input fields in `src/pages/contact.astro` were missing `id` attributes and their corresponding `label` tags lacked `for` attributes. This breaks the semantic association between labels and their inputs, impacting accessibility (screen readers cannot associate the label with the input) and usability (clicking the label doesn't focus the input).
**Action:** Adding matching `id` and `for` attributes to the form inputs and labels improves screen reader accessibility and usability.

## 2026-06-03 - Fixed unassociated search inputs and filters in portal panels
**Learning:** Portal dashboard panels often use visually distinct search bars and status filters that do not have traditional `<label>` tags. Since they lack an associated label tag, screen readers have no context for what these inputs do, causing accessibility issues.
**Action:** Adding explicit `aria-label` attributes to these unassociated search `<input>` and filter `<select>` elements ensures screen readers can properly announce their purpose.
