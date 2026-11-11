## 2025-02-18 - Missing Explicit Button Types

**Learning:** Astro and React components can render `<button>` elements within layouts or general UI components that unintentionally act as `type="submit"` due to standard HTML behavior. If a layout component (like `PortalLayout.astro`) containing these buttons is ever rendered in the DOM near or inside a form context, interacting with these layout buttons (like mobile drawer toggles or feedback modal controls) can trigger unintended page reloads or form submissions, frustrating users.

**Action:** Always explicitly define `type="button"` on interactive UI elements (like modal toggles, drawer controls, or close buttons) that are not meant to submit a form, especially in shared layout shells that wrap varying content.
