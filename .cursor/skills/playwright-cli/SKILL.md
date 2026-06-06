---
name: playwright-cli
description: Run local Playwright E2E tests, execute single spec files, run visual regression tests, and check accessibility rules. Use when writing, debugging, or running tests.
---

# Playwright E2E Testing & Verification Guidelines

Playwright tests live in the `tests/` directory.

## Testing Commands

1. **Run All Tests**:
   ```bash
   npx playwright test
   ```
2. **Run a Single Test File**:
   ```bash
   npx playwright test tests/security-hardening.spec.ts
   ```
3. **Run in Headed Mode**:
   ```bash
   npx playwright test --headed
   ```
4. **Accessibility Checks**:
   The E2E tests run `@axe-core/playwright` audits to verify accessibility compliance. Always make sure new UI elements contain correct ARIA tags, descriptive labels, and logical heading structures.
