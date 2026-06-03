import { expect, test } from "@playwright/test";

test.describe("IndexedDB Wrapper", () => {
  test("should be able to open a database and perform CRUD operations", async ({ page }) => {
    // Navigate to the test page
    await page.goto("/tests/indexed-db");
    
    // Wait for the SUCCESS message
    const results = page.locator("#test-results");
    await expect(results).toHaveText("SUCCESS", { timeout: 10000 });
  });
});
