# Local Port Setup Guide

## Default dedicated ports

This repo no longer uses the crowded local defaults like `5173`, `8080`, and `3306`.

Default repo ports:

| Service | Default port |
| --- | --- |
| Frontend dev server | `15173` |
| Frontend preview | `14173` |
| Backend API | `18080` |
| MySQL (host-facing) | `13306` |

These defaults are used so multiple local projects can run side by side with less conflict.

## Which file controls what

Use these files as your local source of truth:

| File | Purpose |
| --- | --- |
| [`.env.example`](/H:/restaurant-management-system/.env.example) | Root env template for compose and shared port documentation |
| [`frontend/.env.example`](/H:/restaurant-management-system/frontend/.env.example) | Frontend dev/proxy template |
| [`frontend/.env.compose`](/H:/restaurant-management-system/frontend/.env.compose) | Compose defaults for the full dev stack |

Recommended setup:

1. Copy [`.env.example`](/H:/restaurant-management-system/.env.example) to `.env` at the repo root when you want custom compose ports.
2. Copy [`frontend/.env.example`](/H:/restaurant-management-system/frontend/.env.example) to `frontend/.env` when you want custom frontend dev ports or proxy targets.
3. Keep `APP_FRONTEND_PORT`, `APP_BACKEND_PORT`, `APP_DB_PORT`, `APP_QR_PUBLIC_BASE_URL`, and `VITE_API_BASE_URL` aligned.

## Host mode

Use host mode when you want MySQL in Docker but backend/frontend on your machine.

### 1. Start MySQL

```powershell
docker compose up -d mysql
```

This exposes MySQL on `localhost:13306` by default.

### 2. Run backend

In PowerShell:

```powershell
$env:APP_BACKEND_PORT='18080'
$env:APP_DB_PORT='13306'
./mvnw.cmd spring-boot:run
```

### 3. Run frontend

In a second PowerShell window:

```powershell
cd frontend
npm ci
npm run dev
```

By default the frontend runs on `http://127.0.0.1:15173` and proxies `/api` to `http://127.0.0.1:18080`.

## Compose mode

Use compose mode when you want MySQL, backend, and frontend to come up together.

```powershell
docker compose --env-file frontend/.env.compose -f compose.full.yaml up -d --build
```

Default external ports in compose are the same as host mode:

- Frontend: `15173`
- Backend: `18080`
- MySQL: `13306`

This keeps QR URLs, Playwright, and browser testing aligned across both run modes.

## How to change ports safely

If another project already owns one of the dedicated repo ports, do not change only one service.
Change the whole set together.

Example custom port set:

```powershell
$env:APP_FRONTEND_PORT='16173'
$env:APP_FRONTEND_PREVIEW_PORT='16174'
$env:APP_BACKEND_PORT='19080'
$env:APP_DB_PORT='13316'
$env:APP_QR_PUBLIC_BASE_URL='http://127.0.0.1:16173/qr'
$env:VITE_API_BASE_URL='http://127.0.0.1:19080'
$env:VITE_API_PROXY_TARGET='http://127.0.0.1:19080'
$env:PLAYWRIGHT_BASE_URL='http://127.0.0.1:16173'
$env:PLAYWRIGHT_API_BASE_URL='http://127.0.0.1:19080'
$env:PLAYWRIGHT_API_HEALTHCHECK_URL='http://127.0.0.1:19080/actuator/health'
```

After that:

1. Start backend in the same shell.
2. Start frontend in a shell that has the same env values, or write the same values into `frontend/.env`.
3. Run Playwright in a shell that has the same `PLAYWRIGHT_*` values.

If you open the frontend from another device via LAN IP, also add that origin to backend CORS.
Example:

```powershell
$env:APP_CORS_ALLOWED_ORIGINS='http://127.0.0.1:16173,http://localhost:16173,http://192.168.1.25:16173'
```

## What changes automatically now

With the new port setup:

- Spring Boot reads `APP_BACKEND_PORT`.
- Local datasource reads `APP_DB_PORT`.
- Vite reads `APP_FRONTEND_PORT`, `APP_FRONTEND_PREVIEW_PORT`, and `APP_BACKEND_PORT`.
- Playwright defaults follow the same frontend/backend port values.
- CORS allowed origins follow the configured frontend ports.
- Compose host bindings for MySQL, backend, and frontend are overrideable by env.

## Diagnostics and test scenarios on the dedicated ports

With the standardized local ports, the repo also assumes these local-only diagnostics/dev-support URLs by default:

- Health: `http://127.0.0.1:18080/actuator/health`
- Metrics: `http://127.0.0.1:18080/actuator/metrics`
- HTTP exchanges: `http://127.0.0.1:18080/actuator/httpexchanges`
- Dev reset: `POST http://127.0.0.1:18080/api/dev/reset`
- Dev scenarios: `POST http://127.0.0.1:18080/api/dev/scenarios/{baseline|draft-order|pending-bill|open-invoice|payment-history}`

These endpoints exist only in `local` and `test`, and the `/api/dev/**` endpoints require an admin JWT.

Because host mode and compose mode now expose the same frontend/backend ports, Playwright and manual test steps can reuse the same URLs, healthchecks, and dev-support contracts in both modes.

## Verification checklist

Host mode:

```powershell
docker compose up -d mysql
./mvnw.cmd test
cd frontend
npm run build
npm test
```

E2E:

```powershell
cd frontend
npm run test:e2e
```

If e2e fails at startup, check:

1. The frontend URL in `PLAYWRIGHT_BASE_URL`.
2. The backend healthcheck URL in `PLAYWRIGHT_API_HEALTHCHECK_URL`.
3. Whether the backend is actually listening on `APP_BACKEND_PORT`.
