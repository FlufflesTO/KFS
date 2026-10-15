## 2025-06-08 - Refactoring the jobs POST API
**Learning:** Refactoring backend endpoints directly benefits developer experience without altering UI.
**Action:** Splitting `src/pages/portal/api/admin/jobs.ts` logic into helper functions.
## 2024-03-08 - Keyboard Focus States for Native Summary Elements
**Learning:** Native `<summary>` elements, which behave like buttons and are used for custom-styled dropdown menus, often lose their browser-default focus rings when heavily styled with Tailwind or custom CSS resets. This creates an accessibility issue where keyboard navigation (tabbing) provides no visual feedback on which element is focused.
**Action:** When styling `<summary>` elements for custom dropdowns (like navigation menus or accordions), always explicitly define focus states using Tailwind's `focus-visible` utility (e.g., `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color] focus-visible:ring-offset-2`).
