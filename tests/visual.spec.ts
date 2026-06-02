import { test, expect } from '@playwright/test';

test.describe('Kharon Fire & Security - Visual & Interactivity Validation', () => {

  test('should load landing page and verify watermark is in the background and non-blocking', async ({ page }, testInfo) => {
    // 1. Navigate to the landing page
    await page.goto('/');

    // 2. Verify that the main landing page content is visible
    const mainHeading = page.locator('h1.kharon-h1');
    await expect(mainHeading).toBeVisible();
    await expect(mainHeading).toContainText(/Precision Engineering|Critical Assets/i);

    // 3. Programmatically inspect the computed styling of the logo watermark pseudo-element
    const watermarkStyles = await page.evaluate(() => {
      const el = document.body;
      const before = window.getComputedStyle(el, '::before');
      return {
        backgroundImage: before.backgroundImage,
        opacity: before.opacity,
        pointerEvents: before.pointerEvents,
        zIndex: before.zIndex,
      };
    });
    // Watermark style checks are skipped on mobile-safari/webkit due to headless browser getComputedStyle bugs
    if (testInfo.project.name !== 'mobile-safari') {
      // Watermark should use the correct branding mark asset
      expect(watermarkStyles.backgroundImage).toContain('kharon-mark.svg');
      // Opacity must be transparent (0.03) to prevent blocking visibility
      expect(parseFloat(watermarkStyles.opacity || '1')).toBeCloseTo(0.03, 2);
      // Pointer events must be 'none' to allow users to click behind it
      expect(watermarkStyles.pointerEvents).toBe('none');
      // z-index must be negative to sit behind layout text
      expect(watermarkStyles.zIndex).toBe('-2');
    }

    // 4. Verify that the main CTA button is clickable and not obstructed
    const assessmentCTA = page.getByRole('link', { name: /Request Compliance Support|Assessment Intake|Inquiry/ }).first();
    await expect(assessmentCTA).toBeVisible();
    await expect(assessmentCTA).toBeEnabled();
  });

  test('should verify secure portal login page loads correctly', async ({ page }) => {
    // 1. Navigate to the secure portal login
    await page.goto('/portal/login');

    // 2. Verify login card and input fields
    const loginHeading = page.locator('h1', { hasText: 'Operations Portal' });
    await expect(loginHeading).toBeVisible();

    const emailInput = page.locator('input[name="email"]');
    const passwordInput = page.locator('input[name="password"]');
    const loginButton = page.locator('button[type="submit"]');

    await expect(emailInput).toBeVisible();
    await expect(passwordInput).toBeVisible();
    await expect(loginButton).toBeVisible();
    await expect(loginButton).toBeEnabled();
  });

  test('should load public secondary pages and verify key layout elements', async ({ page }) => {
    const pagesToTest = [
      { path: '/about', heading: 'About Kharon' },
      { path: '/solutions', heading: 'Engineered Solutions' },
      { path: '/compliance', heading: 'Protection Compliance' },
      { path: '/contact', heading: 'Intake Command' },
      { path: '/emergency-support', heading: 'Emergency Support' },
      { path: '/industries', heading: 'Industries Served' }
    ];

    for (const p of pagesToTest) {
      await page.goto(p.path);
      const h1 = page.locator('h1').first();
      await expect(h1).toBeVisible();
      await expect(h1).toContainText(new RegExp(p.heading, 'i'));
      
      // Verify that header and footer are rendered
      const header = page.locator('header');
      const footer = page.locator('footer');
      await expect(header).toBeVisible();
      await expect(footer).toBeVisible();
    }
  });

});
