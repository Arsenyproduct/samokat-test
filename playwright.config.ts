import { defineConfig } from '@playwright/test';

const port = 4173;

export default defineConfig({
  testDir: './tests',
  timeout: 90_000,
  fullyParallel: false,
  reporter: [['list']],
  use: {
    baseURL: `http://localhost:${port}/samokat-test/`,
    trace: 'retain-on-failure',
  },
  projects: [
    {
      name: 'phone-390x844',
      use: { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true },
    },
    {
      name: 'desktop-1440x900',
      use: { viewport: { width: 1440, height: 900 } },
    },
  ],
  webServer: {
    command: `npm run build && npx vite preview --port ${port} --strictPort`,
    port,
    reuseExistingServer: !process.env.CI,
    env: { BASE_PATH: '/samokat-test/' },
  },
});
