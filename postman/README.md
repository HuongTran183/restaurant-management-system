# Postman Quick Start
Files:
- `postman/restaurant-management-system.postman_collection.json`
- `postman/local.postman_environment.json`
- `postman/docker.postman_environment.json`
## Import
1. Open Postman -> Import.
2. Import the collection file and one environment file.
3. Select the imported environment.
## Run order (recommended)
1. `00 Health`
2. `01 Auth & Identity` -> run `POST /api/auth/login`
3. `09 Dev Support` -> run `POST /api/dev/scenarios/baseline` (local/test profile only)
4. Run other folders as needed.
## Notes
- Collection-level auth is `Bearer {{accessToken}}`.
- Public endpoints are set to `No Auth` per request.
- `menuImagePath` points to an existing sample image in this repo.
- Some write endpoints can return conflict/validation if data already exists; adjust env values if needed.
