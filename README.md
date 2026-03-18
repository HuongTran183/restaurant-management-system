# Restaurant Management System

Backend monolith for restaurant/POS operations, plus a React frontend shell for public booking, QR ordering, and staff dashboard workflows.

## Current MVP Status

Implemented now:
- Spring Boot backend with Flyway migrations, JWT auth, RBAC, menu/category management, QR table flow, ordering, billing, service requests, and reservations
- Public APIs for menu, QR resolve, QR ordering, service requests, and reservations
- React + Vite frontend shell in `frontend/` for public and staff MVP flows
- Staff workspace actions for reservations, service requests, table/session visibility, floor actions, and cashier loops (`order -> invoice -> payment`)
- Backend integration coverage for auth, public QR ordering, reservation lifecycle, and floor workspace filters
- Frontend automated coverage with Vitest component tests and Playwright journeys for the main MVP flows

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

### Option A: Run MySQL only, then start backend/frontend on host

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
- API: [http://localhost:8080](http://localhost:8080)
- Swagger UI: [http://localhost:8080/swagger-ui.html](http://localhost:8080/swagger-ui.html)

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
- Copy `frontend/.env.example` to `frontend/.env` if needed
- Default API base URL: `http://localhost:8080`

Frontend default URL:
- App: [http://localhost:5173](http://localhost:5173)

### Option B: Run the full dev stack with Docker Compose

A second compose file now starts MySQL, backend, and frontend together for local development.

```powershell
docker compose --env-file frontend/.env.compose -f compose.full.yaml up -d --build
```

Notes:
- Backend and frontend are both built into images from the current source tree, so the full stack does not depend on a host-built jar or host-built `dist/`
- Backend runs with the `local` profile, seeds the demo data, and exposes a healthcheck that the frontend waits on
- The full stack exposes backend on `18080`, frontend on `5173`, and MySQL on host port `3307`
- The first `--build` run can take a couple of minutes because Maven and npm dependencies are resolved inside Docker
- If you need a different reachable host/IP for browser clients or QR URLs, edit `frontend/.env.compose` or pass your own `--env-file`
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
- `APP_QR_PUBLIC_BASE_URL=http://localhost:5173/qr`

When you use `compose.full.yaml`, the frontend talks to the backend on:
- `http://127.0.0.1:18080`

When you use `docker compose --env-file frontend/.env.compose -f compose.full.yaml up -d --build`, the QR public base URL defaults to:
- `http://127.0.0.1:5173/qr`

If you want to scan from another device on the same network, replace `localhost` with your machine LAN IP before starting the backend. Example:
- `APP_QR_PUBLIC_BASE_URL=http://192.168.1.25:5173/qr`

For the full-stack compose in that case, also rebuild the frontend with a reachable API URL, for example:
- `VITE_API_BASE_URL=http://192.168.1.25:18080`

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
- Default local base: `http://localhost:5173/qr`
- Open the full URL from the QR response, or visit `http://localhost:5173/qr/<token>` directly

If you want a blank local database, set `APP_BOOTSTRAP_DEMO=false` before starting the backend.
If you are using `compose.full.yaml`, demo seeding is enabled by default through `APP_BOOTSTRAP_DEMO=true`.

## Testing

### Backend unit + integration tests

```powershell
./mvnw.cmd clean test
```

Current expected result:
- `21` tests
- `0` failures
- `0` skipped when Docker is available

Notes:
- Integration tests use Testcontainers and start their own MySQL containers
- Local MySQL from `docker compose up mysql` is useful for running the app, but not required for the Testcontainers integration suite
- Flyway warns that MySQL `8.4` is newer than the latest version it has verified; migrations still run successfully in this repo
- `compose.full.yaml` is a local development convenience file, not a production deployment recipe
- If you change Docker build inputs for the full stack, rerun `docker compose --env-file frontend/.env.compose -f compose.full.yaml up -d --build`
- If you use the full stack compose, connect to MySQL on host port `3307` and the backend API on host port `18080`

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

Current frontend result:
- `5` Vitest assertions passed
- `3` Playwright journeys passed

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
