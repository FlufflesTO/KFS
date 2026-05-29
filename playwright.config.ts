import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright Test Configuration
 * Purpose: Validates build assets, visual layout, and core interactivity before deployment.
 */
export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [['html', { open: 'never' }]],
  use: {
    baseURL: 'http://localhost:4321',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    viewport: { width: 1280, height: 720 },
  },
  projects: [
    {
      name: 'desktop-chrome',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'mobile-safari',
      use: { 
        ...devices['iPhone 14 Pro'],
        colorScheme: 'light', 
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
  ],
  webServer: {
    command: 'npm run preview',
    url: 'http://localhost:4321',
    reuseExistingServer: !process.env.CI,
    stdout: 'ignore',
    stderr: 'pipe',
    timeout: 30000,
  },
});
