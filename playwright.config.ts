import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright Test Configuration
 * Purpose: Validates build assets, visual layout, and core interactivity before deployment.
 * 
 * CI Note: Only chromium is installed in CI (via `npx playwright install chromium --with-deps`).
 * WebKit/Safari projects are skipped in CI to prevent missing-browser failures.
 */

const allProjects = [
  {
    name: 'desktop-chrome',
    use: { ...devices['Desktop Chrome'] },
  },
  {
    name: 'mobile-safari',
    use: { 
      ...devices['iPhone 14 Pro'],
      colorScheme: 'light' as const, 
    },
  },
  {
    name: 'mobile-android-3g',
    use: { 
      ...devices['Pixel 7'],
      contextOptions: {
        offline: false,
      }
    },
  }
];

// In CI, only run chromium-based projects (desktop-chrome, mobile-android-3g)
const ciProjects = allProjects.filter(p => p.name !== 'mobile-safari');

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: [['html', { open: 'never' }], ['list']],
  use: {
    baseURL: 'http://localhost:4321',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    viewport: { width: 1280, height: 720 },
  },
  projects: process.env.CI ? ciProjects : allProjects,
  webServer: {
    command: 'npm run preview',
    url: 'http://localhost:4321',
    reuseExistingServer: !process.env.CI,
    stdout: 'ignore',
    stderr: 'pipe',
    timeout: 60000,
  },
  // Global setup for integration tests
  // Note: Uncomment when database seeding is automated
  // globalSetup: './tests/setup.ts',
});

