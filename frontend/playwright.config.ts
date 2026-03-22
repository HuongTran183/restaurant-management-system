import { defineConfig } from '@playwright/test';
import { FRONTEND_BASE_URL } from './tests/e2e/runtime';

export default defineConfig({
  testDir: './tests/e2e',
  globalSetup: './tests/e2e/global-setup.ts',
  // Chạy serial để tránh tranh chấp dữ liệu giữa các test
  workers: 1,
  timeout: 60_000,
  fullyParallel: false,
  reporter: [['list']],
  use: {
    baseURL: FRONTEND_BASE_URL,
    trace: 'retain-on-failure',
  },
});
