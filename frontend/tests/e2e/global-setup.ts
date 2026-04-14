import {
  API_HEALTHCHECK_URL,
  FRONTEND_BASE_URL,
  POLL_INTERVAL_MS,
  REQUEST_TIMEOUT_MS,
  STARTUP_TIMEOUT_MS,
} from './runtime';

async function fetchWithTimeout(url: string) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    return await fetch(url, { signal: controller.signal });
  } finally {
    clearTimeout(timeoutId);
  }
}

async function waitForHealthyResponse(url: string) {
  const deadline = Date.now() + STARTUP_TIMEOUT_MS;
  let lastError: unknown = null;

  while (Date.now() < deadline) {
    try {
      const response = await fetchWithTimeout(url);
      if (response.ok) {
        return;
      }

      lastError = new Error(
        `Received ${response.status} from ${url}. Check PLAYWRIGHT_API_BASE_URL / PLAYWRIGHT_API_HEALTHCHECK_URL and confirm the expected host or compose stack is running.`,
      );
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
    waitForHealthyResponse(API_HEALTHCHECK_URL),
  ]);
}
