import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadEnv } from 'vite';

const envDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const env = loadEnv(process.env.NODE_ENV ?? 'test', envDir, '');
const frontendPort = env.APP_FRONTEND_PORT ?? '15173';
const backendPort = env.APP_BACKEND_PORT ?? '18080';

const DEFAULT_FRONTEND_BASE_URL = `http://127.0.0.1:${frontendPort}`;
const DEFAULT_HOST_API_BASE_URL = `http://127.0.0.1:${backendPort}`;

function normalizeUrl(value: string) {
  return value.replace(/\/$/, '');
}

export const FRONTEND_BASE_URL = normalizeUrl(process.env.PLAYWRIGHT_BASE_URL ?? DEFAULT_FRONTEND_BASE_URL);
export const API_BASE_URL = normalizeUrl(process.env.PLAYWRIGHT_API_BASE_URL ?? DEFAULT_HOST_API_BASE_URL);
export const API_HEALTHCHECK_URL = normalizeUrl(
  process.env.PLAYWRIGHT_API_HEALTHCHECK_URL ?? `${API_BASE_URL}/actuator/health`,
);
export const STARTUP_TIMEOUT_MS = Number(process.env.PLAYWRIGHT_STARTUP_TIMEOUT_MS ?? 120_000);
export const POLL_INTERVAL_MS = Number(process.env.PLAYWRIGHT_POLL_INTERVAL_MS ?? 1_500);
export const REQUEST_TIMEOUT_MS = Number(process.env.PLAYWRIGHT_REQUEST_TIMEOUT_MS ?? 10_000);
