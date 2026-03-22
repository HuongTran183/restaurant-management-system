import { defineConfig } from '@playwright/test';
import { FRONTEND_BASE_URL } from './tests/e2e/runtime';

/**
 * Mỗi journey là một project; dependencies đảm bảo thứ tự chạy cố định
 * (truyền nhiều file trên CLI không đảm bảo thứ tự).
 * @see ../docs/MANUAL_AND_E2E_TEST_PLAN.md
 */
export default defineConfig({
  testDir: './tests/e2e',
  globalSetup: './tests/e2e/global-setup.ts',
  workers: 1,
  timeout: 60_000,
  fullyParallel: false,
  reporter: [['list']],
  use: {
    baseURL: FRONTEND_BASE_URL,
    trace: 'retain-on-failure',
  },
  projects: [
    { name: '01-customer-reservation', testMatch: 'customer-reservation.spec.ts' },
    {
      name: '02-customer-reservation-lookup',
      testMatch: 'customer-reservation-lookup.spec.ts',
      dependencies: ['01-customer-reservation'],
    },
    {
      name: '03-customer-qr',
      testMatch: 'customer-qr.spec.ts',
      dependencies: ['02-customer-reservation-lookup'],
    },
    {
      name: '04-staff-pos',
      testMatch: 'staff-pos.spec.ts',
      dependencies: ['03-customer-qr'],
    },
    {
      name: '05-staff-menu-outage',
      testMatch: 'staff-menu-outage.spec.ts',
      dependencies: ['04-staff-pos'],
    },
    {
      name: '06-staff-resolve-invoice-payment',
      testMatch: 'staff-resolve-service-invoice-payment.spec.ts',
      dependencies: ['05-staff-menu-outage'],
    },
    {
      name: '07-customer-qr-billing-payment',
      testMatch: 'customer-qr-billing-payment.spec.ts',
      dependencies: ['06-staff-resolve-invoice-payment'],
    },
  ],
});
