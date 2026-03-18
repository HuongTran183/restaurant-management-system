const FRONTEND_BASE_URL = (process.env.PLAYWRIGHT_BASE_URL ?? 'http://127.0.0.1:5173').replace(/\/$/, '');
const API_BASE_URL = (process.env.PLAYWRIGHT_API_BASE_URL ?? 'http://127.0.0.1:18080').replace(/\/$/, '');
const STARTUP_TIMEOUT_MS = 120_000;
const POLL_INTERVAL_MS = 1_500;

async function waitForHealthyResponse(url: string) {
  const deadline = Date.now() + STARTUP_TIMEOUT_MS;
  let lastError: unknown = null;

  while (Date.now() < deadline) {
    try {
      const response = await fetch(url);
      if (response.ok) {
        return;
      }

      lastError = new Error(`Received ${response.status} from ${url}`);
    } catch (error) {
      lastError = error;
    }

    await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
  }

  if (lastError instanceof Error) {
    throw lastError;
  }

  throw new Error(`Timed out waiting for ${url}`);
}

export default async function globalSetup() {
  await Promise.all([
    waitForHealthyResponse(`${FRONTEND_BASE_URL}/`),
    waitForHealthyResponse(`${API_BASE_URL}/api/public/menu`),
  ]);
}
