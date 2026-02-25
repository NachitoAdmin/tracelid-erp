import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: process.env.BASE_URL || 'https://tracelid-j8am7ly4v-nachitoadmins-projects.vercel.app',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    headless: true,
    extraHTTPHeaders: {
      ...(process.env.VERCEL_AUTOMATION_BYPASS_SECRET
        ? { 'x-vercel-protection-bypass': process.env.VERCEL_AUTOMATION_BYPASS_SECRET }
        : {}),
    },
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
})
