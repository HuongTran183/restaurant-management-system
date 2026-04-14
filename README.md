# Restaurant Management System

Backend monolith for restaurant/POS operations, plus a React frontend shell for public booking, QR ordering, and staff dashboard workflows.

## Current MVP Status

Implemented now:
- Spring Boot backend with Flyway migrations, JWT auth, RBAC, menu/category management, QR table flow, ordering, billing, service requests, and reservations
- Public APIs for menu, QR resolve, QR ordering, service requests, and reservations
- Local/test diagnostics for public APIs, including actuator `health`, `metrics`, `httpexchanges`, correlation IDs, and slow-request logging for `/api/public/**`
- Dev-support API for deterministic local/test reset + scenario seeding (`/api/dev/reset`, `/api/dev/scenarios/*`)
- React + Vite frontend shell in `frontend/` for public and staff MVP flows
- Staff workspace actions for reservations, service requests, table/session visibility, floor actions, and cashier loops (`order -> invoice -> payment`)
- Backend integration coverage for auth, public QR ordering, reservation lifecycle, and floor workspace filters
- Frontend automated coverage with Vitest component tests, Playwright journeys, and staff layout visual regression for the main MVP flows

Current limits:
- The admin account is auto-seeded on a fresh database
- Public menu and QR demo flows auto-seed only in the `local` profile, not in tests or production
- Local full-stack compose is for development convenience, not production packaging

## Tech Stack

- Java 21
- Spring Boot 4.0.3
- MySQL 8.4
- Flyway
- Testcontainers
- React 19 + Vite + TypeScript + Tailwind CSS

## Local Development

Port and run-mode tutorial:
- [Local Port Setup Guide](/H:/restaurant-management-system/docs/local-port-setup.md)

### Option A: Run MySQL only, then start backend/frontend on host

Dedicated host-facing ports for this repo:
- Frontend: `15173`
- Backend API: `18080`
- MySQL: `13306`

#### 1. Start MySQL

```powershell
docker compose up -d mysql
```

Local backend profile uses:
- DB: `restaurant_management`
- User: `root`
- Password: `root`

#### 2. Run backend

```powershell
./mvnw.cmd spring-boot:run
```

Main URLs:
- API: [http://127.0.0.1:18080](http://127.0.0.1:18080)
- Swagger UI: [http://127.0.0.1:18080/swagger-ui.html](http://127.0.0.1:18080/swagger-ui.html)

Seed admin defaults:
- Username: `admin`
- Password: `Admin@123456`

#### 3. Run frontend

```powershell
cd frontend
npm ci
npm run dev
```

Frontend env:
- Copy `.env.example` to `.env` at the repo root if you want one shared place to document custom ports
- Copy `frontend/.env.example` to `frontend/.env` if needed
- Host mode defaults to backend `http://127.0.0.1:18080`
- Vite dev server reads `APP_FRONTEND_PORT`, `APP_FRONTEND_PREVIEW_PORT`, and `APP_BACKEND_PORT`
- Vite proxies `/api` to `VITE_API_PROXY_TARGET`, which should point at the same backend origin

Frontend default URL:
- App: [http://127.0.0.1:15173](http://127.0.0.1:15173)

### Option B: Run the full dev stack with Docker Compose

A second compose file now starts MySQL, backend, and frontend together for local development.

```powershell
docker compose --env-file frontend/.env.compose -f compose.full.yaml up -d --build
```

Notes:
- Backend and frontend are both built into images from the current source tree, so the full stack does not depend on a host-built jar or host-built `dist/`
- Backend runs with the `local` profile, seeds the demo data, and exposes a healthcheck that the frontend waits on
- The full stack exposes the same host-facing ports as host mode: backend `18080`, frontend `15173`, and MySQL `13306`
- The first `--build` run can take a couple of minutes because Maven and npm dependencies are resolved inside Docker
- If you need a different reachable host/IP or different ports, edit `frontend/.env.compose` or use a root `.env` file based on `.env.example`
- Stop the stack with:

```powershell
docker compose -f compose.full.yaml down
```

If you want to reset the database, caches, and generated volumes, use:

```powershell
docker compose -f compose.full.yaml down -v
```

Validated now:
- `docker compose --env-file frontend/.env.compose -f compose.full.yaml config`
- `docker compose -f compose.full.yaml ps`

## QR Landing URLs

The backend now generates QR landing URLs for the React route, not the raw JSON resolver.

Default local value:
- `APP_QR_PUBLIC_BASE_URL=http://127.0.0.1:15173/qr`

When you use `compose.full.yaml`, the frontend talks to the backend on:
- `http://127.0.0.1:18080`

When you use `docker compose --env-file frontend/.env.compose -f compose.full.yaml up -d --build`, the QR public base URL defaults to:
- `http://127.0.0.1:15173/qr`

If you want to scan from another device on the same network, replace `localhost` with your machine LAN IP before starting the backend. Example:
- `APP_QR_PUBLIC_BASE_URL=http://192.168.1.25:15173/qr`

For the full-stack compose in that case, also rebuild the frontend with a reachable API URL, for example:
- `VITE_API_BASE_URL=http://192.168.1.25:18080`
- Add the LAN origin to CORS as well, for example:
- `APP_CORS_ALLOWED_ORIGINS=http://127.0.0.1:15173,http://localhost:15173,http://192.168.1.25:15173`

## Demo Seed Data

When you start the backend with the default `local` profile, the app seeds a minimal demo area, table, category, menu item, and QR automatically on a fresh database.

Demo seed defaults:
- Area: `DEMO-HALL`
- Table: `T-01`
- Category: `DEMO-FOOD`
- Menu item: `PHO-DEMO`

The startup log includes the QR `landingUrl`, and the secured table API can also return it:
- `GET /api/tables/{tableId}/qr`

Public QR landing URLs use the React route:
- Default local base: `http://127.0.0.1:15173/qr`
- Open the full URL from the QR response, or visit `http://127.0.0.1:15173/qr/<token>` directly

If you want a blank local database, set `APP_BOOTSTRAP_DEMO=false` before starting the backend.
If you are using `compose.full.yaml`, demo seeding is enabled by default through `APP_BOOTSTRAP_DEMO=true`.

## Diagnostics and Dev Support

Local and test profiles now expose a small diagnostics/dev-support surface to make backend issues easier to prove and E2E data more deterministic.

Enabled by default in `local` and `test`:
- `app.diagnostics.enabled=true`
- `app.diagnostics.slow-request-threshold-ms=1500`
- `app.dev-support.enabled=true`

Useful local endpoints:
- [http://127.0.0.1:18080/actuator/health](http://127.0.0.1:18080/actuator/health)
- [http://127.0.0.1:18080/actuator/metrics](http://127.0.0.1:18080/actuator/metrics)
- [http://127.0.0.1:18080/actuator/httpexchanges](http://127.0.0.1:18080/actuator/httpexchanges)

When diagnostics are enabled:
- public endpoints under `/api/public/**` emit a correlation id
- the backend logs menu timing split for categories/items/total in `PublicMenuController`
- slow or failing public requests log a pool snapshot when Hikari is available
- actuator metrics include:
  - `app.public.api.requests`
  - `app.public.api.slow_requests`
  - `app.public.api.failures`
  - `app.public.menu.steps`

Dev-support endpoints are available only in `local` and `test`, and require an authenticated admin JWT:
- `POST /api/dev/reset`
- `POST /api/dev/scenarios/baseline`
- `POST /api/dev/scenarios/draft-order`
- `POST /api/dev/scenarios/pending-bill`
- `POST /api/dev/scenarios/open-invoice`
- `POST /api/dev/scenarios/payment-history`

Scenario intent:
- `baseline`: demo admin + hall/table/menu/QR available, transaction data reset
- `draft-order`: baseline + open table session + draft staff dine-in order for `T-01`
- `pending-bill`: baseline + QR order + bill request ready for staff resolve/invoice/payment
- `open-invoice`: baseline + confirmed dine-in order + one open invoice ready for cashier actions
- `payment-history`: baseline + paid invoice + completed payment history entry ready for reporting/history checks

Example PowerShell flow:

```powershell
$login = Invoke-RestMethod -Method Post -Uri http://127.0.0.1:18080/api/auth/login -ContentType 'application/json' -Body '{"username":"admin","password":"Admin@123456"}'
$headers = @{ Authorization = "Bearer $($login.accessToken)" }

Invoke-RestMethod -Method Post -Uri http://127.0.0.1:18080/api/dev/reset -Headers $headers
Invoke-RestMethod -Method Post -Uri http://127.0.0.1:18080/api/dev/scenarios/pending-bill -Headers $headers
```

## Testing

### Backend unit + integration tests

```powershell
./mvnw.cmd clean test
```

Current expected result:
- `29` tests
- `0` failures
- `0` skipped when Docker is available

Notes:
- Integration tests use Testcontainers and start their own MySQL containers
- Local MySQL from `docker compose up mysql` is useful for running the app, but not required for the Testcontainers integration suite
- Flyway warns that MySQL `8.4` is newer than the latest version it has verified; migrations still run successfully in this repo
- `compose.full.yaml` is a local development convenience file, not a production deployment recipe
- If you change Docker build inputs for the full stack, rerun `docker compose --env-file frontend/.env.compose -f compose.full.yaml up -d --build`
- If you use the full stack compose, connect to MySQL on host port `13306` and the backend API on host port `18080`

### Frontend build

```powershell
cd frontend
npm run build
```

### Frontend automated tests

```powershell
cd frontend
npm test
npm run test:e2e
```

Kế hoạch smoke / thủ công / thứ tự E2E chi tiết: [docs/MANUAL_AND_E2E_TEST_PLAN.md](docs/MANUAL_AND_E2E_TEST_PLAN.md).

`npm run test:e2e` chạy các journey theo thứ tự cố định (customer → staff → gate persistence) nhờ `projects` + `dependencies` trong `frontend/playwright.config.ts`.

Playwright defaults:
- `npm run test:e2e` assumes the dedicated repo ports by default
- Default frontend URL: `http://127.0.0.1:15173`
- Default backend API URL: `http://127.0.0.1:18080`
- Playwright also follows `APP_FRONTEND_PORT` and `APP_BACKEND_PORT` from the frontend env/runtime
- If you override ports locally, keep `PLAYWRIGHT_BASE_URL`, `PLAYWRIGHT_API_BASE_URL`, and the backend/frontend ports aligned

Run mode summary:
- Host mode: Vite on `15173`, backend on `18080`, MySQL on `13306`
- Compose mode: same host-facing ports: frontend `15173`, backend `18080`, MySQL `13306`
- Using the same external ports in both modes keeps frontend, backend, QR URLs, and Playwright aligned
- If another service owns one of these ports, override all related envs together instead of mixing defaults silently

Current frontend result (cập nhật sau mỗi lần chạy `npm test` / `npm run test:e2e`):
- Vitest: chạy `npm test` để xem số test hiện tại (gần đây: 10 tests / 2 files)
- Playwright: `npm run test:e2e` — customer flows, staff smoke, menu outage regression, layout visual regression, cashier scenario contract checks, staff resolve/payment, và QR billing persistence gate

## Repo Structure

- `src/main/java/` backend application code
- `src/main/resources/db/migration/` Flyway migrations
- `src/test/java/` backend unit and integration tests
- `frontend/` React frontend MVP shell
- `compose.yaml` local MySQL service for development
- `compose.full.yaml` local full-stack compose for MySQL + backend + frontend
- `data/` runtime storage created on demand when the backend runs locally

## Recommended Next Focus

1. Expand the staff frontend from dashboard/workbench into deeper POS workflows such as line-item editing, kitchen-facing order states, and tighter cashier handoff.
2. Add reservation filters/actions for host-heavy days, including bulk triage and clearer assignment views for pending vs confirmed bookings.
3. Harden role-aware staff experiences so waiter/cashier/admin surfaces degrade cleanly by permission.
4. Continue filling remaining MVP gaps such as richer staff CRUD, reporting, and operational screens.
