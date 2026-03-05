# Food Book Status

## Done

- Reused the provided PayOne template assets by extracting and copying image/font assets into the frontend.
- Created a monorepo-style structure with `frontend/`, `backend/`, and `database/`.
- Added root workspace orchestration in `package.json`.
- Added Docker setup with `docker-compose.yml`, `backend/Dockerfile`, and `frontend/Dockerfile`.
- Added MySQL schema in `database/schema.sql`.
- Added role seed data for `USER`, `ADMIN`, and `SUPER_ADMIN`.
- Implemented Express app structure under `backend/src/`.
- Added JWT access-token auth.
- Added refresh-token rotation with database-backed token hashes.
- Added `authenticate` middleware.
- Added `authorize(role[])` middleware.
- Added bcrypt password hashing.
- Added login rate limiting.
- Added Helmet, CORS, request logging, and centralized error handling.
- Added auth APIs:
  - `POST /api/auth/register`
  - `POST /api/auth/login`
  - `POST /api/auth/refresh`
  - `POST /api/auth/logout`
- Added cashbook APIs:
  - `POST /api/cashbook/entry`
  - `GET /api/cashbook/entries`
  - `PUT /api/cashbook/entry/:id`
  - `DELETE /api/cashbook/entry/:id`
- Added admin APIs:
  - `GET /api/admin/users`
  - `PUT /api/admin/assign-role`
  - `GET /api/admin/reports`
- Implemented RBAC rules in backend logic:
  - `USER` can manage only own entries
  - `ADMIN` can view all entries and reports
  - `SUPER_ADMIN` can assign roles and delete any entry
- Built Next.js App Router frontend.
- Set root route to redirect directly to `/login`.
- Added `/login` and `/register` pages.
- Added auth state with Context API.
- Added Axios client with refresh-on-401 handling.
- Added protected route wrapper.
- Built mobile-first dashboard UI with:
  - sticky summary
  - bottom navigation
  - floating action button
  - modal create/edit entry form
  - date filters
  - pull-to-refresh style interaction
  - pagination
  - PDF and Excel export
- Built admin screen with:
  - total users
  - total entries
  - global summary
  - user filter
  - role management for `SUPER_ADMIN`
- Added profile drawer from the top-right account area.
- Added profile update flow with avatar picture upload support.
- Added terms/version panel for `Food Book v1.0`.
- Added richer cash entries with:
  - entry name
  - category
  - payment method (`Cash`, `Online`, `Card`, `UPI`)
- Added `SUPER_ADMIN` managed-user creation flow.
- Added env example files.
- Added README with local and Docker run instructions.

## Pending

- Install dependencies with `npm install`.
- Create actual env files:
  - `backend/.env`
  - `frontend/.env.local`
- Run MySQL locally or via Docker.
- Apply `database/schema.sql` to the database.
- Run the frontend and backend to verify there are no build/runtime issues.
- Apply the database upgrade in `database/v1_1_upgrade.sql` to existing local databases.
- Test auth flow end to end:
  - register
  - login
  - refresh token
  - logout
- Test RBAC flow end to end:
  - `USER`
  - `ADMIN`
  - `SUPER_ADMIN`
- Verify admin reports and role assignment against real seeded users.
- Verify PDF and Excel exports in browser.
- Add production hardening if needed:
  - stricter cookie settings for deployed HTTPS
  - API tests
  - frontend component/integration tests
  - seed script for initial `SUPER_ADMIN`

## Important Notes

- The app code was created, but it was not executed in this environment.
- No package installation, build, or runtime validation was performed here.
- A first-pass test cycle is still required before calling this production-ready.
