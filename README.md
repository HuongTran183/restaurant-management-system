# Restaurant Management System

Backend monolith for restaurant/POS operations, plus a React frontend shell for public booking, QR ordering, and staff dashboard workflows.

## Current MVP Status

Implemented now:
- Spring Boot backend with Flyway migrations, JWT auth, RBAC, menu/category management, QR table flow, ordering, billing, service requests, and reservations
- Public APIs for menu, QR resolve, QR ordering, service requests, and reservations
- React + Vite frontend shell in `frontend/` for public and staff MVP flows
- Backend integration coverage for auth, public QR ordering, reservation lifecycle, and critical service guards

Current limits:
- Only the admin account is auto-seeded on a fresh database
- Public menu and QR demo flows need menu/table/QR data to be created manually after bootstrap
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

A fresh database only contains roles and the admin user. To demo the public site end-to-end, create these records through Swagger or the secured APIs after logging in as `admin`:
1. Create at least one area and one active dining table.
2. Create at least one active category and one active, available menu item.
3. Generate a QR for the table.
4. Open the generated `landingUrl`, or visit `http://localhost:5173/qr/<token>` directly.

Without that setup, the public menu page can be empty and the QR journey has no valid token to resolve.

## Testing

### Backend unit + integration tests

```powershell
./mvnw.cmd clean test
```

Current expected result:
- `15` tests
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
