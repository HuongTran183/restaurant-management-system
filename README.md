# Restaurant Management System

Backend monolith for restaurant/POS operations, plus a React frontend shell for public booking, QR ordering, and staff dashboard workflows.

## Current MVP Status

Implemented now:
- Spring Boot backend with Flyway migrations, JWT auth, RBAC, menu/category management, QR table flow, ordering, billing, service requests, and reservations
- Public APIs for menu, QR resolve, QR ordering, service requests, and reservations
- React + Vite frontend shell in `frontend/` for public and staff MVP flows
- Backend integration coverage for auth, public QR ordering, reservation lifecycle, and critical service guards

Current limits:
- The admin account is auto-seeded on a fresh database
- Public menu and QR demo flows auto-seed only in the `local` profile, not in tests or production
- Staff frontend is still a thin operational dashboard, not the full POS surface yet

## Tech Stack

- Java 21
- Spring Boot 4.0.3
- MySQL 8.4
- Flyway
- Testcontainers
- React 19 + Vite + TypeScript + Tailwind CSS

## Local Development

### 1. Start MySQL for local app development

```powershell
docker compose up -d mysql
```

Local backend profile uses:
- DB: `restaurant_management`
- User: `root`
- Password: `root`

### 2. Run backend

```powershell
./mvnw.cmd spring-boot:run
```

The app uses the `local` profile by default. Main URLs:
- API: [http://localhost:8080](http://localhost:8080)
- Swagger UI: [http://localhost:8080/swagger-ui.html](http://localhost:8080/swagger-ui.html)

Seed admin defaults:
- Username: `admin`
- Password: `Admin@123456`

### 3. Run frontend

```powershell
cd frontend
npm install
npm run dev
```

Frontend env:
- Copy `frontend/.env.example` to `frontend/.env` if needed
- Default API base URL: `http://localhost:8080`

Frontend default URL:
- App: [http://localhost:5173](http://localhost:5173)

### 4. Configure QR landing URLs for local devices

The backend now generates QR landing URLs for the React route, not the raw JSON resolver.

Default local value:
- `APP_QR_PUBLIC_BASE_URL=http://localhost:5173/qr`

If you want to scan from another device on the same network, replace `localhost` with your machine LAN IP before starting the backend. Example:
- `APP_QR_PUBLIC_BASE_URL=http://192.168.1.25:5173/qr`

### 5. Seed demo data for public menu and QR flows

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

## Testing

### Backend unit + integration tests

```powershell
./mvnw.cmd clean test
```

Current expected result:
- `19` tests
- `0` failures
- `0` skipped when Docker is available

Notes:
- Integration tests use Testcontainers and start their own MySQL containers.
- Local MySQL from `docker compose up mysql` is useful for running the app, but not required for the Testcontainers integration suite.
- If your Docker daemon requires a different API compatibility level, you can override the Maven test property with `-Ddocker.api.version.for.tests=<version>`.

### Frontend build

```powershell
cd frontend
npm run build
```

## Repo Structure

- `src/main/java/` backend application code
- `src/main/resources/db/migration/` Flyway migrations
- `src/test/java/` backend unit and integration tests
- `frontend/` React frontend MVP shell
- `compose.yaml` local MySQL service for development

## Recommended Next Focus

1. Expand the staff frontend from dashboard-only into deeper POS workflows.
2. Add frontend tests and Playwright end-to-end coverage.
3. Improve local orchestration with a fuller compose/dev workflow for backend + frontend.
4. Continue filling remaining MVP gaps such as richer staff CRUD and operational screens.
