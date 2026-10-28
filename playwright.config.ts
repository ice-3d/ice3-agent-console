import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  retries: 0,
  use: {
    trace: 'retain-on-failure',
  },
  webServer: [
    {
      command: 'ICE_AGENT_PACE=0 npm run dev:api',
      url: 'http://127.0.0.1:8099/health',
      reuseExistingServer: false,
      timeout: 120_000,
    },
    {
      command: 'npm run dev:web -- --host 127.0.0.1 --port 8110',
      url: 'http://127.0.0.1:8110',
      reuseExistingServer: false,
      timeout: 120_000,
    },
    {
      command: 'npm run build:demo && npx http-server dist -p 8111 -c-1',
      url: 'http://127.0.0.1:8111',
      reuseExistingServer: false,
      timeout: 180_000,
    },
  ],
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
  ],
});
