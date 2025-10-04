# gp-nestjs-api

Modern NestJS REST API starter preconfigured with MySQL, validation, OpenAPI docs, and production tooling.

## Features
- NestJS 11 REST API with versioned routes and global validation
- Lightweight Kysely query builder on top of `mysql2` (no native binaries, auto schema bootstrap)
- Swagger (OpenAPI) documentation available at `/docs`
- Ready-to-use Docker setup for the API and MySQL database
- Centralized application bootstrap helper shared between runtime and tests
- Opinionated coding standards: ESLint, Prettier, strict DTO validation

## Getting Started
1. **Install dependencies**
   ```bash
   npm install
   ```
2. **Create your environment file**
   ```bash
   cp .env.example .env
   # adjust DATABASE_URL, use `mysql` as host when running via docker-compose
   ```
   If your primary application credentials cannot create databases, also set `DATABASE_ADMIN_URL` with elevated privileges. The admin URL is only used at boot to ensure the database exists.
3. **Start MySQL** (required)
   ```bash
   docker compose up -d mysql
   # or ensure another MySQL instance is running and accessible via DATABASE_URL
   ```
4. **Run the API**
   ```bash
   npm run start:dev
   # http://localhost:3000/api/v1
   # Swagger UI: http://localhost:3000/docs
   ```

> **Schema management:** On startup the app ensures the target database exists and creates the `User` table if it is missing. No external migration binaries are required for the starter workflow.

## Useful Commands
- `npm run lint` / `npm run lint:check` – fix or check lint issues
- `npm run format` / `npm run format:check` – format or verify formatting
- `npm test` / `npm run test:e2e` – run unit or e2e tests
- `npm run build` – compile TypeScript for production

## Continuous Integration
Pull requests and pushes to `dev` (default) and `main` trigger `.github/workflows/ci.yml`, which runs:
- `npm ci`
- `npm run lint:check`
- `npm test`
- `npm run build`

Keep these commands passing locally before opening a PR to avoid CI failures.

## Docker Support
A multi-stage `Dockerfile` and `docker-compose.yml` are provided. To run the full stack:
```bash
docker compose up --build
```
The API will be available on port `APP_PORT` (defaults to `3000`). Update your `.env` `DATABASE_URL` to use `mysql` as the host when running inside Docker (e.g. `mysql://user:password@mysql:3306/gp_nestjs_api`).

> **Tip:** The application boot sequence creates the target database and core tables if they do not exist, but the MySQL server **must** be reachable with the supplied credentials. Provide `DATABASE_ADMIN_URL` if the application user lacks `CREATE DATABASE` permission.

## Project Structure
```
src/
├── common/               # Shared DTOs and utilities
├── config/               # Application bootstrap helpers
├── database/             # MySQL connection + schema bootstrap
├── health/               # Liveness and readiness endpoints
└── users/                # Sample REST resource using Kysely
```

## Next Steps
- Add additional modules that follow the DTO + service pattern demonstrated in `users`
- Implement authentication/authorization when requirements are clarified
- Extend schema bootstrap logic (or adopt a migration tool) as your domain evolves
